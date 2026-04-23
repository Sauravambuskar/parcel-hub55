// Urbanebolt serviceability check + price quote.
// Calls Pincode API for both pickup & delivery, computes price from the rate
// card (intra-city + intercity tiers, weight slabs, FSC), and returns a
// partner shape compatible with Shadowfax/Delhivery.

import { getEnvironmentFromRequest } from "../_shared/environment.ts";
import { urbaneboltFetch } from "../_shared/urbanebolt-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-environment",
};

// Rate card (forward, per 500g slab).
// Tuned to fall in the same competitive range as Shadowfax/Delhivery; refine
// once Urbanebolt shares an official rate sheet.
const RATE_CARD = {
  intracity:   { first: 45, additional: 35, tat: "Same/Next Day", tatDays: 1, fsc: 0.10 },
  intercity:   { first: 70, additional: 55, tat: "2-4 Days",      tatDays: 3, fsc: 0.20 },
};

function calculatePrice(
  rate: { first: number; additional: number; fsc: number },
  weightKg: number,
  l: number, w: number, h: number,
): number {
  const volWeight = (l * w * h) / 5000;
  const chargeable = Math.max(weightKg, volWeight);
  const slabs = Math.ceil((chargeable * 1000) / 500);
  let price = rate.first;
  if (slabs > 1) price += (slabs - 1) * rate.additional;
  price += price * rate.fsc;
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
  try {
    const url = `/api/v1/location/pincodes/?pincodes=${pincodes.join(",")}`;
    const res = await urbaneboltFetch(env, url, { method: "GET" });
    const text = await res.text();
    if (!res.ok) {
      console.warn("[urbanebolt-serviceability] pincode lookup failed", res.status, text.slice(0, 400));
      return map;
    }
    let data: any;
    try { data = JSON.parse(text); } catch { return map; }
    const list: any[] = data?.data || data?.results || data?.pincodes || (Array.isArray(data) ? data : []);
    for (const item of list) {
      const pin = String(item?.pincode || item?.pin || "");
      if (!pin) continue;
      map[pin] = {
        pincode: pin,
        city: item?.city || item?.city_name || "",
        state: item?.state || item?.state_name || "",
        // Treat presence in response as serviceable unless explicitly false
        serviceable: item?.is_serviceable !== false && item?.serviceable !== false,
      };
    }
  } catch (e) {
    console.error("[urbanebolt-serviceability] pincode lookup error", e);
  }
  return map;
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

    // Decide intracity vs intercity based on city match
    const sameCity =
      pickup.city && delivery.city &&
      pickup.city.trim().toLowerCase() === delivery.city.trim().toLowerCase();

    const services: any[] = [];
    if (sameCity) {
      const r = RATE_CARD.intracity;
      const price = calculatePrice(r, weight_kg, length_cm, width_cm, height_cm);
      services.push({
        service_code: "ub_intracity",
        service_name: "Urbanebolt Intra-City",
        tat_days: r.tatDays,
        tat_label: r.tat,
        delivery_modes: { express: true, standard: false },
        is_cod: false,
        pickup: true,
        delivery: true,
        insurance: false,
        rate: {
          rate_id: "ub_rate_intracity",
          price: { amount: price, currency: "INR", type: "calculated" },
          description: "Urbanebolt Intra-City Express",
        },
      });
    } else {
      const r = RATE_CARD.intercity;
      const price = calculatePrice(r, weight_kg, length_cm, width_cm, height_cm);
      services.push({
        service_code: "ub_intercity",
        service_name: "Urbanebolt Intercity",
        tat_days: r.tatDays,
        tat_label: r.tat,
        delivery_modes: { express: false, standard: true },
        is_cod: false,
        pickup: true,
        delivery: true,
        insurance: false,
        rate: {
          rate_id: "ub_rate_intercity",
          price: { amount: price, currency: "INR", type: "calculated" },
          description: "Urbanebolt Intercity Standard",
        },
      });
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
        zone: sameCity ? "intracity" : "intercity",
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
