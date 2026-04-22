// Delhivery Pickup Request
// POST {base}/fm/request/new/
// Schedules courier pickup from the registered pickup_location (warehouse name).

import { getDelhiveryConfig, getEnvironmentFromRequest } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

interface Body {
  pickup_location: string;       // warehouse name
  expected_package_count?: number;
  pickup_date?: string;          // YYYY-MM-DD
  pickup_time?: string;          // HH:MM:SS
}

function tomorrowYMD(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  // Use IST date
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10);
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
    if (!body?.pickup_location) {
      return new Response(JSON.stringify({ success: false, error: "pickup_location is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      pickup_location: body.pickup_location,
      expected_package_count: body.expected_package_count ?? 1,
      pickup_date: body.pickup_date || tomorrowYMD(),
      pickup_time: body.pickup_time || "14:00:00",
    };

    const url = `${apiBaseUrl}/fm/request/new/`;
    console.log("[delhivery-pickup-request] payload:", JSON.stringify(payload));

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
    console.log("[delhivery-pickup-request] response:", res.status, text.slice(0, 600));

    const ok = res.ok && (result?.pickup_id || result?.success === true || /success/i.test(text));
    if (!ok) {
      return new Response(JSON.stringify({
        success: false,
        error: result?.error || result?.message || `Pickup request failed (${res.status})`,
        delhivery_response: result,
      }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: true,
      pickup_id: result?.pickup_id || null,
      pickup_date: payload.pickup_date,
      delhivery_response: result,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[delhivery-pickup-request] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
