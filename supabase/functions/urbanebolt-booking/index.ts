// Urbanebolt manifest API — creates a shipment.
// POST /api/v1/services/manifest/
// Returns AWB + label URL when available, normalized for save-booking.

import { getEnvironmentFromRequest, getUrbaneboltConfig } from "../_shared/environment.ts";
import { urbaneboltFetch } from "../_shared/urbanebolt-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

interface BookingBody {
  order_id: string;
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_pincode: string;
  sender_city: string;
  sender_state: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_pincode: string;
  receiver_city: string;
  receiver_state: string;
  package_weight: number; // kg
  goods_type?: string;
  shipment_value?: number;
  length?: number;
  width?: number;
  height?: number;
  service_code?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const { customerCode } = getUrbaneboltConfig(env);
    if (!customerCode) {
      return new Response(JSON.stringify({ success: false, error: "URBANEBOLT_CUSTOMER_CODE not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as BookingBody;
    const {
      order_id,
      sender_name, sender_phone, sender_address, sender_pincode, sender_city, sender_state,
      receiver_name, receiver_phone, receiver_address, receiver_pincode, receiver_city, receiver_state,
      package_weight, goods_type, shipment_value,
      length = 10, width = 10, height = 10,
    } = body;

    if (!order_id || !sender_name || !receiver_name || !sender_phone) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required fields",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Map to Urbanebolt softdata payload (mandatory fields per integration spec)
    const shipment = {
      shipment_no: order_id,
      order_no: order_id,
      payment_mode: "Prepaid",
      customer_code: customerCode,
      // Consignee = receiver
      consignee_name: receiver_name,
      consignee_address: receiver_address,
      consignee_city: receiver_city,
      consignee_state: receiver_state,
      consignee_pin: receiver_pincode,
      consignee_mobile: receiver_phone,
      // Seller = sender
      seller_name: sender_name,
      seller_address: sender_address,
      seller_city: sender_city,
      seller_state: sender_state,
      seller_pin: sender_pincode,
      seller_mobile: sender_phone,
      // Package
      product_desc: goods_type || "Package",
      qty: 1,
      weight: Number(package_weight) || 0.5,
      length: Number(length) || 10,
      width: Number(width) || 10,
      height: Number(height) || 10,
      declared_value: Number(shipment_value) || 0,
      cod_amount: 0,
    };

    const payload = { shipments: [shipment] };
    console.log("[urbanebolt-booking] manifest payload:", JSON.stringify(payload));

    const res = await urbaneboltFetch(env, "/api/v1/services/manifest/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let result: any;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    console.log("[urbanebolt-booking] manifest response", res.status, text.slice(0, 1000));

    // Try to pull AWB from common shapes
    const first =
      result?.data?.[0] || result?.shipments?.[0] || result?.results?.[0] || result?.[0] || result;
    const awb: string | null =
      first?.awb || first?.awb_no || first?.awbNumber || first?.waybill || result?.awb || null;
    const ok = res.ok && (result?.success === true || result?.status === "success" || !!awb);

    if (!ok || !awb) {
      const err =
        first?.error || first?.message || result?.error || result?.message || `Urbanebolt manifest failed (${res.status})`;
      return new Response(JSON.stringify({
        success: false, step: "manifest",
        error: err, urbanebolt_response: result,
      }), { status: res.status >= 400 ? res.status : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Try to fetch label URL (non-fatal)
    let labelUrl: string | null = first?.label_url || first?.label || null;
    if (!labelUrl) {
      try {
        const lblRes = await urbaneboltFetch(env, `/api/v1/services/label/?awbs=${encodeURIComponent(awb)}`, { method: "GET" });
        const lblText = await lblRes.text();
        let lblData: any;
        try { lblData = JSON.parse(lblText); } catch { lblData = { raw: lblText }; }
        labelUrl =
          lblData?.label_url || lblData?.url || lblData?.data?.[0]?.label_url || lblData?.data?.[0]?.url || null;
      } catch (e) {
        console.warn("[urbanebolt-booking] label fetch failed (non-fatal):", e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      orderId: order_id,
      awbNumber: awb,
      label_url: labelUrl,
      status: "CREATED",
      urbanebolt_response: result,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[urbanebolt-booking] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
