import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-prayog-auth',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const prayogAuthHeader = req.headers.get('x-prayog-auth');
    if (!prayogAuthHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let authenticatedUserId: string;
    try {
      const prayogAuth = JSON.parse(prayogAuthHeader);
      authenticatedUserId = prayogAuth.user_id;
      if (!authenticatedUserId) throw new Error('Missing user_id');
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { booking_id, reason, partner_error, partner_status_at_attempt, previous_booking_status } = body || {};

    if (!booking_id || !reason) {
      return new Response(JSON.stringify({ error: 'booking_id and reason are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify booking ownership server-side to prevent spoofing
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, user_id')
      .eq('id', booking_id)
      .maybeSingle();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (booking.user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('cancellation_disputes')
      .insert({
        booking_id,
        user_id: authenticatedUserId,
        reason: String(reason).slice(0, 1000),
        partner_error: partner_error ? String(partner_error).slice(0, 2000) : null,
        partner_status_at_attempt: partner_status_at_attempt || null,
        previous_booking_status: previous_booking_status || null,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, dispute: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[raise-cancellation-dispute] error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
