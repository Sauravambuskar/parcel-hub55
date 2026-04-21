// Delhivery Direct Reverse Pickup booking via /api/cmu/create.json
// Spec-correct RVP convention (per delhivery-express-api-doc.readme.io):
//   pickup_location.name           = our registered warehouse (billing/account anchor only,
//                                    MUST match Delhivery client warehouse, case-sensitive)
//   shipments[].name/add/pin/...   = END CUSTOMER (physical pickup point for the RVP)
//   shipments[].return_name/_add/  = DELIVERY DESTINATION (receiver in our app). Per docs:
//     _pin/_city/_state/_phone       "If you are passing the return keys then shipment will
//                                    be delivered to return address."
//   shipments[].seller_*           = GST / contracting entity fields (ViaSetu). NOT address-
//                                    rendering fields. Keep blank to avoid polluting the
//                                    portal's "Seller / Sold By" card with warehouse or
//                                    receiver data. Documented keys: seller_name, seller_add,
//                                    seller_inv, seller_gst_tin.
//   payment_mode                   = "Pickup" for prepaid RVP.

import { getDelhiveryConfig, getEnvironmentFromRequest } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

interface BookingBody {
  order_id: string;
  // Sender = end-customer (physical pickup point for RVP)
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_pincode: string;
  sender_city: string;
  sender_state: string;
  // Receiver = seller/business (physical delivery point for RVP)
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
  service_code?: string; // delhivery_express | delhivery_surface
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const env = getEnvironmentFromRequest(req);
    const { apiBaseUrl, token, warehouse } = getDelhiveryConfig(env);

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: "Delhivery token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!warehouse) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Delhivery warehouse name not configured (DELHIVERY_PROD_CLIENT_WAREHOUSE_NAME)",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as BookingBody;
    const {
      order_id,
      sender_name, sender_phone, sender_address, sender_pincode,
      sender_city, sender_state,
      receiver_name, receiver_phone, receiver_address, receiver_pincode,
      receiver_city, receiver_state,
      package_weight, goods_type, shipment_value,
      length = 10, width = 10, height = 10,
      service_code = "delhivery_express",
    } = body;

    if (!order_id || !sender_name || !receiver_name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: order_id, sender_name, receiver_name",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Express => "Express", Surface => "Surface"
    const shipmentMode = service_code === "delhivery_surface" ? "Surface" : "Express";

    // Weight in grams (Delhivery expects grams in `weight` field for cmu)
    const weightG = Math.max(1, Math.round((package_weight || 0.1) * 1000));

    const shipmentPayload = {
      // RVP: physical pickup = sender (end-customer)
      name: sender_name,
      add: sender_address,
      pin: sender_pincode,
      city: sender_city,
      state: sender_state,
      country: "India",
      phone: sender_phone,
      order: order_id,
      payment_mode: "Pickup", // Prepaid RVP -> Pickup mode
      return_pin: receiver_pincode,
      return_city: receiver_city,
      return_phone: receiver_phone,
      return_add: receiver_address,
      return_state: receiver_state,
      return_country: "India",
      return_name: receiver_name,
      // Delhivery's current reverse-order docs describe the return drop address
      // using return_address/return_pincode-style keys. Send both the legacy
      // cmu aliases above and the canonical names below so the portal/UI and
      // downstream systems resolve the correct delivery address consistently.
      return_address: receiver_address,
      return_pincode: receiver_pincode,
      return_contact: receiver_phone,
      products_desc: goods_type || "Package",
      hsn_code: "",
      cod_amount: "0",
      order_date: new Date().toISOString(),
      total_amount: String(shipment_value || 0),
      // Keep seller_* aligned with the receiver too because older Delhivery UI
      // surfaces these fields in the address card for manifested reverse orders.
      seller_name: receiver_name,
      seller_add: receiver_address,
      seller_pin: receiver_pincode,
      seller_city: receiver_city,
      seller_state: receiver_state,
      seller_country: "India",
      seller_inv: "",
      quantity: "1",
      waybill: "",
      shipment_width: String(width),
      shipment_height: String(height),
      shipment_length: String(length),
      weight: String(weightG),
      seller_gst_tin: "",
      shipping_mode: shipmentMode,
      address_type: "home",
    };

    const fullPayload = {
      shipments: [shipmentPayload],
      pickup_location: {
        name: warehouse,
      },
    };

    // Delhivery expects: format=json&data=<urlencoded JSON>
    const formBody =
      `format=json&data=${encodeURIComponent(JSON.stringify(fullPayload))}`;

    console.log("[delhivery-booking] payload:", JSON.stringify(fullPayload));

    const url = `${apiBaseUrl}/api/cmu/create.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Token ${token}`,
        Accept: "application/json",
      },
      body: formBody,
    });

    const text = await res.text();
    let result: any;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    console.log("[delhivery-booking] response:", text.slice(0, 1500));

    const pkg = Array.isArray(result?.packages) ? result.packages[0] : null;
    const ok = res.ok && (result?.success === true || pkg?.status === "Success");

    if (!ok) {
      const errMsg =
        pkg?.remarks?.join?.("; ") ||
        result?.rmk ||
        result?.error ||
        result?.message ||
        `Delhivery booking failed (${res.status})`;
      return new Response(
        JSON.stringify({ success: false, error: errMsg, delhivery_response: result }),
        { status: res.status >= 400 ? res.status : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const awb = pkg?.waybill || pkg?.awb || null;

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order_id,
        awbNumber: awb,
        status: "CREATED",
        delhivery_response: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[delhivery-booking] error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
