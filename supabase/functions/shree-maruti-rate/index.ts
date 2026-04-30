// Shree Maruti rate calculation.
// POST /fulfillment/rate-card/calculate-rate/ecomm
// Used as a standalone rate quote (e.g., for pricing fallbacks).

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { shreeMarutiFetch } from "../_shared/shree-maruti-auth.ts";
import { quoteFromCard, resolvePrice } from "../_shared/rate-cards.ts";

async function pinInfo(pin: string) {
  try {
    const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const j = await r.json();
    const po = j?.[0]?.PostOffice?.[0];
    if (po) return { pincode: pin, city: po.District || po.Block || po.Name || "", state: po.State || "" };
  } catch (_) { /* swallow */ }
  return { pincode: pin };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const body = await req.json();
    const {
      pickup_pincode, delivery_pincode,
      weight_kg = 1,
      length_cm = 10, width_cm = 10, height_cm = 10,
      mode = "SURFACE", // "SURFACE" | "AIR"
    } = body;

    if (!pickup_pincode || !delivery_pincode) {
      return new Response(
        JSON.stringify({ error: "pickup_pincode and delivery_pincode are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = {
      deliveryPromise: String(mode).toUpperCase(),
      fromPincode: Number(pickup_pincode),
      toPincode: Number(delivery_pincode),
      weight: Math.max(1, Math.round(Number(weight_kg) * 1000)),
      length: Number(length_cm),
      width: Number(width_cm),
      height: Number(height_cm),
    };

    const res = await shreeMarutiFetch(env, "/fulfillment/rate-card/calculate-rate/ecomm", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) {
      console.warn("[shree-maruti-rate] failed", res.status, text.slice(0, 500));
      return new Response(
        JSON.stringify({ error: data?.message || "Rate fetch failed", details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true, data: data?.data ?? data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[shree-maruti-rate] error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
