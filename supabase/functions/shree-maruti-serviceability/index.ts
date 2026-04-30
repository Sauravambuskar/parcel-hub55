// Shree Maruti (Innofulfill / Delcaper) serviceability check + price quote.
// POST /fulfillment/public/seller/order/check-ecomm-order-serviceability
// Auth: Bearer JWT. Returns whether SURFACE/AIR delivery modes are serviceable.
// Then calls the Rate API to get pricing for each available mode.

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { shreeMarutiFetch } from "../_shared/shree-maruti-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

interface ServiceabilityBody {
  pickup_pincode?: string | number;
  delivery_pincode?: string | number;
  weight_kg?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
}

async function checkMode(env: any, fromPin: number, toPin: number, mode: "SURFACE" | "AIR") {
  try {
    const res = await shreeMarutiFetch(
      env,
      "/fulfillment/public/seller/order/check-ecomm-order-serviceability",
      {
        method: "POST",
        body: JSON.stringify({
          fromPincode: fromPin,
          toPincode: toPin,
          isCodOrder: false,
          deliveryMode: mode,
        }),
      },
    );
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) {
      console.warn("[shree-maruti-serviceability]", mode, "failed", res.status, text.slice(0, 300));
      return { ok: false, data };
    }
    // Common response shapes: { data: { isServiceable: true/false, ... }, status: 200 }
    const inner = data?.data ?? data;
    const serviceable =
      inner?.isServiceable === true ||
      inner?.serviceable === true ||
      inner?.feasible === true ||
      data?.status === 200 && inner !== false; // some APIs return success when serviceable
    return { ok: !!serviceable, data: inner };
  } catch (e) {
    console.warn("[shree-maruti-serviceability]", mode, "error", String(e));
    return { ok: false, data: null };
  }
}

async function getRate(
  env: any,
  fromPin: number,
  toPin: number,
  weightG: number,
  l: number, w: number, h: number,
  mode: "SURFACE" | "AIR",
): Promise<number | null> {
  try {
    const res = await shreeMarutiFetch(
      env,
      "/fulfillment/rate-card/calculate-rate/ecomm",
      {
        method: "POST",
        body: JSON.stringify({
          deliveryPromise: mode,
          fromPincode: fromPin,
          toPincode: toPin,
          weight: weightG,
          length: l,
          width: w,
          height: h,
        }),
      },
    );
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { return null; }
    if (!res.ok) {
      console.warn("[shree-maruti-rate]", mode, "failed", res.status, text.slice(0, 300));
      return null;
    }
    const inner = data?.data ?? data;
    const price =
      inner?.totalAmount ??
      inner?.totalCharge ??
      inner?.totalCharges ??
      inner?.grandTotal ??
      inner?.total ??
      inner?.amount ??
      inner?.shippingCharge ??
      null;
    return typeof price === "number" ? Math.round(price) : null;
  } catch (e) {
    console.warn("[shree-maruti-rate]", mode, "error", String(e));
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const body = (await req.json()) as ServiceabilityBody;
    const {
      pickup_pincode, delivery_pincode,
      weight_kg = 1,
      length_cm = 10, width_cm = 10, height_cm = 10,
    } = body;

    if (!pickup_pincode || !delivery_pincode) {
      return new Response(
        JSON.stringify({ error: "pickup_pincode and delivery_pincode are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const fromPin = Number(pickup_pincode);
    const toPin = Number(delivery_pincode);
    const weightG = Math.max(1, Math.round(Number(weight_kg) * 1000));

    // Check both modes in parallel
    const [surface, air] = await Promise.all([
      checkMode(env, fromPin, toPin, "SURFACE"),
      checkMode(env, fromPin, toPin, "AIR"),
    ]);

    if (!surface.ok && !air.ok) {
      return new Response(
        JSON.stringify({
          is_serviceable: false,
          reason: "Pincode pair not serviced by Shree Maruti",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch rates for available modes (in parallel)
    const ratePromises: Array<Promise<{ mode: "SURFACE" | "AIR"; price: number | null }>> = [];
    if (surface.ok) {
      ratePromises.push(
        getRate(env, fromPin, toPin, weightG, length_cm, width_cm, height_cm, "SURFACE")
          .then((price) => ({ mode: "SURFACE" as const, price })),
      );
    }
    if (air.ok) {
      ratePromises.push(
        getRate(env, fromPin, toPin, weightG, length_cm, width_cm, height_cm, "AIR")
          .then((price) => ({ mode: "AIR" as const, price })),
      );
    }
    const rates = await Promise.all(ratePromises);

    const services = rates
      .filter((r) => r.price != null && r.price > 0)
      .map((r) => {
        const isAir = r.mode === "AIR";
        return {
          service_code: isAir ? "shree_maruti_express" : "shree_maruti_surface",
          service_name: isAir ? "Shree Maruti Express (Air)" : "Shree Maruti Surface",
          tat_days: isAir ? 2 : 4,
          tat_label: isAir ? "1-2 days" : "3-5 days",
          delivery_modes: { express: isAir, standard: !isAir },
          is_cod: false,
          pickup: true,
          delivery: true,
          insurance: false,
          rate: {
            rate_id: `sm_rate_${r.mode.toLowerCase()}`,
            price: { amount: r.price as number, currency: "INR", type: "calculated" },
            description: isAir ? "Shree Maruti Air" : "Shree Maruti Surface",
          },
        };
      });

    if (services.length === 0) {
      return new Response(
        JSON.stringify({
          is_serviceable: false,
          reason: "Rate not available from Shree Maruti for this pincode pair",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const partner = {
      partner_id: "shree_maruti_direct",
      partner_code: "shree_maruti",
      partner_name: "Shree Maruti Courier",
      is_serviceable: true,
      rating: 4.0,
      services,
    };

    return new Response(
      JSON.stringify({ is_serviceable: true, partner }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[shree-maruti-serviceability] error:", err);
    return new Response(
      JSON.stringify({ is_serviceable: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
