// Delhivery Shipping Label (Packing Slip PDF)
// GET {base}/api/p/packing_slip?wbns=<AWB>&pdf=true
// Returns a label URL (Delhivery hosts the PDF) or the PDF JSON payload.

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
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Delhivery token not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { waybill, awb } = await req.json();
    const wbn = waybill || awb;
    if (!wbn) {
      return new Response(JSON.stringify({ success: false, error: "waybill is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `${apiBaseUrl}/api/p/packing_slip?wbns=${encodeURIComponent(wbn)}&pdf=true`;
    console.log("[delhivery-label] GET", url);

    const res = await fetch(url, {
      headers: { Authorization: `Token ${token}`, Accept: "application/json" },
    });
    const text = await res.text();
    console.log("[delhivery-label] response:", res.status, text.slice(0, 400));

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: `Label fetch failed (${res.status})`, raw: text.slice(0, 400) }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }

    // Delhivery returns either { packages: [{ pdf_download_link: "..." }] } or { pdf_download_link }
    const pkg = Array.isArray(result?.packages) ? result.packages[0] : null;
    const labelUrl =
      pkg?.pdf_download_link ||
      result?.pdf_download_link ||
      result?.label_url ||
      null;

    return new Response(JSON.stringify({ success: true, label_url: labelUrl, delhivery_response: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[delhivery-label] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
