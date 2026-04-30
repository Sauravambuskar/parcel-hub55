// Shree Maruti Ecom Booking.
// POST /fulfillment/public/seller/order/ecomm/push-order
// Returns AWB/CAWB. Hardcodes paymentType=ONLINE, paymentStatus=PAID (no COD).

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { shreeMarutiFetch } from "../_shared/shree-maruti-auth.ts";

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
  service_code?: string; // shree_maruti_surface | shree_maruti_express
}

function buildAddress(
  name: string, phone: string, address: string, city: string, state: string, zip: string,
) {
  return {
    name: name || "",
    email: "",
    phone: String(phone).replace(/\D/g, "").slice(-10) || "",
    address1: address || "",
    address2: "",
    city: city || "",
    state: state || "",
    country: "India",
    zip: String(zip || ""),
  };
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
      service_code = "shree_maruti_surface",
    } = body;

    if (!order_id || !sender_name || !receiver_name || !sender_phone || !receiver_phone) {
      return new Response(JSON.stringify({
        success: false, error: "Missing required fields",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const declared = Number(shipment_value) || 100;
    const weightG = Math.max(1, Math.round(Number(package_weight) * 1000));
    const itemName = goods_type || "Package";
    const isExpress = service_code.includes("express");

    const payload = {
      orderId: order_id,
      orderSubtype: "FORWARD",
      readyToPick: true,
      orderCreatedAt: new Date().toISOString(),
      currency: "INR",
      amount: declared,
      weight: weightG,
      paymentType: "ONLINE",
      paymentStatus: "PAID",
      remarks: "Booked via ViaSetu",
      // Delivery mode hint (some payloads use deliveryMode/deliveryPromise)
      deliveryMode: isExpress ? "AIR" : "SURFACE",
      deliveryPromise: isExpress ? "AIR" : "SURFACE",
      length: Number(length),
      width: Number(width),
      height: Number(height),
      lineItems: [{
        name: itemName,
        weight: weightG,
        unitPrice: declared,
        price: declared,
        quantity: 1,
        sku: order_id,
      }],
      shippingAddress: buildAddress(
        receiver_name, receiver_phone, receiver_address,
        receiver_city, receiver_state, receiver_pincode,
      ),
      billingAddress: buildAddress(
        receiver_name, receiver_phone, receiver_address,
        receiver_city, receiver_state, receiver_pincode,
      ),
      pickupAddress: buildAddress(
        sender_name, sender_phone, sender_address,
        sender_city, sender_state, sender_pincode,
      ),
      returnAddress: buildAddress(
        sender_name, sender_phone, sender_address,
        sender_city, sender_state, sender_pincode,
      ),
    };

    console.log("[shree-maruti-booking] payload:", JSON.stringify(payload));

    const res = await shreeMarutiFetch(
      env,
      "/fulfillment/public/seller/order/ecomm/push-order",
      { method: "POST", body: JSON.stringify(payload) },
    );
    const text = await res.text();
    let result: any;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    console.log("[shree-maruti-booking] response", res.status, text.slice(0, 1000));

    const inner = result?.data ?? result;
    const awbNumber: string | null =
      inner?.awbNumber ?? inner?.awb ?? inner?.awb_number ?? null;
    const cAwbNumber: string | null =
      inner?.cAwbNumber ?? inner?.cawbNumber ?? inner?.courierAwb ?? null;
    const trackId = awbNumber || cAwbNumber;

    if (!res.ok || !trackId) {
      const err =
        inner?.error || inner?.message || result?.error || result?.message ||
        `Shree Maruti booking failed (${res.status})`;
      return new Response(JSON.stringify({
        success: false, error: err, shree_maruti_response: result,
      }), { status: res.status >= 400 ? res.status : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: true,
      orderId: order_id,
      awbNumber: String(trackId),
      awb: awbNumber ? String(awbNumber) : null,
      cAwbNumber: cAwbNumber ? String(cAwbNumber) : null,
      label_url: null, // Label fetched separately via shree-maruti-label
      status: "CREATED",
      shree_maruti_response: result,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[shree-maruti-booking] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
