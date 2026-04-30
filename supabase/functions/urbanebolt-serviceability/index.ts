// Urbanebolt serviceability check + price quote.
// Uses embedded UrbaneBolt B2C Light Weight rate card (5 zones × Surface+Air).
// Pincode API confirms serviceability and returns city/state used for zoning.
// Source: UB_Rate_card-3.xlsx (uploaded by client).

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { urbaneboltFetch } from "../_shared/urbanebolt-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

// ============================================================
// EMBEDDED RATE CARD — UrbaneBolt B2C Light Weight (INR)
// Zones: Local | WithinZone | Metro | ROI | Special
// Slabs: 0.25 / 0.5 / 1 / 2 kg, then +Add.1kg per kg above 2 kg
// Air is NOT available for Local zone.
// ============================================================
type ZoneKey = "Local" | "WithinZone" | "Metro" | "ROI" | "Special";
type Mode = "surface" | "air";

interface SlabRates {
  upto_0_25: number | null;
  upto_0_5: number | null;
  add_0_5: number | null;   // unused but kept for reference
  upto_1: number | null;
  upto_2: number | null;
  add_1kg: number | null;   // additional per kg beyond 2 kg
}

const RATE_CARD: Record<Mode, Record<ZoneKey, SlabRates>> = {
  surface: {
    Local:      { upto_0_25: 23, upto_0_5: 25, add_0_5: 19, upto_1: 40, upto_2: 60,  add_1kg: 32 },
    WithinZone: { upto_0_25: 29, upto_0_5: 32, add_0_5: 28, upto_1: 55, upto_2: 72,  add_1kg: 43 },
    Metro:      { upto_0_25: 36, upto_0_5: 42, add_0_5: 33, upto_1: 65, upto_2: 95,  add_1kg: 52 },
    ROI:        { upto_0_25: 44, upto_0_5: 48, add_0_5: 39, upto_1: 83, upto_2: 111, add_1kg: 64 },
    Special:    { upto_0_25: 54, upto_0_5: 58, add_0_5: 45, upto_1: 93, upto_2: 162, add_1kg: 78 },
  },
  air: {
    Local:      { upto_0_25: null, upto_0_5: null, add_0_5: null, upto_1: null, upto_2: null, add_1kg: null },
    WithinZone: { upto_0_25: 38, upto_0_5: 52, add_0_5: 41, upto_1: 80,  upto_2: 120, add_1kg: 60 },
    Metro:      { upto_0_25: 42, upto_0_5: 60, add_0_5: 47, upto_1: 90,  upto_2: 138, add_1kg: 72 },
    ROI:        { upto_0_25: 52, upto_0_5: 75, add_0_5: 60, upto_1: 102, upto_2: 160, add_1kg: 85 },
    Special:    { upto_0_25: 68, upto_0_5: 83, add_0_5: 65, upto_1: 120, upto_2: 185, add_1kg: 98 },
  },
};

const TAT: Record<Mode, { label: string; days: number }> = {
  surface: { label: "Surface (2-4 days)", days: 3 },
  air:     { label: "Air (1-2 days)",     days: 2 },
};

const METRO_CITIES = new Set([
  "delhi", "new delhi", "mumbai", "bangalore", "bengaluru", "chennai",
  "kolkata", "hyderabad", "pune", "ahmedabad",
]);

const SPECIAL_STATES = new Set([
  "assam", "arunachal pradesh", "manipur", "meghalaya", "mizoram",
  "nagaland", "tripura", "sikkim", "jammu and kashmir", "ladakh",
  "andaman and nicobar islands", "lakshadweep",
]);

function pickSlabPrice(slab: SlabRates, chargeableKg: number): number | null {
  if (slab.upto_0_25 == null && slab.upto_2 == null) return null;
  if (chargeableKg <= 0.25 && slab.upto_0_25 != null) return slab.upto_0_25;
  if (chargeableKg <= 0.5  && slab.upto_0_5  != null) return slab.upto_0_5;
  if (chargeableKg <= 1    && slab.upto_1    != null) return slab.upto_1;
  if (chargeableKg <= 2    && slab.upto_2    != null) return slab.upto_2;
  // > 2 kg: base + per-extra-kg
  if (slab.upto_2 != null && slab.add_1kg != null) {
    const extraKg = Math.ceil(chargeableKg - 2);
    return slab.upto_2 + extraKg * slab.add_1kg;
  }
  return null;
}

function calculatePrice(
  zone: ZoneKey,
  mode: Mode,
  weightKg: number,
  l: number, w: number, h: number,
): number | null {
  const volWeight = (l * w * h) / 5000;
  const chargeable = Math.max(weightKg, volWeight);
  const slab = RATE_CARD[mode][zone];
  const price = pickSlabPrice(slab, chargeable);
  return price == null ? null : Math.round(price);
}

interface PincodeInfo {
  pincode: string;
  city?: string;
  state?: string;
  serviceable?: boolean;
}

