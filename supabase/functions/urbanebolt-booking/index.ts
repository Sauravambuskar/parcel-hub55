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

    // Map to Urbanebolt Manifest API payload (per official Postman spec)
    // Body is an ARRAY of shipment objects; field names are camelCase abbreviations.
    const declared = Number(shipment_value) || 1;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const senderPin = Number(sender_pincode) || 0;
    const receiverPin = Number(receiver_pincode) || 0;
    const senderMob = Number(String(sender_phone).replace(/\D/g, "").slice(-10)) || 0;
    const receiverMob = Number(String(receiver_phone).replace(/\D/g, "").slice(-10)) || 0;

    const shipment = {
      customerCode,
      orderNumber: order_id,
      declaredValue: declared,
      itemDescription: goods_type || "Package",
      collectableValue: 0,
      height: Number(height) || 10,
      length: Number(length) || 10,
      breadth: Number(width) || 10,
      pieces: 1,
      weight: Number(package_weight) || 0.5,
      serviceType: "NDD",
      payMode: "PPD",
      // Consignee = receiver
      consName: receiver_name,
      consAddress: receiver_address,
      consAddressType: "Home",
      consCity: receiver_city,
      consState: receiver_state,
      consPincode: receiverPin,
      consMobile: receiverMob,
      consCountry: "INDIA",
      consEmail: "noreply@viasetu.com",
      // Shipper = sender
      shprName: sender_name,
      shprAddress: sender_address,
      shprAddressType: "Seller",
      shprCity: sender_city,
      shprState: sender_state,
      shprPincode: senderPin,
      shprMobile: senderMob,
      shprCountry: "INDIA",
      shprEmail: "noreply@viasetu.com",
      // Return = sender (same as shipper)
      rtnName: sender_name,
      rtnAddress: sender_address,
      rtnAddressType: "Seller",
      rtnCity: sender_city,
      rtnState: sender_state,
      rtnPincode: senderPin,
      rtnMobile: senderMob,
      rtnCountry: "INDIA",
      rtnEmail: "noreply@viasetu.com",
      // Invoice
      invoiceNumber: order_id,
      invoiceDate: today,
      invoiceValue: declared,
      itemQuantity: 1,
    };

    const payload = [shipment];
    console.log("[urbanebolt-booking] manifest payload:", JSON.stringify(payload));

    const res = await urbaneboltFetch(env, "/api/v1/services/manifest/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let result: any;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    console.log("[urbanebolt-booking] manifest response", res.status, text.slice(0, 1000));

    // Try to pull AWB from common shapes (Urbanebolt uses successResponse[])
    const first =
      result?.successResponse?.[0] ||
      result?.data?.[0] ||
      result?.shipments?.[0] ||
      result?.results?.[0] ||
      result?.[0] ||
      result;
    const errFirst = result?.errorResponse?.[0];
    const awbRaw =
      first?.awbNumber ?? first?.awb ?? first?.awb_no ?? first?.waybill ?? result?.awb ?? null;
    const awb: string | null = awbRaw != null ? String(awbRaw) : null;
    const statusStr = String(result?.status || first?.status || "").toLowerCase();
    const ok =
      res.ok &&
      !!awb &&
      (statusStr === "success" || result?.success === true || !errFirst);

    if (!ok || !awb) {
      const err =
        first?.error || first?.message || result?.error || result?.message || `Urbanebolt manifest failed (${res.status})`;
      return new Response(JSON.stringify({
        success: false, step: "manifest",
        error: err, urbanebolt_response: result,
      }), { status: res.status >= 400 ? res.status : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Try to fetch label URL (non-fatal)
    let labelUrl: string | null = first?.shippingLabel || first?.label_url || first?.label || null;
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
