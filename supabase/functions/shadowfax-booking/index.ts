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

    const body = await req.json();
    const {
      order_id,
      sender_name, sender_phone, sender_address, sender_pincode, sender_city, sender_state,
      receiver_name, receiver_phone, receiver_address, receiver_pincode, receiver_city, receiver_state,
      package_weight, goods_type, shipment_value,
      length, width, height,
    } = body;

    if (!order_id || !sender_name || !receiver_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: order_id, sender_name, receiver_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map to Shadowfax Reverse Pickup API format
    const shadowfaxPayload = {
      client_order_id: order_id,
      order_details: {
        // Shadowfax Reverse Pickup: customer = pickup point (sender), seller = delivery point (receiver)
        customer_name: sender_name,
        customer_phone: sender_phone,
        customer_address: sender_address,
        customer_pincode: sender_pincode,
        customer_city: sender_city,
        customer_state: sender_state,
        seller_name: receiver_name,
        seller_phone: receiver_phone,
        seller_address: receiver_address,
        seller_pincode: receiver_pincode,
        seller_city: receiver_city,
        seller_state: receiver_state,
        item_name: goods_type || "Package",
        item_quantity: 1,
        piece_count: 1,
        total_amount: shipment_value || 0,
        cod_amount: 0,
        is_cod: false,
        dead_weight: package_weight || 1,
        length: length || 10,
        breadth: width || 10,
        height: height || 10,
      },
    };

    console.log("Shadowfax booking payload:", JSON.stringify(shadowfaxPayload));

    const response = await fetch(`${config.apiBaseUrl}/api/v3/clients/orders/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify(shadowfaxPayload),
    });

    const result = await response.json();
    console.log("Shadowfax booking response:", JSON.stringify(result));

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.message || result.detail || "Shadowfax booking failed",
          shadowfax_response: result,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize response
    return new Response(
      JSON.stringify({
        success: true,
        orderId: result.client_order_id || order_id,
        awbNumber: result.awb_number || result.sf_order_id || null,
        sfOrderId: result.sf_order_id || null,
        status: result.status || "CREATED",
        shadowfax_response: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Shadowfax booking error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
