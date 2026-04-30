// Shree Maruti rate calculation — EMBEDDED CARD ONLY.
// We no longer call /fulfillment/rate-card/calculate-rate/ecomm. All pricing
// comes from the contracted rate card in supabase/functions/_shared/rate-cards.ts
// (source: ViaSetu_1.xlsx).

import { quoteFromCard } from "../_shared/rate-cards.ts";

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

    const [pInfo, dInfo] = await Promise.all([
      pinInfo(String(pickup_pincode)),
      pinInfo(String(delivery_pincode)),
    ]);

    const cardMode = String(mode).toUpperCase() === "AIR" ? "air" : "surface";
    const card = quoteFromCard("shree_maruti", cardMode, pInfo, dInfo, Number(weight_kg), {
      l: Number(length_cm), w: Number(width_cm), h: Number(height_cm),
    });

    if (!card) {
      return new Response(
        JSON.stringify({
          error: "Embedded rate card could not price this request",
          details: { mode: cardMode, pickup: pInfo, delivery: dInfo, weight_kg },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({
      success: true,
      data: { totalAmount: card.price_with_fsc },
      rate_source: "card",
      card_zone: card.zone,
      card_price: card.price_with_fsc,
      chargeable_g: card.chargeable_g,
      card_version: card.card_version,
      final_price: card.price_with_fsc,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[shree-maruti-rate] error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", details: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
