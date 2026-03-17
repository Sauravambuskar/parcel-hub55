import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-prayog-auth, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate using Prayog auth from header
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
      if (!authenticatedUserId) {
        throw new Error('Missing user_id');
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const userId = authenticatedUserId;
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';

    if (action === 'list') {
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ addresses: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save') {
      const { label, name, phone, flat_no, address, city, state, pincode } = body;
      if (!name || !phone || !address || !city || !state || !pincode) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('saved_addresses')
        .insert({ user_id: userId, label, name, phone, flat_no, address, city, state, pincode })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ address: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const addressId = body.address_id;
      if (!addressId) {
        return new Response(JSON.stringify({ error: 'address_id is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('saved-addresses error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
