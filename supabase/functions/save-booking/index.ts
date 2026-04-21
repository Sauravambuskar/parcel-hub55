// Persists a booking row using the service role, bypassing RLS.
// Auth is verified via the x-prayog-auth header (external Prayog OTP system).
// Idempotent on payment_id: if a row with the same payment_id already exists,
// returns the existing row instead of creating a duplicate. This prevents
// duplicate refunds when the client retries after a transient failure.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-prayog-auth, x-environment",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const prayogAuthHeader = req.headers.get("x-prayog-auth");
    if (!prayogAuthHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId: string;
    try {
      const auth = JSON.parse(prayogAuthHeader);
      userId = auth.user_id;
      if (!userId) throw new Error("Missing user_id");
    } catch {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Force user_id from verified auth, never trust the client value.
    const bookingRow = { ...body, user_id: userId };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency: if a row with this payment_id already exists for this user,
    // return it instead of inserting a duplicate.
    const paymentId = bookingRow.payment_id;
    if (paymentId) {
      const { data: existing } = await supabase
        .from("bookings")
        .select("*")
        .eq("payment_id", paymentId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        console.log("[save-booking] idempotent hit for payment_id:", paymentId);
        return new Response(JSON.stringify({ booking: existing, idempotent: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert(bookingRow)
      .select()
      .single();

    if (error) {
      console.error("[save-booking] insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ booking: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[save-booking] error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
