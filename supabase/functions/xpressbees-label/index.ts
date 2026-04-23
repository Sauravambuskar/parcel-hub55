// XpressBees label fetch — POST /api/shipments2/label  with { awb }.
// Returns a label/PDF URL for the given AWB.

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { xpressbeesFetch } from "../_shared/xpressbees-auth.ts";

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

    const res = await xpressbeesFetch(env, "/api/shipments2/label", {
      method: "POST",
      body: JSON.stringify({ awb: String(trackId) }),
    });
    const text = await res.text();
    if (!res.ok) {
      console.warn("[xpressbees-label] failed", res.status, text.slice(0, 500));
      return new Response(JSON.stringify({ success: false, error: "Label fetch failed", details: text.slice(0, 500) }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    const inner = data?.data || data;
    const labelUrl: string | null =
      inner?.label || inner?.label_url || inner?.url || inner?.pdf_url ||
      (Array.isArray(inner) ? inner[0]?.label : null) ||
      data?.label || null;

    if (!labelUrl) {
      return new Response(JSON.stringify({ success: false, error: "Label not yet available", details: data }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, label_url: labelUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[xpressbees-label] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
