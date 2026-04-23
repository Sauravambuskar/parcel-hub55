// Urbanebolt tracking — GET /api/v1/services/tracking-pub/?awb=<AWB>
// Maps to the same TrackingData shape used by Shadowfax/Delhivery.

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { urbaneboltFetch } from "../_shared/urbanebolt-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

function mapStatus(status: string): { category: string; subcategory: string } {
  const s = (status || "").toLowerCase();
  if (s.includes("delivered")) return { category: "DELIVERED", subcategory: status };
  if (s.includes("out for delivery") || s.includes("ofd")) return { category: "OUT_FOR_DELIVERY", subcategory: status };
  if (s.includes("picked")) return { category: "IN_TRANSIT", subcategory: status };
  if (s.includes("transit") || s.includes("dispatched") || s.includes("hub")) return { category: "IN_TRANSIT", subcategory: status };
  if (s.includes("manifest") || s.includes("booked") || s.includes("created")) return { category: "ORDER_CONFIRMED", subcategory: status };
  if (s.includes("rto") || s.includes("return")) return { category: "RTO", subcategory: status };
  if (s.includes("cancel")) return { category: "CANCELLED", subcategory: status };
  return { category: "IN_TRANSIT", subcategory: status || "Update" };
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

    const res = await urbaneboltFetch(env, `/api/v1/services/tracking-pub/?awb=${encodeURIComponent(trackId)}`, {
      method: "GET",
    });
    const text = await res.text();
    if (!res.ok) {
      console.warn("[urbanebolt-tracking] failed", res.status, text.slice(0, 500));
      return new Response(JSON.stringify({ error: "Failed to fetch tracking", details: text.slice(0, 500) }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // Common shapes: { data: { awb, status, history: [...] } } or array
    const root = data?.data || data?.result || data?.shipment || data;
    const scans: any[] =
      root?.history || root?.scans || root?.tracking || root?.events || data?.history || [];

    const statuses = scans.map((entry: any) => {
      const ts = entry?.timestamp || entry?.scan_time || entry?.event_time || entry?.created_at || new Date().toISOString();
      const statusStr = entry?.status || entry?.event || entry?.activity || entry?.remarks || "Update";
      const m = mapStatus(statusStr);
      return {
        trackingId: trackId,
        status: statusStr,
        location: entry?.location || entry?.city || entry?.hub || "",
        deliveryPartnerName: "Urbanebolt",
        statusTimestamp: new Date(ts).getTime(),
        event: statusStr,
        category: m.category,
        subcategory: m.subcategory,
        createdAt: typeof ts === "string" ? ts : new Date(ts).toISOString(),
      };
    });

    if (statuses.length === 0) {
      const cur = root?.status || root?.current_status || "Manifested";
      const m = mapStatus(cur);
      statuses.push({
        trackingId: trackId,
        status: cur,
        location: "",
        deliveryPartnerName: "Urbanebolt",
        statusTimestamp: Date.now(),
        event: cur,
        category: m.category,
        subcategory: m.subcategory,
        createdAt: new Date().toISOString(),
      });
    }
    statuses.sort((a, b) => b.statusTimestamp - a.statusTimestamp);

    const consignee = root?.consignee || root?.delivery || {};
    const seller = root?.seller || root?.pickup || {};
    const trackingData = {
      orderInformation: {
        trackingId: trackId,
        cAwbNumber: root?.awb || trackId,
        orderId: root?.order_no || root?.shipment_no || trackId,
        sourceLocation: {
          address: seller?.address || "",
          city: seller?.city || "",
          landmark: "",
          pincode: String(seller?.pin || seller?.pincode || ""),
          state: seller?.state || "",
        },
        destinationLocation: {
          address: consignee?.address || "",
          city: consignee?.city || "",
          landmark: "",
          pincode: String(consignee?.pin || consignee?.pincode || ""),
          state: consignee?.state || "",
        },
        senderDetails: {
          sender_mobile: String(seller?.mobile || seller?.phone || ""),
          sender_name: seller?.name || "",
        },
        receiverDetails: {
          receiver_mobile: String(consignee?.mobile || consignee?.phone || ""),
          receiver_name: consignee?.name || "",
        },
        travelType: root?.mode || "surface",
        serviceType: root?.service_type || "standard",
        bookingDate: root?.created_at || new Date().toISOString(),
        type: "FORWARD",
      },
      statuses,
    };

    return new Response(JSON.stringify(trackingData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[urbanebolt-tracking] error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
