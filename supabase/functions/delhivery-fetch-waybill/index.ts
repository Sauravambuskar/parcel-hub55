// Delhivery Fetch Waybill (AWB)
// GET {base}/waybill/api/bulk/json/?count=1&cl=<client_name>
// Returns a single AWB string from Delhivery's pool tied to our client account.

import { getDelhiveryConfig, getEnvironmentFromRequest } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const { apiBaseUrl, token } = getDelhiveryConfig(env);
    const clientName = Deno.env.get("DELHIVERY_PROD_CLIENT_NAME");

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Delhivery token not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!clientName) {
      return new Response(JSON.stringify({ success: false, error: "DELHIVERY_PROD_CLIENT_NAME not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let count = 1;
    try {
      const body = await req.json();
      if (body?.count && Number.isInteger(body.count)) count = body.count;
    } catch { /* no body */ }

    const url = `${apiBaseUrl}/waybill/api/bulk/json/?count=${count}&cl=${encodeURIComponent(clientName)}`;
    console.log("[delhivery-fetch-waybill] GET", url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Token ${token}`,
        Accept: "application/json",
      },
    });
    const text = await res.text();
    console.log("[delhivery-fetch-waybill] response:", res.status, text.slice(0, 400));

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: `Waybill fetch failed (${res.status})`, raw: text.slice(0, 400) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Response is typically a quoted string like "1234567890123" or comma-joined for multi
    let waybill = text.trim().replace(/^"+|"+$/g, "");
    // Some accounts return JSON array
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length) waybill = String(parsed[0]);
      else if (typeof parsed === "string") waybill = parsed;
    } catch { /* plain text */ }

    if (!waybill || /error/i.test(waybill)) {
      return new Response(JSON.stringify({ success: false, error: "No waybill returned", raw: text.slice(0, 400) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If multiple, return array; else single
    const list = waybill.split(",").map((s) => s.trim()).filter(Boolean);
    return new Response(JSON.stringify({ success: true, waybill: list[0], waybills: list }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[delhivery-fetch-waybill] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
