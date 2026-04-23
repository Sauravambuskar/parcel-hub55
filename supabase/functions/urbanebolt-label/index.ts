// Urbanebolt label fetch — GET /api/v1/services/label/?awbs=<AWB>
// Returns a label URL (or PDF URL) for the given AWB.

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { urbaneboltFetch } from "../_shared/urbanebolt-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const { waybill, awb } = await req.json().catch(() => ({}));
    const trackId = waybill || awb;
    if (!trackId) {
      return new Response(JSON.stringify({ success: false, error: "waybill is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await urbaneboltFetch(env, `/api/v1/services/label/?awbs=${encodeURIComponent(trackId)}`, {
      method: "GET",
    });
    const text = await res.text();
    if (!res.ok) {
      console.warn("[urbanebolt-label] failed", res.status, text.slice(0, 500));
      return new Response(JSON.stringify({ success: false, error: "Label fetch failed", details: text.slice(0, 500) }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    const labelUrl: string | null =
      data?.label_url || data?.url || data?.pdf_url ||
      data?.data?.[0]?.label_url || data?.data?.[0]?.url ||
      data?.results?.[0]?.label_url || null;

    if (!labelUrl) {
      return new Response(JSON.stringify({ success: false, error: "Label not yet available", details: data }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, label_url: labelUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[urbanebolt-label] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
