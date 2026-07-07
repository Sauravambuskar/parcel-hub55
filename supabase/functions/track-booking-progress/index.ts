// Persists booking-flow progress rows using the service role.
// Client-side writes to booking_progress are disallowed via RLS; all writes go
// through this function which verifies the external Prayog auth header and
// forces user_id from the verified session (never trusts client input).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-prayog-auth",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      if (!userId || !UUID_RE.test(userId)) throw new Error("bad user_id");
    } catch {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as "track" | "complete" | undefined;
    const sessionId = body?.session_id as string | undefined;
    if (!action || !sessionId || !UUID_RE.test(sessionId)) {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "track") {
      const step = Number(body?.step);
      const stepName = String(body?.step_name || `Step ${step}`);
      if (!step || step < 1 || step > 6) {
        return new Response(JSON.stringify({ error: "Invalid step" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase
        .from("booking_progress")
        .upsert(
          {
            user_id: userId,
            session_id: sessionId,
            last_step: step,
            last_step_name: stepName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,session_id" },
        );
      if (error) throw error;
    } else if (action === "complete") {
      const bookingId = body?.booking_id ?? null;
      const { error } = await supabase
        .from("booking_progress")
        .update({
          completed: true,
          booking_id: bookingId,
          last_step: 6,
          last_step_name: "Completed",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("session_id", sessionId);
      if (error) throw error;
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[track-booking-progress] error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
