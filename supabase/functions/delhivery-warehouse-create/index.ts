// Delhivery Client Warehouse Creation
// POST {base}/api/backend/clientwarehouse/create/
// For C2C forward: registers the SENDER's address as a pickup location so
// Delhivery's agent picks up from the sender (not our company warehouse).
// Idempotent: warehouse name = `VS_<sender_phone>`, so the same customer
// reuses the same registered pickup location across bookings.
// If Delhivery returns "already exists", we treat that as success.

import { getDelhiveryConfig, getEnvironmentFromRequest } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

interface Body {
  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_city: string;
  sender_state: string;
  sender_pincode: string;
  email?: string;
}

function sanitizeName(phone: string): string {
  // Keep only digits; warehouse names must be unique per client
  const digits = (phone || "").replace(/\D/g, "");
  return `VS_${digits || "default"}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const { apiBaseUrl, token } = getDelhiveryConfig(env);
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Delhivery token not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const warehouseName = sanitizeName(body.sender_phone);

    const payload = {
      name: warehouseName,
      email: body.email || "noreply@viasetu.com",
      phone: body.sender_phone,
      address: body.sender_address,
      city: body.sender_city,
      country: "India",
      pin: body.sender_pincode,
      return_address: body.sender_address,
      return_pin: body.sender_pincode,
      return_city: body.sender_city,
      return_state: body.sender_state,
      return_country: "India",
      contact_person: body.sender_name,
    };

    const url = `${apiBaseUrl}/api/backend/clientwarehouse/create/`;
    console.log("[delhivery-warehouse-create] payload:", JSON.stringify(payload));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let result: any;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    console.log("[delhivery-warehouse-create] response:", res.status, text.slice(0, 800));

    // Success case
    if (res.ok && (result?.success === true || result?.data || /success/i.test(text))) {
      return new Response(JSON.stringify({ success: true, warehouse_name: warehouseName, delhivery_response: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already exists -> idempotent reuse
    const errStr = (result?.error || result?.message || text || "").toString().toLowerCase();
    if (errStr.includes("already exist") || errStr.includes("exists") || res.status === 400) {
      console.log("[delhivery-warehouse-create] reusing existing warehouse:", warehouseName);
      return new Response(JSON.stringify({ success: true, warehouse_name: warehouseName, reused: true, delhivery_response: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: result?.error || result?.message || `Warehouse create failed (${res.status})`,
      delhivery_response: result,
    }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[delhivery-warehouse-create] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
