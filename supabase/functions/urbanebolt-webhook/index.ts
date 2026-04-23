// Urbanebolt webhook receiver — public endpoint registered in Urbanebolt panel.
// Accepts status update payloads and updates the matching booking row by AWB.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizeStatus(s: string): string {
  const v = (s || "").toLowerCase();
  if (v.includes("delivered")) return "DELIVERED";
  if (v.includes("out for delivery") || v.includes("ofd")) return "OUT_FOR_DELIVERY";
  if (v.includes("picked") || v.includes("transit") || v.includes("dispatched") || v.includes("hub")) return "IN_TRANSIT";
  if (v.includes("rto") || v.includes("return")) return "RTO";
  if (v.includes("cancel")) return "CANCELLED";
  if (v.includes("manifest") || v.includes("booked") || v.includes("created")) return "ORDER_CONFIRMED";
  return s || "UPDATED";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    console.log("[urbanebolt-webhook] payload:", JSON.stringify(body).slice(0, 1500));

    // Accept multiple shapes: { awb, status }, { data: {...} }, { shipments: [{...}] }
    const items: any[] = Array.isArray(body)
      ? body
      : Array.isArray(body?.shipments)
        ? body.shipments
        : Array.isArray(body?.data)
          ? body.data
          : [body?.data || body];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let updated = 0;
    for (const item of items) {
      if (!item) continue;
      const awb: string | null =
        item.awb || item.awb_no || item.waybill || item.tracking_id || null;
      const rawStatus: string =
        item.status || item.current_status || item.event || item.activity || "";
      if (!awb) continue;

      const status = normalizeStatus(rawStatus);
      const { error } = await supabase
        .from("bookings")
        .update({ status, updated_at: new Date().toISOString() })
        .or(`prayog_awb.eq.${awb},tracking_id.eq.${awb}`)
        .eq("booking_source", "urbanebolt_direct");
      if (error) {
        console.warn("[urbanebolt-webhook] update failed for awb", awb, error.message);
      } else {
        updated++;
      }
    }

    return new Response(JSON.stringify({ success: true, updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[urbanebolt-webhook] error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
