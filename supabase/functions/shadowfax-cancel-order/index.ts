import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getEnvironmentFromRequest, getShadowfaxConfig, getRazorpayConfig } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-environment",
};

const NON_CANCELLABLE_STATUSES = [
  "Out For Pickup", "Out for delivery", "Picked", "Delivered",
  "Cancelled", "Dispatched", "Received", "RTO", "Returned To Client",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const env = getEnvironmentFromRequest(req);
    const sfxConfig = getShadowfaxConfig(env);

    if (!sfxConfig.token) {
      return new Response(
        JSON.stringify({ error: "Shadowfax API token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { client_order_id, cancel_remarks, booking_id } = await req.json();

    if (!client_order_id) {
      return new Response(
        JSON.stringify({ error: "client_order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const remarks = cancel_remarks || "Cancelled By Customer";

    console.log(`[shadowfax-cancel] Cancelling order ${client_order_id}, reason: ${remarks}`);

    // Call Shadowfax Cancel API
    const response = await fetch(
      `${sfxConfig.apiBaseUrl}/api/v3/clients/orders/cancel/`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${sfxConfig.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_order_id: client_order_id,
          cancel_remarks: remarks,
        }),
      }
    );

    const result = await response.json();
    console.log("[shadowfax-cancel] Response:", JSON.stringify(result));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: result?.message || "Failed to cancel order", details: result }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update booking status in DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (booking_id) {
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("payment_id, payment_status")
        .eq("id", booking_id)
        .single();

      await supabase
        .from("bookings")
        .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
        .eq("id", booking_id);

      // Auto-refund if payment was collected
      if (bookingData?.payment_id && bookingData?.payment_status === "paid") {
        try {
          console.log(`[shadowfax-cancel] Initiating refund for payment ${bookingData.payment_id}`);
          const razorpayConfig = getRazorpayConfig(env);
          const authHeader = btoa(`${razorpayConfig.keyId}:${razorpayConfig.keySecret}`);

          const refundResp = await fetch(
            `https://api.razorpay.com/v1/payments/${bookingData.payment_id}/refund`,
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${authHeader}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ speed: "normal" }),
            }
          );

          const refundResult = await refundResp.json();
          if (refundResp.ok) {
            await supabase
              .from("bookings")
              .update({ payment_status: "refunded" })
              .eq("id", booking_id);
            console.log(`[shadowfax-cancel] Refund initiated: ${refundResult.id}`);
          } else {
            await supabase
              .from("bookings")
              .update({ payment_status: "refund_failed" })
              .eq("id", booking_id);
            console.error(`[shadowfax-cancel] Refund failed:`, refundResult);
          }
        } catch (refundErr) {
          console.error("[shadowfax-cancel] Refund error:", refundErr);
          await supabase
            .from("bookings")
            .update({ payment_status: "refund_failed" })
            .eq("id", booking_id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Order cancelled successfully", details: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[shadowfax-cancel] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