async function lookupPincodes(env: any, pincodes: string[]): Promise<Record<string, PincodeInfo>> {
  const map: Record<string, PincodeInfo> = {};
  const variants: Array<{ path: string; method: string; body?: any }> = [
    { path: `/api/v1/location/pincodes/?pincodes=${pincodes.join(",")}`, method: "GET" },
    { path: "/api/v1/location/pincodes/", method: "POST", body: { pincodes } },
    { path: "/api/v1/services/pincode/", method: "POST", body: { pincodes } },
  ];
  for (const v of variants) {
    try {
      const init: RequestInit = { method: v.method };
      if (v.body) init.body = JSON.stringify(v.body);
      const res = await urbaneboltFetch(env, v.path, init);
      const text = await res.text();
      if (!res.ok) {
        console.warn("[urbanebolt-serviceability] pincode variant failed", v.path, res.status, text.slice(0, 200));
        continue;
      }
      let data: any;
      try { data = JSON.parse(text); } catch { continue; }
      const list: any[] = data?.data || data?.results || data?.pincodes || (Array.isArray(data) ? data : []);
      for (const item of list) {
        const pin = String(item?.pincode || item?.pin || "");
        if (!pin) continue;
        map[pin] = {
          pincode: pin,
          city: item?.city || item?.city_name || "",
          state: item?.state || item?.state_name || "",
          serviceable: item?.is_serviceable !== false && item?.serviceable !== false,
        };
      }
      if (Object.keys(map).length) return map;
    } catch (e) {
      console.warn("[urbanebolt-serviceability] pincode variant error", v.path, String(e));
    }
  }
  return map;
}

function detectZone(pickup: PincodeInfo, delivery: PincodeInfo): ZoneKey {
  const pCity = (pickup.city || "").trim().toLowerCase();
  const dCity = (delivery.city || "").trim().toLowerCase();
  const pState = (pickup.state || "").trim().toLowerCase();
  const dState = (delivery.state || "").trim().toLowerCase();
  const pPin = pickup.pincode || "";
  const dPin = delivery.pincode || "";

  // Special — NE / J&K / islands
  if (SPECIAL_STATES.has(pState) || SPECIAL_STATES.has(dState)) return "Special";

  // Local — same pincode (or same city)
  if (pPin && dPin && pPin === dPin) return "Local";
  if (pCity && dCity && pCity === dCity) return "Local";

  // Metro — both ends are top metros
  if (METRO_CITIES.has(pCity) && METRO_CITIES.has(dCity)) return "Metro";

  // WithinZone — same state
  if (pState && dState && pState === dState) return "WithinZone";

  // Default: Rest of India
  return "ROI";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const env = getEnvironmentFromRequest(req);
    const body = await req.json();
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

    // STRICT: Urbanebolt's pincode API must confirm BOTH pincodes.
    const map = await lookupPincodes(env, [pickup_pincode, delivery_pincode]);
    const pickup = map[pickup_pincode];
    const delivery = map[delivery_pincode];

    const pickupServiceable = !!pickup && pickup.serviceable === true;
    const deliveryServiceable = !!delivery && delivery.serviceable === true;
    const isServiceable = pickupServiceable && deliveryServiceable;

    if (!isServiceable) {
      return new Response(
        JSON.stringify({
          is_serviceable: false,
          pickup_serviceable: pickupServiceable,
          delivery_serviceable: deliveryServiceable,
          reason: !pickupServiceable
            ? "Pickup pincode not serviced by Urbanebolt"
            : "Delivery pincode not serviced by Urbanebolt",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const zone = detectZone(pickup, delivery);

    // Build Surface + Air services (skip Air if not available for the zone)
    const modes: Mode[] = ["surface", "air"];
    const services = modes
      .map((mode) => {
        const price = calculatePrice(zone, mode, weight_kg, length_cm, width_cm, height_cm);
        if (price == null) return null;
        const isAir = mode === "air";
        return {
          service_code: `ub_${zone.toLowerCase()}_${mode}`,
          service_name: `Urbanebolt ${zone} ${isAir ? "Air" : "Surface"}`,
          tat_days: TAT[mode].days,
          tat_label: TAT[mode].label,
          delivery_modes: { express: isAir, standard: !isAir },
          is_cod: false,
          pickup: true,
          delivery: true,
          insurance: false,
          rate: {
            rate_id: `ub_rate_${zone.toLowerCase()}_${mode}`,
            price: { amount: price, currency: "INR", type: "calculated" },
            description: `Urbanebolt ${zone} ${isAir ? "Air" : "Surface"} (B2C Light Weight)`,
          },
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (services.length === 0) {
      return new Response(
        JSON.stringify({
          is_serviceable: false,
          reason: "No rate available for this zone/weight combination",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const partner = {
      partner_id: "urbanebolt_direct",
      partner_code: "urbanebolt",
      partner_name: "Urbanebolt",
      is_serviceable: true,
      rating: 4.0,
      services,
      metadata: {
        pickup_city: pickup.city,
        delivery_city: delivery.city,
        pickup_state: pickup.state,
        delivery_state: delivery.state,
        zone,
        rate_card: "B2C Light Weight (embedded)",
      },
    };

    return new Response(
      JSON.stringify({ is_serviceable: true, partner }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[urbanebolt-serviceability] error:", err);
    return new Response(
      JSON.stringify({ is_serviceable: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
