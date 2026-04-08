import { getEnvironmentFromRequest } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-environment",
};

interface ShadowfaxConfig {
  apiBaseUrl: string;
  tokenEnvVar: string;
}

const SHADOWFAX_CONFIG: Record<string, ShadowfaxConfig> = {
  sandbox: {
    apiBaseUrl: "https://dale.staging.shadowfax.in",
    tokenEnvVar: "SHADOWFAX_STAGING_TOKEN",
  },
  production: {
    apiBaseUrl: "https://dale.shadowfax.in",
    tokenEnvVar: "SHADOWFAX_PROD_TOKEN",
  },
};

// Map Shadowfax statuses to app categories
const STATUS_MAP: Record<string, { category: string; subcategory: string }> = {
  "Order Received": { category: "ORDER_CONFIRMED", subcategory: "Order Received" },
  "Picked": { category: "IN_TRANSIT", subcategory: "Picked Up" },
  "Received": { category: "IN_TRANSIT", subcategory: "Received at Hub" },
  "Dispatched": { category: "IN_TRANSIT", subcategory: "Dispatched" },
  "Out for delivery": { category: "OUT_FOR_DELIVERY", subcategory: "Out for Delivery" },
  "Delivered": { category: "DELIVERED", subcategory: "Delivered" },
  "Returned To Client": { category: "RTO", subcategory: "Returned to Client" },
  "Cancelled": { category: "CANCELLED", subcategory: "Cancelled" },
  "RTO": { category: "RTO", subcategory: "Return to Origin" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const env = getEnvironmentFromRequest(req);
    const config = SHADOWFAX_CONFIG[env];
    const token = Deno.env.get(config.tokenEnvVar);

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Shadowfax API token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      `${config.apiBaseUrl}/api/v4/clients/status/?order_ids=${order_id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();
    console.log("Shadowfax tracking response:", JSON.stringify(result));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch tracking", details: result }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Shadowfax v4 returns an array of order statuses
    const orderData = Array.isArray(result) ? result[0] : result;

    if (!orderData) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize to match the app's TrackingData interface
    const statusHistory = orderData.status_history || [];
    const currentStatus = orderData.current_status || orderData.status || "Unknown";
    const mapped = STATUS_MAP[currentStatus] || { category: "IN_TRANSIT", subcategory: currentStatus };

    const statuses = statusHistory.map((s: any, index: number) => {
      const sm = STATUS_MAP[s.status] || { category: "IN_TRANSIT", subcategory: s.status };
      return {
        trackingId: order_id,
        status: s.status,
        location: s.location || "",
        deliveryPartnerName: "Shadowfax",
        statusTimestamp: new Date(s.timestamp || s.created_at || Date.now()).getTime(),
        event: s.status,
        category: sm.category,
        subcategory: sm.subcategory,
        createdAt: s.timestamp || s.created_at || new Date().toISOString(),
      };
    });

    // If no status history, create a single status from current
    if (statuses.length === 0) {
      statuses.push({
        trackingId: order_id,
        status: currentStatus,
        location: "",
        deliveryPartnerName: "Shadowfax",
        statusTimestamp: Date.now(),
        event: currentStatus,
        category: mapped.category,
        subcategory: mapped.subcategory,
        createdAt: new Date().toISOString(),
      });
    }

    const trackingData = {
      orderInformation: {
        trackingId: order_id,
        cAwbNumber: orderData.awb_number || orderData.sf_order_id || order_id,
        orderId: order_id,
        sourceLocation: {
          address: orderData.customer_address || "",
          city: orderData.customer_city || "",
          landmark: "",
          pincode: orderData.customer_pincode || "",
          state: orderData.customer_state || "",
        },
        destinationLocation: {
          address: orderData.seller_address || "",
          city: orderData.seller_city || "",
          landmark: "",
          pincode: orderData.seller_pincode || "",
          state: orderData.seller_state || "",
        },
        senderDetails: {
          sender_mobile: orderData.customer_phone || "",
          sender_name: orderData.customer_name || "",
        },
        receiverDetails: {
          receiver_mobile: orderData.seller_phone || "",
          receiver_name: orderData.seller_name || "",
        },
        travelType: "surface",
        serviceType: "standard",
        bookingDate: orderData.created_at || new Date().toISOString(),
        type: "FORWARD",
      },
      statuses,
    };

    return new Response(JSON.stringify(trackingData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Shadowfax tracking error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
