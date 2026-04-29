// XpressBees Franchise tracking.
// Per franchise_apidoc: POST https://ship.xpressbees.com/api/franchise/shipments/track_shipment
// with body { "awb_number": "<awb>" }.
// Response shape:
//   { response, message, tracking_data: {
//       delivered: [...], "out for delivery": [...], "in transit": [...],
//       "pending pickup": [...], rto: [...], ... } }
// Each entry: { id, awb_number, event_time (epoch seconds str), status_code,
//               location, message, status, ship_status, rto_awb }

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { xpressbeesFetch } from "../_shared/xpressbees-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

function mapStatus(shipStatus: string, statusText: string): { category: string; subcategory: string } {
  const s = (shipStatus || statusText || "").toLowerCase().trim();
  const sub = statusText || shipStatus || "Update";
  if (s.includes("delivered")) return { category: "DELIVERED", subcategory: sub };
  if (s.includes("out for delivery") || s.includes("ofd")) return { category: "OUT_FOR_DELIVERY", subcategory: sub };
  if (s.includes("rto") || s.includes("return")) return { category: "RTO", subcategory: sub };
  if (s.includes("cancel")) return { category: "CANCELLED", subcategory: sub };
  if (s.includes("pending pickup") || s.includes("pending")) return { category: "ORDER_CONFIRMED", subcategory: sub };
  if (s.includes("transit") || s.includes("picked") || s.includes("dispatch") || s.includes("hub") || s.includes("manifest")) {
    return { category: "IN_TRANSIT", subcategory: sub };
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

    const res = await xpressbeesFetch(env, "/api/franchise/shipments/track_shipment", {
      method: "POST",
      body: JSON.stringify({ awb_number: String(trackId) }),
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

    // Flatten all bucket arrays inside tracking_data.
    const td = data?.tracking_data || data?.data?.tracking_data || data?.data || {};
    const allEntries: any[] = [];
    if (td && typeof td === "object" && !Array.isArray(td)) {
      for (const bucket of Object.values(td)) {
        if (Array.isArray(bucket)) allEntries.push(...bucket);
      }
    } else if (Array.isArray(td)) {
      allEntries.push(...td);
    }

    const statuses = allEntries.map((entry: any) => {
      const epoch = Number(entry?.event_time);
      const tsMs = isFinite(epoch) && epoch > 0 ? epoch * 1000 : Date.now();
      const desc = entry?.message || entry?.status || "Update";
      const m = mapStatus(entry?.ship_status || "", desc);
      return {
        trackingId: trackId,
        status: desc,
        location: entry?.location || "",
        deliveryPartnerName: "XpressBees",
        statusTimestamp: tsMs,
        event: desc,
        category: m.category,
        subcategory: m.subcategory,
        createdAt: new Date(tsMs).toISOString(),
        statusCode: entry?.status_code || "",
        reasonCode: "",
        podUrl: "",
        otpVerified: "",
      };
    });

    if (statuses.length === 0) {
      const cur = data?.message || "Manifested";
      const m = mapStatus("", cur);
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
        cAwbNumber: trackId,
        orderId: trackId,
        sourceLocation: { address: "", city: "", landmark: "", pincode: "", state: "" },
        destinationLocation: { address: "", city: "", landmark: "", pincode: "", state: "" },
        senderDetails: { sender_mobile: "", sender_name: "" },
        receiverDetails: { receiver_mobile: "", receiver_name: "" },
        travelType: "surface",
        serviceType: "standard",
        bookingDate: new Date().toISOString(),
        type: "FORWARD",
        edd: "",
        podUrl: "",
        weight: "",
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
