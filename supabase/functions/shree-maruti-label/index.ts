// Shree Maruti label fetch.
// GET /fulfillment/public/seller/order/download/label-invoice?awbNumber=...&cAwbNumber=...
// The endpoint returns a binary PDF (or sometimes a JSON envelope with a URL).
// We persist a base64 data URL on the booking row so the existing UI flow works
// (it just opens `label_url` in a new tab).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { shreeMarutiFetch } from "../_shared/shree-maruti-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  // Deno provides btoa
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const { waybill, awb, cAwb, c_awb, booking_id } = await req.json().catch(() => ({}));
    const awbNumber = waybill || awb || null;
    const cAwbNumber = cAwb || c_awb || null;

    if (!awbNumber && !cAwbNumber) {
      return new Response(JSON.stringify({ success: false, error: "awb (waybill) or cAwb is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams();
    if (awbNumber) params.set("awbNumber", String(awbNumber));
    if (cAwbNumber) params.set("cAwbNumber", String(cAwbNumber));

    const res = await shreeMarutiFetch(
      env,
      `/fulfillment/public/seller/order/download/label-invoice?${params.toString()}`,
      { method: "GET" },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn("[shree-maruti-label] failed", res.status, errText.slice(0, 500));
      return new Response(JSON.stringify({
        success: false,
        error: "Label fetch failed",
        details: errText.slice(0, 500),
      }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const contentType = res.headers.get("content-type") || "";
    let labelUrl: string | null = null;

    if (contentType.includes("application/pdf") || contentType.includes("octet-stream")) {
      const buf = new Uint8Array(await res.arrayBuffer());
      const b64 = bytesToBase64(buf);
      labelUrl = `data:application/pdf;base64,${b64}`;
    } else {
      // Possibly a JSON envelope with a URL
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      labelUrl =
        data?.url || data?.label_url || data?.data?.url ||
        data?.data?.label_url || data?.data?.labelUrl || null;

      // If JSON contained base64 string
      const b64 = data?.base64 || data?.pdf || data?.data?.base64;
      if (!labelUrl && typeof b64 === "string") {
        labelUrl = `data:application/pdf;base64,${b64.replace(/^data:[^,]+,/, "")}`;
      }
    }

    if (!labelUrl) {
      return new Response(JSON.stringify({ success: false, error: "Label not yet available from Shree Maruti" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist on the booking row when we have one
    if (booking_id) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase.from("bookings").update({ label_url: labelUrl }).eq("id", booking_id);
      } catch (e) {
        console.warn("[shree-maruti-label] failed to persist label_url:", String(e));
      }
    }

    return new Response(JSON.stringify({ success: true, label_url: labelUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[shree-maruti-label] error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
