// XpressBees Franchise B2C — create shipment.
// Per franchise_apidoc_v1.1.6: POST https://ship.xpressbees.com/api/franchise/shipments
// with a flat payload (consigner_/consignee_ fields, products[], invoice[],
// weight in grams as string, dims in cm as strings, courier_id "01" Air / "02" Surface).
// Pickup is from sender (not a franchise warehouse), so pickup_location = "customer".

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

// Account-specific courier IDs (fetched from /api/franchise/shipments/courier).
// ViaSetu franchise: 17018 = B2C, 17019 = B2B. We ship B2C for both Air & Surface
// since the franchise account exposes only one B2C courier line.
function pickCourierId(serviceCode: string | undefined): string {
  const isB2B = (serviceCode || "").includes("b2b");
  return isB2B
    ? (Deno.env.get("XPRESSBEES_B2B_COURIER_ID") || "17019")
    : (Deno.env.get("XPRESSBEES_B2C_COURIER_ID") || "17018");
}

function digits10(s: string): string {
  return String(s || "").replace(/\D/g, "").slice(-10);
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
    const orderAmount = Number(shipment_value) || 1;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Doc: id max length 20 chars.
    const orderIdShort = String(order_id).slice(0, 20);

    // Flat franchise payload.
    const payload = {
      id: orderIdShort,
      unique_order_number: "yes",
      payment_method: "prepaid", // No COD policy
      // Consigner = sender
      consigner_name: String(sender_name).slice(0, 100),
      consigner_phone: digits10(sender_phone),
      consigner_pincode: String(sender_pincode),
      consigner_city: String(sender_city).slice(0, 40),
      consigner_state: String(sender_state).slice(0, 40),
      consigner_address: String(sender_address).slice(0, 200),
      // Consignee = receiver
      consignee_name: String(receiver_name).slice(0, 100),
      consignee_phone: digits10(receiver_phone),
      consignee_pincode: String(receiver_pincode),
      consignee_city: String(receiver_city).slice(0, 40),
      consignee_state: String(receiver_state).slice(0, 40),
      consignee_address: String(receiver_address).slice(0, 200),
      products: [{
        product_name: String(goods_type || "Package").slice(0, 40),
        product_qty: "1",
        product_price: String(orderAmount),
        product_sku: orderIdShort,
      }],
      invoice: [{
        invoice_number: orderIdShort,
        invoice_date: today,
      }],
      weight: String(weightGrams), // grams as string
      length: String(Math.max(1, Math.round(Number(length) || 10))),
      breadth: String(Math.max(1, Math.round(Number(width) || 10))),
      height: String(Math.max(1, Math.round(Number(height) || 10))),
      courier_id: courierId,
      pickup_location: "customer", // pickup is from sender's address
      shipping_charges: "0",
      cod_charges: "0",
      discount: "0",
      order_amount: String(orderAmount),
      collectable_amount: "0", // prepaid
    };

    console.log("[xpressbees-booking] payload:", JSON.stringify(payload).slice(0, 1500));
    const res = await xpressbeesFetch(env, "/api/franchise/shipments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let result: any;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    console.log("[xpressbees-booking] response", res.status, text.slice(0, 1500));

    // Per doc: success → { response: true, message: "booked", awb_number, label, ... }
    const awb: string | null =
      result?.awb_number || result?.data?.awb_number || result?.awbNumber || null;
    const labelUrl: string | null =
      result?.label || result?.data?.label || result?.label_url || null;

    const ok = res.ok && (result?.response === true || result?.status === true) && !!awb;

    if (!ok || !awb) {
      const err =
        result?.message || result?.error ||
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
