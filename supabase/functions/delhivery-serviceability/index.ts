// Delhivery Direct serviceability + live rate quote (Reverse Pickup)
// Phase 1: pincode check + parallel Express/Surface rate calls.
// Direction: package physically moves sender → receiver (customer → seller/business).
// rt=R tells Delhivery this is a Reverse Pickup shipment.

import { getDelhiveryConfig, getEnvironmentFromRequest } from "../_shared/environment.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-environment",
};

interface Body {
  pickup_pincode: string;
  delivery_pincode: string;
  weight_kg?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
}

interface RateResult {
  mode: "E" | "S";
  amount: number;
}

async function checkPincodes(
  baseUrl: string,
  token: string,
  pickup: string,
  delivery: string,
): Promise<{ pickupOk: boolean; deliveryOk: boolean }> {
  const url = `${baseUrl}/c/api/pin-codes/json/?filter_codes=${pickup},${delivery}`;
  const res = await fetch(url, {
    headers: { Authorization: `Token ${token}`, Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.warn(`Delhivery pincode check failed (${res.status}):`, text.slice(0, 300));
    return { pickupOk: false, deliveryOk: false };
  }

  const json = await res.json();
  const records: any[] = json?.delivery_codes || [];

  const findOk = (pin: string) => {
    const rec = records.find((r) => {
      const pc = r?.postal_code || r?.postal_code?.pin || r;
      const codeFromObj = r?.postal_code?.pin || r?.postal_code;
      return String(codeFromObj) === pin;
    });
    if (!rec) return false;
    const pc = rec?.postal_code || {};
    return String(pc?.pre_paid || "").toUpperCase() === "Y";
  };

  return { pickupOk: findOk(pickup), deliveryOk: findOk(delivery) };
}

async function fetchRate(
  baseUrl: string,
  token: string,
  mode: "E" | "S",
  oPin: string,
  dPin: string,
  cgmGrams: number,
): Promise<RateResult | null> {
  const params = new URLSearchParams({
    md: mode,
    ss: "Delivered",
    d_pin: dPin,
    o_pin: oPin,
    cgm: String(cgmGrams),
    pt: "Pre-paid",
    rt: "R", // Reverse pickup flag
  });

  const url = `${baseUrl}/api/kinko/v1/invoice/charges/.json?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Token ${token}`, Accept: "application/json" },
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn(`Delhivery rate ${mode} failed (${res.status}):`, text.slice(0, 300));
      return null;
    }

    const json = JSON.parse(text);
    // Response is an array of rate entries; pick first with total_amount
    const arr: any[] = Array.isArray(json) ? json : [json];
    const entry = arr.find((e) => typeof e?.total_amount === "number");
    if (!entry) {
      console.warn(`Delhivery rate ${mode} no total_amount in response:`, text.slice(0, 300));
      return null;
    }

    return { mode, amount: Math.round(entry.total_amount) };
  } catch (err) {
    console.warn(`Delhivery rate ${mode} threw:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const env = getEnvironmentFromRequest(req);
    const { apiBaseUrl, token } = getDelhiveryConfig(env);

    if (!token) {
      console.error("Delhivery token not configured for env:", env);
      return new Response(
        JSON.stringify({ is_serviceable: false, error: "Delhivery not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as Body;
    const {
      pickup_pincode,
      delivery_pincode,
      weight_kg = 1,
      length_cm = 10,
      width_cm = 10,
      height_cm = 10,
    } = body;

    if (!pickup_pincode || !delivery_pincode) {
      return new Response(
        JSON.stringify({ error: "pickup_pincode and delivery_pincode are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 1: pincode serviceability
    const { pickupOk, deliveryOk } = await checkPincodes(
      apiBaseUrl, token, pickup_pincode, delivery_pincode,
    );

    if (!pickupOk || !deliveryOk) {
      return new Response(
        JSON.stringify({
          is_serviceable: false,
          pickup_serviceable: pickupOk,
          delivery_serviceable: deliveryOk,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 2: chargeable weight in grams
    const actualG = weight_kg * 1000;
    const volG = (length_cm * width_cm * height_cm) / 5000 * 1000;
    const cgm = Math.max(1, Math.ceil(Math.max(actualG, volG)));

    // Step 3: parallel Express + Surface rate calls
    // Reverse Pickup: o_pin = sender (physical origin), d_pin = receiver (physical destination)
    const [express, surface] = await Promise.all([
      fetchRate(apiBaseUrl, token, "E", pickup_pincode, delivery_pincode, cgm),
      fetchRate(apiBaseUrl, token, "S", pickup_pincode, delivery_pincode, cgm),
    ]);

    if (!express && !surface) {
      console.warn("Delhivery: both rate calls failed");
      return new Response(
        JSON.stringify({ is_serviceable: false, error: "Rate quote unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const services: any[] = [];
    if (express) {
      services.push({
        service_code: "delhivery_express",
        service_name: "Delhivery Express",
        tat_days: 2,
        tat_label: "1-2 Days",
        delivery_modes: { express: true, standard: false },
        is_cod: false,
        pickup: true,
        delivery: true,
        insurance: false,
        rate: {
          rate_id: "delhivery_rate_express",
          price: { amount: express.amount, currency: "INR", type: "calculated" },
          description: "Delhivery Express (Reverse Pickup)",
        },
      });
    }
    if (surface) {
      services.push({
        service_code: "delhivery_surface",
        service_name: "Delhivery Surface",
        tat_days: 4,
        tat_label: "3-5 Days",
        delivery_modes: { express: false, standard: true },
        is_cod: false,
        pickup: true,
        delivery: true,
        insurance: false,
        rate: {
          rate_id: "delhivery_rate_surface",
          price: { amount: surface.amount, currency: "INR", type: "calculated" },
          description: "Delhivery Surface (Reverse Pickup)",
        },
      });
    }

    const partner = {
      partner_id: "delhivery_direct",
      partner_code: "delhivery",
      partner_name: "Delhivery",
      is_serviceable: true,
      rating: 4.3,
      services,
      metadata: {
        chargeable_weight_g: cgm,
        environment: env,
        rvp: true,
      },
    };

    return new Response(
      JSON.stringify({ is_serviceable: true, partner }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Delhivery serviceability error:", err);
    return new Response(
      JSON.stringify({ is_serviceable: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
