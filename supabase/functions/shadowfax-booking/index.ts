// Shadowfax Reverse Pickup (Seller Delivery) — Booking
// Doc: https://sfxreversepickupsellerdelivery.docs.apiary.io/
// Two-step flow: (1) generate AWB, (2) create pickup request using that AWB
// as client_request_id.

import { getEnvironmentFromRequest, getShadowfaxConfig } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-environment",
};

function num(v: any, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : fallback;
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

    const body = await req.json();
    const {
      order_id,
      sender_name, sender_phone, sender_address, sender_pincode, sender_city,
      receiver_name, receiver_phone, receiver_address, receiver_pincode, receiver_city,
      package_weight, goods_type, shipment_value,
      length, width, height,
    } = body;

    if (!order_id || !sender_name || !receiver_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: order_id, sender_name, receiver_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    };

    // ─── Step A: Generate AWB ───
    const awbRes = await fetch(`${apiBaseUrl}/api/v3/clients/orders/generate_awb/`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ count: 1 }),
    });
    const awbData = await awbRes.json().catch(() => ({}));
    console.log("[shadowfax-booking] AWB generate response:", JSON.stringify(awbData));

    const awbNumber: string | undefined = Array.isArray(awbData?.awb_numbers)
      ? awbData.awb_numbers[0]
      : undefined;

    if (!awbRes.ok || !awbNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          step: "generate_awb",
          error: awbData?.message || awbData?.detail || "Failed to generate Shadowfax AWB",
          shadowfax_response: awbData,
        }),
        { status: awbRes.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ─── Step B: Create pickup request ───
    const weightKg = num(package_weight, 1);
    const actualWeightG = Math.max(1, Math.round(weightKg * 1000));
    const L = num(length, 10), B = num(width, 10), H = num(height, 10);
    const volumetricWeightG = Math.max(1, Math.round((L * B * H * 1000) / 5000)); // grams

    const totalAmount = num(shipment_value, 0);
    const priceExcl = totalAmount > 0 ? Math.round(totalAmount / 1.18) : 0;

    const orderIdStr = String(order_id).slice(0, 100);
    const payload = {
      client_order_id: orderIdStr,
      client_order_number: orderIdStr,
      client_request_id: awbNumber,
      total_amount: totalAmount,
      price: priceExcl,
      eway_bill: "",
      address_attributes: {
        // Pickup customer = our sender
        name: sender_name,
        phone_number: String(sender_phone || ""),
        alternate_contact: String(sender_phone || ""),
        address_line: sender_address || "",
        city: sender_city || "",
        country: "India",
        pincode: Number(sender_pincode) || 0,
        latitude: "0",
        longitude: "0",
      },
      weight_details: {
        actual_weight: actualWeightG,
        volumetric_weight: volumetricWeightG,
      },
      seller_attributes: {
        // Drop seller = our receiver
        name: receiver_name,
        address_line: receiver_address || "",
        city: receiver_city || "",
        email: "noreply@viasetu.com",
        pincode: String(receiver_pincode || ""),
        phone: String(receiver_phone || ""),
        unique_code: "VIASETU",
      },
      skus_attributes: [
        {
          name: goods_type || "Package",
          client_sku_id: String(order_id),
          price: totalAmount,
          brand: "ViaSetu",
          category: goods_type || "General",
          return_reason: "Reverse Pickup",
          qc_required: "false",
          hsn_code: "00000000",
          invoice_id: String(order_id),
        },
      ],
    };

    console.log("[shadowfax-booking] Order create payload:", JSON.stringify(payload));

    const createRes = await fetch(`${apiBaseUrl}/api/v3/clients/requests`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(payload),
    });
    const createData = await createRes.json().catch(() => ({}));
    console.log("[shadowfax-booking] Order create response:", JSON.stringify(createData));

    const respAwb = createData?.awb_number || awbNumber;
    const respClientReqId = createData?.client_request_id || awbNumber;

    if (!createRes.ok || !respAwb) {
      return new Response(
        JSON.stringify({
          success: false,
          step: "create_request",
          error: createData?.message || createData?.detail || "Shadowfax order creation failed",
          shadowfax_response: createData,
        }),
        { status: createRes.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: createData?.client_order_number || order_id,
        awbNumber: respAwb,
        clientRequestId: respClientReqId,
        status: createData?.status || "New",
        shadowfax_response: createData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[shadowfax-booking] error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
