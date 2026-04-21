// Server-side safety net: refund a captured Razorpay payment with retry.
// Called by the client whenever a booking cannot be created after payment.
// Centralizes refund + audit-row insert so the browser closing mid-flow
// cannot leave money captured without a refund.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEnvironmentFromRequest, getRazorpayConfig } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-prayog-auth, x-environment",
};

interface RefundAndRecordRequest {
  payment_id: string;
  amount?: number;            // rupees; full refund if omitted
  reason?: string;            // short reason code (e.g. 'shadowfax_failed')
  error_detail?: string;      // free-form details
  booking_row?: Record<string, unknown>; // optional FAILED row to insert
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller via Prayog auth (same convention as save-booking).
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

    const body = (await req.json()) as RefundAndRecordRequest;
    const { payment_id, amount, reason, error_detail, booking_row } = body || {};

    if (!payment_id) {
      return new Response(JSON.stringify({ error: "payment_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = getEnvironmentFromRequest(req);
    const razorpayConfig = getRazorpayConfig(env);
    if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
      return new Response(
        JSON.stringify({ error: `Razorpay not configured for ${env}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Idempotency: if we already recorded a row for this payment_id, return it.
    const { data: existing } = await supabase
      .from("bookings")
      .select("*")
      .eq("payment_id", payment_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing && (existing.payment_status === "refunded" || existing.payment_status === "refund_failed")) {
      console.log("[confirm-booking-or-refund] idempotent hit:", payment_id);
      return new Response(
        JSON.stringify({
          refunded: existing.payment_status === "refunded",
          refund_id: existing.refund_id,
          booking: existing,
          idempotent: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Attempt refund with up to 3 retries, exponential backoff.
    const authHeader = btoa(`${razorpayConfig.keyId}:${razorpayConfig.keySecret}`);
    const refundPayload: Record<string, unknown> = {};
    if (amount && amount > 0) refundPayload.amount = Math.round(amount * 100);
    refundPayload.notes = {
      reason: reason || "auto_refund",
      error: (error_detail || "").slice(0, 250),
      user_id: userId,
    };

    let refundData: any = null;
    let lastErr: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const resp = await fetch(
          `https://api.razorpay.com/v1/payments/${payment_id}/refund`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${authHeader}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(refundPayload),
          },
        );
        const data = await resp.json();
        if (resp.ok) {
          refundData = data;
          break;
        }
        // If Razorpay says it's already fully refunded, treat as success.
        const desc = String(data?.error?.description || "").toLowerCase();
        if (desc.includes("fully refunded") || desc.includes("already been refunded")) {
          refundData = { id: data?.error?.metadata?.refund_id || null, status: "processed", already: true };
          break;
        }
        lastErr = data;
        console.warn(`[confirm-booking-or-refund] refund attempt ${attempt} failed:`, data);
      } catch (err) {
        lastErr = err;
        console.warn(`[confirm-booking-or-refund] refund attempt ${attempt} threw:`, err);
      }
      if (attempt < 3) await sleep(500 * Math.pow(2, attempt - 1));
    }

    const refunded = !!refundData;
    const paymentStatus = refunded ? "refunded" : "refund_failed";

    // Insert FAILED audit row if caller provided one and none exists yet.
    let bookingRecord: any = existing || null;
    if (!existing && booking_row && typeof booking_row === "object") {
      const failedRow = {
        ...booking_row,
        user_id: userId,
        payment_id,
        status: "FAILED",
        payment_status: paymentStatus,
        refund_id: refundData?.id || null,
        refund_reason: reason || "booking_failed_after_payment",
      };
      const { data: inserted, error: insertErr } = await supabase
        .from("bookings")
        .insert(failedRow)
        .select()
        .single();
      if (insertErr) {
        console.error("[confirm-booking-or-refund] FAILED row insert error:", insertErr);
      } else {
        bookingRecord = inserted;
      }
    }

    return new Response(
      JSON.stringify({
        refunded,
        refund_id: refundData?.id || null,
        refund_status: refundData?.status || null,
        booking: bookingRecord,
        error: refunded ? null : (lastErr?.error?.description || String(lastErr) || "refund failed"),
      }),
      {
        status: refunded ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("[confirm-booking-or-refund] error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
