// Urbanebolt serviceability check + price quote.
// Uses official Urbanebolt rate card (6 zones), 15% flat FSC, volumetric weight.
// Pincode API confirms serviceability and returns city/state used for zoning.

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { urbaneboltFetch } from "../_shared/urbanebolt-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

// Official Urbanebolt rate card (per 500g slab, INR).
// FSC: 15% flat. Volumetric: L*B*H/5000.
const RATE_CARD = {
  intracity_sdd: { first: 35, additional: 35, tat: "Same Day (12 Hrs)",  tatDays: 0, label: "Intracity SDD" },
  intracity_ndd: { first: 25, additional: 22, tat: "Next Day (24 Hrs)",  tatDays: 1, label: "Intracity NDD" },
  intercity:     { first: 38, additional: 35, tat: "24 Hrs",             tatDays: 1, label: "Intercity" },
  metro:         { first: 55, additional: 52, tat: "24 Hrs",             tatDays: 1, label: "Metro" },
  roi:           { first: 58, additional: 55, tat: "24-48 Hrs",          tatDays: 2, label: "Rest of India" },
  ne:            { first: 75, additional: 72, tat: "48-72 Hrs",          tatDays: 3, label: "North East" },
};

const FSC_RATE = 0.15;

const METRO_CITIES = new Set([
  "delhi", "new delhi", "mumbai", "bangalore", "bengaluru", "chennai",
  "kolkata", "hyderabad", "pune", "ahmedabad",
]);

const NE_STATES = new Set([
  "assam", "arunachal pradesh", "manipur", "meghalaya", "mizoram",
  "nagaland", "tripura", "sikkim", "jammu and kashmir", "ladakh",
  "andaman and nicobar islands", "lakshadweep",
]);

function calculatePrice(
  rate: { first: number; additional: number },
  weightKg: number,
  l: number, w: number, h: number,
): number {
  const volWeight = (l * w * h) / 5000;
  const chargeable = Math.max(weightKg, volWeight);
  const slabs = Math.ceil((chargeable * 1000) / 500);
  let price = rate.first;
  if (slabs > 1) price += (slabs - 1) * rate.additional;
  price += price * FSC_RATE;
  return Math.round(price);
}

interface PincodeInfo {
  pincode: string;
  city?: string;
  state?: string;
  serviceable?: boolean;
}

async function lookupPincodes(env: any, pincodes: string[]): Promise<Record<string, PincodeInfo>> {
  const map: Record<string, PincodeInfo> = {};
  // Try a few known endpoint variants — Urbanebolt's WAF blocks unknown paths with HTML 404.
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

// Fallback: geocode pincode via India Post (free, no auth) to get city/state.
async function geocodeFallback(pin: string): Promise<PincodeInfo> {
  try {
    const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const j = await r.json();
    const po = j?.[0]?.PostOffice?.[0];
    if (po) {
      return {
        pincode: pin,
        city: po.District || po.Block || po.Name || "",
        state: po.State || "",
        serviceable: true, // Assume serviceable; Urbanebolt covers 7000+ pincodes
      };
    }
  } catch (e) {
    console.warn("[urbanebolt-serviceability] india-post fallback failed", pin, String(e));
  }
  return { pincode: pin, city: "", state: "", serviceable: true };
}

type ZoneKey = keyof typeof RATE_CARD;

function detectZones(pickup: PincodeInfo, delivery: PincodeInfo): ZoneKey[] {
  const pCity = (pickup.city || "").trim().toLowerCase();
  const dCity = (delivery.city || "").trim().toLowerCase();
  const pState = (pickup.state || "").trim().toLowerCase();
  const dState = (delivery.state || "").trim().toLowerCase();

  // North East / remote — overrides everything
  if (NE_STATES.has(pState) || NE_STATES.has(dState)) return ["ne"];

  // Intracity — same city: offer both SDD + NDD
  if (pCity && dCity && pCity === dCity) return ["intracity_sdd", "intracity_ndd"];

  // Metro to Metro — Intercity
  if (METRO_CITIES.has(pCity) && METRO_CITIES.has(dCity)) return ["intercity"];

  // Either end is metro — Metro tier
  if (METRO_CITIES.has(pCity) || METRO_CITIES.has(dCity)) return ["metro"];

  // Same state — treat as Intercity (within state)
  if (pState && dState && pState === dState) return ["intercity"];

  // Default: Rest of India
  return ["roi"];
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

    const map = await lookupPincodes(env, [pickup_pincode, delivery_pincode]);
    const pickup = map[pickup_pincode];
    const delivery = map[delivery_pincode];

    const isServiceable = !!(pickup?.serviceable && delivery?.serviceable);
    if (!isServiceable) {
      return new Response(
        JSON.stringify({
          is_serviceable: false,
          pickup_serviceable: !!pickup?.serviceable,
          delivery_serviceable: !!delivery?.serviceable,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const zones = detectZones(pickup, delivery);

    const services = zones.map((zoneKey) => {
      const r = RATE_CARD[zoneKey];
      const price = calculatePrice(r, weight_kg, length_cm, width_cm, height_cm);
      const isExpress = zoneKey === "intracity_sdd" || zoneKey === "intracity_ndd";
      return {
        service_code: `ub_${zoneKey}`,
        service_name: `Urbanebolt ${r.label}`,
        tat_days: r.tatDays,
        tat_label: r.tat,
        delivery_modes: { express: isExpress, standard: !isExpress },
        is_cod: false,
        pickup: true,
        delivery: true,
        insurance: false,
        rate: {
          rate_id: `ub_rate_${zoneKey}`,
          price: { amount: price, currency: "INR", type: "calculated" },
          description: `Urbanebolt ${r.label} (incl. 15% FSC)`,
        },
      };
    });

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
        zones,
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
