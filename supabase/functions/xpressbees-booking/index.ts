// XpressBees franchise B2C — create shipment.
// POST /api/shipments2  with Bearer token from getXpressbeesToken().
// Pickup location is created on-the-fly from the user's sender address (we do
// NOT use a global pickup warehouse — each booking ships from the sender).
//
// Returns AWB + label URL when available, normalized for save-booking.

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { xpressbeesFetch } from "../_shared/xpressbees-auth.ts";

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
  service_code?: string; // e.g. "xb_surface_z2" / "xb_air_z4"
}

// Decide courier_id based on the selected mode (surface vs air).
// XpressBees franchise courier IDs vary by account; we default to common defaults
// and let the user override via env if needed.
function pickCourierId(serviceCode: string | undefined): string {
  const isAir = (serviceCode || "").includes("air");
  // Defaults documented in franchise B2C onboarding kit.
  // Surface ~ "1" (Standard Surface), Air ~ "2" (Air Express).
  return isAir
    ? (Deno.env.get("XPRESSBEES_AIR_COURIER_ID") || "2")
    : (Deno.env.get("XPRESSBEES_SURFACE_COURIER_ID") || "1");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const body = (await req.json()) as BookingBody;
    const {
      order_id,
      sender_name, sender_phone, sender_address, sender_pincode, sender_city, sender_state,
      receiver_name, receiver_phone, receiver_address, receiver_pincode, receiver_city, receiver_state,
      package_weight, goods_type, shipment_value,
      length = 10, width = 10, height = 10,
      service_code,
    } = body;

    if (!order_id || !sender_name || !receiver_name || !sender_phone) {
      return new Response(JSON.stringify({
        success: false, error: "Missing required fields",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const weightGrams = Math.max(50, Math.round((Number(package_weight) || 0.5) * 1000));
    const courierId = pickCourierId(service_code);

    // Use the sender address as the pickup location for this single shipment.
    // Franchise API accepts a `pickup_location` object inline on the shipment payload.
    const pickupLocationName = `pl_${sender_pincode}_${order_id.slice(-6)}`.toLowerCase();

    const payload = {
      order_number: order_id,
      payment_type: "prepaid",
      package_weight: String(weightGrams), // grams (string per spec)
      package_length: String(Math.max(1, Math.round(Number(length) || 10))),
      package_breadth: String(Math.max(1, Math.round(Number(width) || 10))),
      package_height: String(Math.max(1, Math.round(Number(height) || 10))),
      request_auto_pickup: "yes",
      consignee: {
        name: receiver_name,
        address: receiver_address,
        address_2: "",
        city: receiver_city,
        state: receiver_state,
        pincode: String(receiver_pincode),
        phone: String(receiver_phone),
      },
      pickup: {
        warehouse_name: pickupLocationName,
        name: sender_name,
        address: sender_address,
        address_2: "",
        city: sender_city,
        state: sender_state,
        pincode: String(sender_pincode),
        phone: String(sender_phone),
      },
      order_items: [{
        name: goods_type || "Package",
        qty: "1",
        price: String(Number(shipment_value) || 0),
        sku: order_id,
      }],
      courier_id: courierId,
      collectable_amount: "0",
      total_order_value: String(Number(shipment_value) || 0),
    };

    console.log("[xpressbees-booking] payload:", JSON.stringify(payload).slice(0, 1500));
    const res = await xpressbeesFetch(env, "/api/shipments2", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let result: any;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    console.log("[xpressbees-booking] response", res.status, text.slice(0, 1500));

    const data = result?.data || result;
    const awb: string | null =
      data?.awb_number || data?.awb || data?.awbNumber || data?.waybill ||
      data?.shipment?.awb_number || result?.awb_number || null;
    const labelUrl: string | null =
      data?.label || data?.label_url || data?.shipping_label || data?.shipping_label_url ||
      data?.shipment?.label || null;

    const ok = res.ok && (result?.status === true || result?.success === true || !!awb);

    if (!ok || !awb) {
      const err =
        result?.message || result?.error || data?.message || data?.error ||
        `XpressBees booking failed (${res.status})`;
      return new Response(JSON.stringify({
        success: false, step: "shipment",
        error: err, xpressbees_response: result,
      }), { status: res.status >= 400 ? res.status : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: true,
      orderId: order_id,
      awbNumber: awb,
      label_url: labelUrl,
      status: "CREATED",
      xpressbees_response: result,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[xpressbees-booking] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
