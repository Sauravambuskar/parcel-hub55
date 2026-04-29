// XpressBees tracking — POST /api/shipments2/track  with { awb }.
// Maps to the same TrackingData shape used by Shadowfax / Delhivery / Urbanebolt.

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { xpressbeesFetch } from "../_shared/xpressbees-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

function mapStatus(status: string): { category: string; subcategory: string } {
  const v = (status || "").toLowerCase().trim();
  const sub = status || "Update";
  if (v.includes("delivered")) return { category: "DELIVERED", subcategory: sub };
  if (v.includes("out for delivery") || v.includes("ofd")) return { category: "OUT_FOR_DELIVERY", subcategory: sub };
  if (v.includes("rto") || v.includes("return")) return { category: "RTO", subcategory: sub };
  if (v.includes("cancel")) return { category: "CANCELLED", subcategory: sub };
  if (v.includes("picked") || v.includes("transit") || v.includes("dispatched") || v.includes("hub") || v.includes("manifest")) {
    return { category: "IN_TRANSIT", subcategory: sub };
  }
  if (v.includes("booked") || v.includes("created") || v.includes("pending")) {
    return { category: "ORDER_CONFIRMED", subcategory: sub };
  }
  return { category: "IN_TRANSIT", subcategory: sub };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const { waybill, awb, order_id } = await req.json().catch(() => ({}));
    const trackId = waybill || awb || order_id;
    if (!trackId) {
      return new Response(JSON.stringify({ error: "waybill is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per CUSTOM_API.pdf: GET /api/shipments2/track/{AWB} (no body).
    const res = await xpressbeesFetch(env, `/api/shipments2/track/${encodeURIComponent(String(trackId))}`, {
      method: "GET",
    });
    const text = await res.text();
    if (!res.ok) {
      console.warn("[xpressbees-tracking] failed", res.status, text.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to fetch tracking", details: text.slice(0, 500) }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    const inner = data?.data || data;
    const history: any[] =
      Array.isArray(inner?.history) ? inner.history :
      Array.isArray(inner?.tracking_history) ? inner.tracking_history :
      Array.isArray(inner?.scans) ? inner.scans :
      Array.isArray(inner?.events) ? inner.events :
      Array.isArray(inner) ? inner : [];

    const head = inner?.shipment || inner;
    const orderNo = head?.order_number || head?.order_id || trackId;
    const edd = head?.edd || head?.expected_delivery_date || "";

    const statuses = history.map((entry: any) => {
      const ts = entry?.timestamp || entry?.scan_time || entry?.event_time || entry?.date || new Date().toISOString();
      const desc = entry?.status || entry?.message || entry?.activity || entry?.event || "Update";
      const m = mapStatus(desc);
      const tsMs = typeof ts === "string"
        ? Date.parse(ts.replace(" ", "T") + (ts.includes("T") || ts.includes("Z") ? "" : "+05:30"))
        : new Date(ts).getTime();
      return {
        trackingId: trackId,
        status: desc,
        location: entry?.location || entry?.city || entry?.hub || "",
        deliveryPartnerName: "XpressBees",
        statusTimestamp: isNaN(tsMs) ? Date.now() : tsMs,
        event: desc,
        category: m.category,
        subcategory: m.subcategory,
        createdAt: typeof ts === "string" ? ts : new Date(ts).toISOString(),
        statusCode: entry?.status_code || "",
        reasonCode: entry?.reason_code || "",
        podUrl: entry?.pod_url || "",
        otpVerified: entry?.otp_verified || "",
      };
    });

    if (statuses.length === 0) {
      const cur = head?.status || "Manifested";
      const m = mapStatus(cur);
      statuses.push({
        trackingId: trackId,
        status: cur, location: "",
        deliveryPartnerName: "XpressBees",
        statusTimestamp: Date.now(),
        event: cur, category: m.category, subcategory: m.subcategory,
        createdAt: new Date().toISOString(),
        statusCode: "", reasonCode: "", podUrl: "", otpVerified: "",
      });
    }
    statuses.sort((a, b) => b.statusTimestamp - a.statusTimestamp);

    const trackingData = {
      orderInformation: {
        trackingId: trackId,
        cAwbNumber: head?.awb_number || trackId,
        orderId: orderNo,
        sourceLocation: { address: "", city: "", landmark: "", pincode: "", state: "" },
        destinationLocation: { address: "", city: "", landmark: "", pincode: "", state: "" },
        senderDetails: { sender_mobile: "", sender_name: "" },
        receiverDetails: { receiver_mobile: "", receiver_name: "" },
        travelType: head?.courier_name || "surface",
        serviceType: head?.courier_name || "standard",
        bookingDate: head?.created_at || new Date().toISOString(),
        type: "FORWARD",
        edd,
        podUrl: "",
        weight: head?.weight || "",
        pieces: 1,
      },
      statuses,
    };

    return new Response(JSON.stringify(trackingData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[xpressbees-tracking] error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
