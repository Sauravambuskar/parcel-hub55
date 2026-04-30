// Shadowfax Reverse Pickup — Tracking
// Doc: GET /api/v4/clients/requests/{client_request_id}

import { getEnvironmentFromRequest, getShadowfaxConfig } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-environment",
};

const STATUS_MAP: Record<string, { category: string; subcategory: string }> = {
  "New": { category: "ORDER_CONFIRMED", subcategory: "Order Created" },
  "Order Received": { category: "ORDER_CONFIRMED", subcategory: "Order Received" },
  "Assigned": { category: "ORDER_CONFIRMED", subcategory: "Rider Assigned" },
  "Out For Pickup": { category: "IN_TRANSIT", subcategory: "Out For Pickup" },
  "Picked": { category: "IN_TRANSIT", subcategory: "Picked Up" },
  "Received": { category: "IN_TRANSIT", subcategory: "Received at Hub" },
  "Item added to Bag": { category: "IN_TRANSIT", subcategory: "Added to Bag" },
  "Bag in transit for return": { category: "IN_TRANSIT", subcategory: "Bag In Transit" },
  "Bag Received": { category: "IN_TRANSIT", subcategory: "Bag Received at Hub" },
  "Bag Received at Via": { category: "IN_TRANSIT", subcategory: "Bag Received at Via Hub" },
  "Dispatched": { category: "IN_TRANSIT", subcategory: "Dispatched" },
  "Out for delivery": { category: "OUT_FOR_DELIVERY", subcategory: "Out for Delivery" },
  "Return Shipment Out for Delivery": { category: "OUT_FOR_DELIVERY", subcategory: "Out for Delivery to Seller" },
  "Delivered": { category: "DELIVERED", subcategory: "Delivered" },
  "Not Contactable": { category: "IN_TRANSIT", subcategory: "Customer Not Contactable" },
  "Not Attempted": { category: "IN_TRANSIT", subcategory: "Delivery Not Attempted" },
  "Undelivered": { category: "IN_TRANSIT", subcategory: "Undelivered" },
  "On Hold": { category: "IN_TRANSIT", subcategory: "On Hold" },
  "Lost": { category: "RTO", subcategory: "Shipment Lost" },
  "Cid": { category: "IN_TRANSIT", subcategory: "Customer ID Verification" },
  "QC Failed": { category: "RTO", subcategory: "Quality Check Failed" },
  "Return to Seller initiated": { category: "RTO", subcategory: "Return Initiated" },
  "Received at Return DC": { category: "IN_TRANSIT", subcategory: "Received at Return DC" },
  "Returned To Client": { category: "DELIVERED", subcategory: "Returned to Seller" },
  "Cancelled": { category: "CANCELLED", subcategory: "Cancelled" },
  "RTO": { category: "RTO", subcategory: "Return to Origin" },
};

function mapStatus(s: string) {
  return STATUS_MAP[s] || { category: "IN_TRANSIT", subcategory: s };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const { apiBaseUrl, token } = getShadowfaxConfig(env);

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Shadowfax API token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { order_id, awb, client_request_id } = await req.json();
    const reqId = client_request_id || awb || order_id;

    if (!reqId) {
      return new Response(
        JSON.stringify({ error: "client_request_id (or awb/order_id) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(
      `${apiBaseUrl}/api/v4/clients/requests/${encodeURIComponent(reqId)}`,
      {
        method: "GET",
        headers: { Authorization: `Token ${token}`, "Content-Type": "application/json" },
      },
    );

    const result = await response.json().catch(() => ({}));
    console.log("[shadowfax-tracking] Response:", JSON.stringify(result).slice(0, 1500));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch tracking", details: result }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // The doc returns an object (sometimes wrapped under `data` or as an array of one). Normalize.
    const orderData: any = Array.isArray(result)
      ? result[0]
      : (result?.data && Array.isArray(result.data) ? result.data[0] : (result?.data || result));

    if (!orderData) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const history: any[] = orderData.pickup_request_state_histories || orderData.status_history || [];
    const sorted = [...history].sort((a, b) => {
      const ta = new Date(a.created_at || a.timestamp || 0).getTime();
      const tb = new Date(b.created_at || b.timestamp || 0).getTime();
      return ta - tb;
    });

    const statuses = sorted.map((s: any) => {
      const stateName = s.state || s.status || "Unknown";
      const sm = mapStatus(stateName);
      const ts = new Date(s.created_at || s.timestamp || Date.now()).getTime();
      return {
        trackingId: reqId,
        status: stateName,
        location: s.current_location || s.location || "",
        deliveryPartnerName: "Shadowfax",
        statusTimestamp: ts,
        event: s.comment || stateName,
        category: sm.category,
        subcategory: sm.subcategory,
        createdAt: new Date(ts).toISOString(),
      };
    });

    const currentStatus = orderData.status || (sorted.length ? (sorted[sorted.length - 1].state || sorted[sorted.length - 1].status) : "New");
    if (statuses.length === 0) {
      const sm = mapStatus(currentStatus);
      statuses.push({
        trackingId: reqId,
        status: currentStatus,
        location: "",
        deliveryPartnerName: "Shadowfax",
        statusTimestamp: Date.now(),
        event: currentStatus,
        category: sm.category,
        subcategory: sm.subcategory,
        createdAt: new Date().toISOString(),
      });
    }

    const addr = orderData.address || {};
    const seller = orderData.seller || {};

    const trackingData = {
      orderInformation: {
        trackingId: orderData.client_request_id || reqId,
        cAwbNumber: orderData.awb_number || orderData.client_request_id || reqId,
        orderId: orderData.client_order_number || reqId,
        sourceLocation: {
          address: addr.address_line || "",
          city: addr.city || "",
          landmark: "",
          pincode: String(addr.pincode || ""),
          state: addr.state || "",
        },
        destinationLocation: {
          address: seller.address_line || "",
          city: seller.city || "",
          landmark: "",
          pincode: String(seller.pincode || ""),
          state: seller.state || "",
        },
        senderDetails: {
          sender_mobile: addr.phone_number || "",
          sender_name: addr.name || "",
        },
        receiverDetails: {
          receiver_mobile: seller.phone_number || "",
          receiver_name: seller.name || "",
        },
        travelType: "surface",
        serviceType: "reverse_pickup",
        bookingDate: orderData.date_created
          ? new Date(orderData.date_created).toISOString()
          : (sorted[0]?.created_at || new Date().toISOString()),
        type: "REVERSE",
      },
      statuses,
    };

    return new Response(JSON.stringify(trackingData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[shadowfax-tracking] error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
