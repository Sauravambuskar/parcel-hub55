// =============================================================================
// EMBEDDED PARTNER RATE CARDS
// Source: ViaSetu_1.xlsx (uploaded by client). Single source of truth used for:
//   1. Verification — cross-checks live partner API prices
//   2. Fallback     — supplies a price when live API fails / has no rate API
// All prices are INR, pre-tax (GST added downstream). FSC included where the
// contract specifies it (UrbaneBolt 15%, Shadowfax 30% standard / 10% prime).
// =============================================================================

export type Partner =
  | "delhivery"
  | "shree_maruti"
  | "urbanebolt"
  | "xpressbees"
  | "shadowfax";

export type ServiceMode = "surface" | "air" | "express" | "standard";

export interface PinInfo {
  pincode: string;
  city?: string | null;
  state?: string | null;
}

export interface CardQuote {
  partner: Partner;
  mode: ServiceMode;
  zone: string;
  chargeable_g: number;
  base_price: number;        // raw slab price
  fsc_percent: number;       // 0.30 = 30%
  price_with_fsc: number;    // base_price * (1 + fsc)
  source: "embedded_card";
  card_version: string;
}

const CARD_VERSION = "ViaSetu_1.xlsx";

// -----------------------------------------------------------------------------
// Shared geo helpers
// -----------------------------------------------------------------------------
const METRO_CITIES = new Set([
  "delhi", "new delhi", "mumbai", "navi mumbai", "thane",
  "bangalore", "bengaluru", "chennai", "kolkata", "hyderabad",
  "pune", "ahmedabad",
]);

const SPECIAL_STATES = new Set([
  "assam", "arunachal pradesh", "manipur", "meghalaya", "mizoram",
  "nagaland", "tripura", "sikkim", "jammu and kashmir", "ladakh",
  "andaman and nicobar islands", "lakshadweep",
]);

// Rough state-to-region map for zonal distance heuristics (Delhivery / SMIL).
const REGION: Record<string, "north" | "south" | "east" | "west" | "central" | "ne"> = {
  "delhi": "north", "haryana": "north", "punjab": "north", "uttar pradesh": "north",
  "uttarakhand": "north", "himachal pradesh": "north", "chandigarh": "north",
  "rajasthan": "north", "jammu and kashmir": "north", "ladakh": "north",
  "maharashtra": "west", "gujarat": "west", "goa": "west", "dadra and nagar haveli": "west",
  "daman and diu": "west",
  "karnataka": "south", "kerala": "south", "tamil nadu": "south",
  "andhra pradesh": "south", "telangana": "south", "puducherry": "south",
  "west bengal": "east", "odisha": "east", "bihar": "east", "jharkhand": "east",
  "madhya pradesh": "central", "chhattisgarh": "central",
  "assam": "ne", "arunachal pradesh": "ne", "manipur": "ne", "meghalaya": "ne",
  "mizoram": "ne", "nagaland": "ne", "tripura": "ne", "sikkim": "ne",
};

function norm(s?: string | null): string {
  return (s || "").split(" - ")[0].trim().toLowerCase();
}

function chargeableGrams(weightKg: number, l: number, w: number, h: number): number {
  const actual = Math.max(1, Number(weightKg) || 0) * 1000;
  const vol = ((Number(l) || 0) * (Number(w) || 0) * (Number(h) || 0)) / 5000 * 1000;
  return Math.max(1, Math.ceil(Math.max(actual, vol)));
}

// =============================================================================
// DELHIVERY — Surface Silver + Express Silver
// Zones A / B / C1 / C2 / D1 / D2 / E / F
// =============================================================================
type DlZone = "A" | "B" | "C1" | "C2" | "D1" | "D2" | "E" | "F";

interface DlSlabs {
  d250: number;       // 0-250g
  d250_500: number;   // 250-500g add
  add500_5kg: number; // additional 500g till 5kg
  upto_5kg: number;
  add1_10kg: number;  // additional 1kg till 10kg
  upto_10kg: number;
  add1: number;       // additional 1kg above 10kg
}

const DELHIVERY_SURFACE: Record<DlZone, DlSlabs> = {
  A:  { d250: 28,  d250_500: 6,  add500_5kg: 9,  upto_5kg: 110, add1_10kg: 26, upto_10kg: 194, add1: 18 },
  B:  { d250: 32,  d250_500: 6,  add500_5kg: 14, upto_5kg: 164, add1_10kg: 29, upto_10kg: 244, add1: 22 },
  C1: { d250: 33,  d250_500: 9,  add500_5kg: 19, upto_5kg: 197, add1_10kg: 34, upto_10kg: 289, add1: 24 },
  C2: { d250: 36,  d250_500: 10, add500_5kg: 24, upto_5kg: 211, add1_10kg: 36, upto_10kg: 312, add1: 26 },
  D1: { d250: 37,  d250_500: 9,  add500_5kg: 24, upto_5kg: 221, add1_10kg: 38, upto_10kg: 325, add1: 28 },
  D2: { d250: 38,  d250_500: 10, add500_5kg: 27, upto_5kg: 234, add1_10kg: 42, upto_10kg: 346, add1: 31 },
  E:  { d250: 45,  d250_500: 11, add500_5kg: 33, upto_5kg: 272, add1_10kg: 44, upto_10kg: 402, add1: 37 },
  F:  { d250: 50,  d250_500: 13, add500_5kg: 37, upto_5kg: 299, add1_10kg: 55, upto_10kg: 440, add1: 40 },
};

// Express Silver — sheet collapses C1/C2 → C and D1/D2 → D
const DELHIVERY_EXPRESS: Record<"A" | "B" | "C" | "D" | "E" | "F", { d250: number; d250_500: number; add500: number }> = {
  A: { d250: 28, d250_500: 6,  add500: 9 },
  B: { d250: 32, d250_500: 6,  add500: 14 },
  C: { d250: 42, d250_500: 13, add500: 39 },
  D: { d250: 47, d250_500: 17, add500: 43 },
  E: { d250: 56, d250_500: 18, add500: 46 },
  F: { d250: 63, d250_500: 22, add500: 53 },
};

function delhiveryZone(p: PinInfo, d: PinInfo): DlZone {
  const pCity = norm(p.city), dCity = norm(d.city);
  const pState = norm(p.state), dState = norm(d.state);

  // Zone A — same city
  if (pCity && dCity && pCity === dCity) return "A";
  // Special — NE / J&K / islands
  if (SPECIAL_STATES.has(pState) || SPECIAL_STATES.has(dState)) return "F";

  const pRegion = REGION[pState];
  const dRegion = REGION[dState];
  const bothMetro = METRO_CITIES.has(pCity) && METRO_CITIES.has(dCity);

  // Zone B — same state / regional (single connection, ≤500km approx.)
  if (pState && dState && pState === dState) return "B";

  // Adjacent regions ≈ ≤1400km (C1 metro-metro / D1 mixed)
  const sameRegion = pRegion && dRegion && pRegion === dRegion;
  if (sameRegion) return bothMetro ? "C1" : "D1";

  // Cross-region ≈ 1401-2500km (C2 / D2)
  return bothMetro ? "C2" : "D2";
}

function delhiverySurfacePrice(zone: DlZone, g: number): number {
  const s = DELHIVERY_SURFACE[zone];
  if (g <= 250) return s.d250;
  if (g <= 500) return s.d250 + s.d250_500;
  if (g <= 5000) {
    const extra500s = Math.ceil((g - 500) / 500);
    return s.d250 + s.d250_500 + extra500s * s.add500_5kg;
  }
  if (g <= 10000) {
    const extraKg = Math.ceil((g - 5000) / 1000);
    return s.upto_5kg + extraKg * s.add1_10kg;
  }
  const extraKg = Math.ceil((g - 10000) / 1000);
  return s.upto_10kg + extraKg * s.add1;
}

function delhiveryExpressPrice(zone: DlZone, g: number): number {
  const collapsed: "A" | "B" | "C" | "D" | "E" | "F" =
    zone === "C1" || zone === "C2" ? "C" :
    zone === "D1" || zone === "D2" ? "D" :
    zone;
  const s = DELHIVERY_EXPRESS[collapsed];
  if (g <= 250) return s.d250;
  if (g <= 500) return s.d250 + s.d250_500;
  const extra500s = Math.ceil((g - 500) / 500);
  return s.d250 + s.d250_500 + extra500s * s.add500;
}

// =============================================================================
// SHREE MARUTI — B2C Light Weight (Surface + Air)
// =============================================================================
type SmZone = "Local" | "WithinZone" | "Metro" | "ROI" | "Special";

interface SmSlabs {
  d025: number | null;
  d050: number | null;
  add050: number | null;
  upto_1: number | null;
  upto_2: number | null;
  add1: number | null;
}

const SM_SURFACE: Record<SmZone, SmSlabs> = {
  Local:      { d025: 23, d050: 25, add050: 19, upto_1: 40, upto_2: 60,  add1: 32 },
  WithinZone: { d025: 29, d050: 32, add050: 28, upto_1: 55, upto_2: 72,  add1: 43 },
  Metro:      { d025: 36, d050: 42, add050: 33, upto_1: 65, upto_2: 95,  add1: 52 },
  ROI:        { d025: 44, d050: 48, add050: 39, upto_1: 83, upto_2: 111, add1: 64 },
  Special:    { d025: 54, d050: 58, add050: 45, upto_1: 93, upto_2: 162, add1: 78 },
};

const SM_AIR: Record<SmZone, SmSlabs> = {
  Local:      { d025: null, d050: null, add050: null, upto_1: null, upto_2: null, add1: null },
  WithinZone: { d025: 38,   d050: 52,   add050: 41,   upto_1: 80,   upto_2: 120,  add1: 60 },
  Metro:      { d025: 42,   d050: 60,   add050: 47,   upto_1: 90,   upto_2: 138,  add1: 72 },
  ROI:        { d025: 52,   d050: 75,   add050: 60,   upto_1: 102,  upto_2: 160,  add1: 85 },
  Special:    { d025: 68,   d050: 83,   add050: 65,   upto_1: 120,  upto_2: 185,  add1: 98 },
};

function smZone(p: PinInfo, d: PinInfo): SmZone {
  const pCity = norm(p.city), dCity = norm(d.city);
  const pState = norm(p.state), dState = norm(d.state);
  if (SPECIAL_STATES.has(pState) || SPECIAL_STATES.has(dState)) return "Special";
  if (p.pincode && d.pincode && p.pincode === d.pincode) return "Local";
  if (pCity && dCity && pCity === dCity) return "Local";
  if (METRO_CITIES.has(pCity) && METRO_CITIES.has(dCity)) return "Metro";
  if (pState && dState && pState === dState) return "WithinZone";
  return "ROI";
}

function smPrice(slab: SmSlabs, kg: number): number | null {
  if (slab.d025 == null && slab.upto_2 == null) return null;
  if (kg <= 0.25 && slab.d025 != null) return slab.d025;
  if (kg <= 0.5  && slab.d050 != null) return slab.d050;
  if (kg <= 1    && slab.upto_1 != null) return slab.upto_1;
  if (kg <= 2    && slab.upto_2 != null) return slab.upto_2;
  if (slab.upto_2 != null && slab.add1 != null) {
    const extra = Math.ceil(kg - 2);
    return slab.upto_2 + extra * slab.add1;
  }
  return null;
}

// =============================================================================
// URBANEBOLT — Zone A–E, simple 500g + Add 500g (FSC 15%)
// =============================================================================
type UbZone = "A" | "B" | "C" | "D" | "E";

interface UbSlab {
  first500: number;
  add500: number;
  tatHours: string;
}

// Sheet labels:
//   Zone A = Intracity SDD (12 hrs)
//   Zone B = Intracity NDD (24 hrs)
//   Zone C = Intercity      (24 hrs)   -> within state
//   Zone D = Metro          (24 hrs)
//   Zone E = ROI            (24-48 hrs)
//   F      = NE             (48-72 hrs)  -> using "F" internally, exposed as Special
const UB_RATES: Record<UbZone | "F", UbSlab> = {
  A: { first500: 35, add500: 35, tatHours: "12 hrs" },
  B: { first500: 25, add500: 22, tatHours: "24 hrs" },
  C: { first500: 38, add500: 35, tatHours: "24 hrs" },
  D: { first500: 55, add500: 52, tatHours: "24 hrs" },
  E: { first500: 58, add500: 55, tatHours: "24-48 hrs" },
  F: { first500: 75, add500: 72, tatHours: "48-72 hrs" },
};

const UB_FSC = 0.15;

function ubZone(p: PinInfo, d: PinInfo): UbZone | "F" {
  const pCity = norm(p.city), dCity = norm(d.city);
  const pState = norm(p.state), dState = norm(d.state);
  if (SPECIAL_STATES.has(pState) || SPECIAL_STATES.has(dState)) return "F";
  if (p.pincode && d.pincode && p.pincode === d.pincode) return "A";
  if (pCity && dCity && pCity === dCity) return "B";
  if (METRO_CITIES.has(pCity) && METRO_CITIES.has(dCity)) return "D";
  if (pState && dState && pState === dState) return "C";
  return "E";
}

function ubPrice(zone: UbZone | "F", g: number): number {
  const s = UB_RATES[zone];
  if (g <= 500) return s.first500;
  const extra = Math.ceil((g - 500) / 500);
  return s.first500 + extra * s.add500;
}

// =============================================================================
// XPRESSBEES — explicit weight ladder 500g..20kg, zones z1..z6
// =============================================================================
type XbZone = "z1" | "z2" | "z3" | "z4" | "z5" | "z6";

const XB_LADDER_G = [500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
  6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000,
  16000, 17000, 18000, 19000, 20000];

const XB_SURFACE: Record<XbZone, number[]> = {
  z1: [26, 34, 34, 42, 50, 58, 66, 74, 82, 90, 98, 110, 122, 134, 146, 158, 170, 182, 194, 206, 218, 230, 242, 254, 266, 278],
  z2: [31, 42, 42, 53, 64, 75, 86, 97, 108, 119, 130, 148, 166, 184, 202, 220, 238, 256, 274, 292, 310, 328, 346, 364, 382, 400],
  z3: [31, 42, 42, 53, 64, 75, 86, 97, 108, 119, 130, 148, 166, 184, 202, 220, 238, 256, 274, 292, 310, 328, 346, 364, 382, 400],
  z4: [34, 49, 49, 64, 79, 94, 109, 124, 139, 154, 169, 195, 221, 247, 273, 299, 325, 351, 377, 403, 429, 455, 481, 507, 533, 559],
  z5: [47, 75, 75, 103, 131, 159, 187, 215, 243, 271, 299, 343, 387, 431, 475, 519, 563, 607, 651, 695, 739, 783, 827, 871, 915, 959],
  z6: [38, 58, 58, 78, 98, 118, 138, 158, 178, 198, 218, 256, 294, 332, 370, 408, 446, 484, 522, 560, 598, 636, 674, 712, 750, 788],
};

const XB_AIR: Record<XbZone, number[]> = {
  z1: [28, 36, 36, 44, 53, 61, 70, 78, 87, 95, 104, 116, 129, 142, 155, 167, 180, 193, 205, 218, 231, 244, 256, 269, 282, 294],
  z2: [33, 44, 44, 56, 68, 79, 91, 103, 114, 126, 138, 157, 176, 195, 214, 233, 252, 271, 290, 309, 328, 347, 366, 385, 404, 424],
  z3: [33, 44, 44, 56, 68, 79, 91, 103, 114, 126, 138, 157, 176, 195, 214, 233, 252, 271, 290, 309, 328, 347, 366, 385, 404, 424],
  z4: [49, 83, 83, 116, 150, 184, 218, 252, 286, 320, 354, 416, 479, 541, 604, 666, 728, 791, 853, 916, 978, 1041, 1103, 1166, 1228, 1291],
  z5: [68, 111, 111, 155, 198, 241, 285, 328, 372, 415, 458, 539, 619, 700, 780, 861, 941, 1022, 1102, 1183, 1263, 1344, 1424, 1505, 1585, 1666],
  z6: [54, 89, 89, 123, 157, 191, 225, 260, 294, 328, 362, 431, 499, 567, 636, 704, 773, 841, 909, 978, 1046, 1115, 1183, 1251, 1320, 1388],
};

function xbZone(p: PinInfo, d: PinInfo): XbZone {
  const pCity = norm(p.city), dCity = norm(d.city);
  const pState = norm(p.state), dState = norm(d.state);
  // z5: NE / J&K + Kerala + A&N
  if (SPECIAL_STATES.has(pState) || SPECIAL_STATES.has(dState)) return "z5";
  if (pState === "kerala" || dState === "kerala") return "z5";
  if (pCity && dCity && pCity === dCity) return "z1";
  if (METRO_CITIES.has(pCity) && METRO_CITIES.has(dCity)) return "z4";
  if (pState && dState && pState === dState) return "z2";
  const sameRegion = REGION[pState] && REGION[dState] && REGION[pState] === REGION[dState];
  if (sameRegion) return "z3";
  return "z6";
}

function xbPrice(table: Record<XbZone, number[]>, zone: XbZone, g: number): number {
  const ladder = table[zone];
  for (let i = 0; i < XB_LADDER_G.length; i++) {
    if (g <= XB_LADDER_G[i]) return ladder[i];
  }
  // Beyond 20kg: extrapolate using the per-kg delta of the last two slabs
  const last = ladder[ladder.length - 1];
  const prev = ladder[ladder.length - 2];
  const perKg = last - prev;
  const extraKg = Math.ceil((g - 20000) / 1000);
  return last + extraKg * perKg;
}

// =============================================================================
// SHADOWFAX — Standard Express + SFX Prime (FSC 30% std, 10% prime), RVP 1.7x
// =============================================================================
type SfxStdZone = "intracity" | "within_zone" | "metro" | "roi" | "special_zone";
type SfxPrimeZone = "intracity_sdd" | "intracity_ndd" | "zonal_ndd" | "intercity_air";

const SFX_STANDARD: Record<SfxStdZone, { first: number; additional: number; fsc: number }> = {
  intracity:    { first: 33, additional: 28, fsc: 0.30 },
  within_zone:  { first: 39, additional: 31, fsc: 0.30 },
  metro:        { first: 55, additional: 45, fsc: 0.30 },
  roi:          { first: 60, additional: 49, fsc: 0.30 },
  special_zone: { first: 72, additional: 58, fsc: 0.30 },
};

const SFX_PRIME: Record<SfxPrimeZone, { first: number; additional: number; fsc: number }> = {
  intracity_sdd: { first: 45, additional: 37, fsc: 0.10 },
  intracity_ndd: { first: 40, additional: 32, fsc: 0.10 },
  zonal_ndd:     { first: 42, additional: 34, fsc: 0.10 },
  intercity_air: { first: 59, additional: 48, fsc: 0.10 },
};

const SFX_RVP_MULTIPLIER = 1.7;

function sfxStdZone(p: PinInfo, d: PinInfo): SfxStdZone {
  const pCity = norm(p.city), dCity = norm(d.city);
  const pState = norm(p.state), dState = norm(d.state);
  if (SPECIAL_STATES.has(pState) || SPECIAL_STATES.has(dState)) return "special_zone";
  if (p.pincode && d.pincode && p.pincode === d.pincode) return "intracity";
  if (pCity && dCity && pCity === dCity) return "intracity";
  if (METRO_CITIES.has(pCity) && METRO_CITIES.has(dCity)) return "metro";
  if (pState && dState && pState === dState) return "within_zone";
  return "roi";
}

function sfxPrimeZone(p: PinInfo, d: PinInfo): SfxPrimeZone | null {
  const pCity = norm(p.city), dCity = norm(d.city);
  const pState = norm(p.state), dState = norm(d.state);
  if (SPECIAL_STATES.has(pState) || SPECIAL_STATES.has(dState)) return null;
  if (pCity && dCity && pCity === dCity) return "intracity_ndd";
  if (pState && dState && pState === dState) return "zonal_ndd";
  if (METRO_CITIES.has(pCity) && METRO_CITIES.has(dCity)) return "intercity_air";
  return null;
}

function sfxPrice(first: number, additional: number, g: number): number {
  if (g <= 500) return first;
  const extra = Math.ceil((g - 500) / 500);
  return first + extra * additional;
}

// =============================================================================
// PUBLIC API — quoteFromCard
// =============================================================================
export interface QuoteOptions {
  rvp?: boolean;             // for SFX: applies 1.7x multiplier
  sfxTier?: "standard" | "prime";
}

export function quoteFromCard(
  partner: Partner,
  mode: ServiceMode,
  pickup: PinInfo,
  delivery: PinInfo,
  weightKg: number,
  dims: { l: number; w: number; h: number },
  opts: QuoteOptions = {},
): CardQuote | null {
  const g = chargeableGrams(weightKg, dims.l, dims.w, dims.h);

  switch (partner) {
    case "delhivery": {
      const zone = delhiveryZone(pickup, delivery);
      const base = mode === "air" || mode === "express"
        ? delhiveryExpressPrice(zone, g)
        : delhiverySurfacePrice(zone, g);
      return mkQuote("delhivery", mode, zone, g, base, 0);
    }
    case "shree_maruti": {
      const zone = smZone(pickup, delivery);
      const slabs = mode === "air" || mode === "express" ? SM_AIR[zone] : SM_SURFACE[zone];
      const base = smPrice(slabs, Math.max(weightKg, g / 1000));
      if (base == null) return null;
      return mkQuote("shree_maruti", mode, zone, g, base, 0);
    }
    case "urbanebolt": {
      const zone = ubZone(pickup, delivery);
      const base = ubPrice(zone, g);
      const labelZone = zone === "F" ? "Special" : `Zone ${zone}`;
      return mkQuote("urbanebolt", mode, labelZone, g, base, UB_FSC);
    }
    case "xpressbees": {
      const zone = xbZone(pickup, delivery);
      const table = mode === "air" || mode === "express" ? XB_AIR : XB_SURFACE;
      const base = xbPrice(table, zone, g);
      return mkQuote("xpressbees", mode, zone, g, base, 0);
    }
    case "shadowfax": {
      const tier = opts.sfxTier || "standard";
      if (tier === "prime") {
        const z = sfxPrimeZone(pickup, delivery);
        if (!z) return null;
        const s = SFX_PRIME[z];
        let base = sfxPrice(s.first, s.additional, g);
        if (opts.rvp) base = base * SFX_RVP_MULTIPLIER;
        return mkQuote("shadowfax", mode, z, g, base, s.fsc);
      } else {
        const z = sfxStdZone(pickup, delivery);
        const s = SFX_STANDARD[z];
        let base = sfxPrice(s.first, s.additional, g);
        if (opts.rvp) base = base * SFX_RVP_MULTIPLIER;
        return mkQuote("shadowfax", mode, z, g, base, s.fsc);
      }
    }
  }
}

function mkQuote(
  partner: Partner,
  mode: ServiceMode,
  zone: string,
  g: number,
  base: number,
  fsc: number,
): CardQuote {
  const baseRounded = Math.round(base);
  const total = Math.round(base * (1 + fsc));
  return {
    partner,
    mode,
    zone: String(zone),
    chargeable_g: g,
    base_price: baseRounded,
    fsc_percent: fsc,
    price_with_fsc: total,
    source: "embedded_card",
    card_version: CARD_VERSION,
  };
}

// =============================================================================
// VERIFICATION HELPER
// =============================================================================
export interface VerifyResult {
  ok: boolean;
  delta_pct: number;
  chosen: "api" | "card";
  api_price: number;
  card_price: number;
  reason?: string;
}

const DEFAULT_TOLERANCE = 0.20;  // ±20%
const HARD_CAP_MULTIPLIER = 2.0; // > 2x card price → force card

export function verifyAgainstCard(
  apiPrice: number,
  card: CardQuote,
  tolerance: number = DEFAULT_TOLERANCE,
): VerifyResult {
  const cardPrice = card.price_with_fsc;
  if (!cardPrice || cardPrice <= 0) {
    return {
      ok: true, delta_pct: 0, chosen: "api",
      api_price: apiPrice, card_price: cardPrice,
      reason: "card_unavailable",
    };
  }
  const delta = (apiPrice - cardPrice) / cardPrice;
  const absDelta = Math.abs(delta);

  // Hard cap: API more than 2x card → force card price
  if (apiPrice > cardPrice * HARD_CAP_MULTIPLIER) {
    console.warn(`[rate-cards] HARD-CAP triggered partner=${card.partner} mode=${card.mode} zone=${card.zone} api=${apiPrice} card=${cardPrice} delta=${(delta * 100).toFixed(1)}%`);
    return {
      ok: false, delta_pct: delta, chosen: "card",
      api_price: apiPrice, card_price: cardPrice,
      reason: "api_exceeds_2x_card",
    };
  }

  if (absDelta > tolerance) {
    console.warn(`[rate-cards] tolerance exceeded partner=${card.partner} mode=${card.mode} zone=${card.zone} api=${apiPrice} card=${cardPrice} delta=${(delta * 100).toFixed(1)}%`);
    return {
      ok: false, delta_pct: delta, chosen: "api",
      api_price: apiPrice, card_price: cardPrice,
      reason: "delta_exceeds_tolerance",
    };
  }

  return {
    ok: true, delta_pct: delta, chosen: "api",
    api_price: apiPrice, card_price: cardPrice,
  };
}

// Convenience helper for serviceability functions: pick a final price + metadata.
export function resolvePrice(
  apiPrice: number | null,
  card: CardQuote | null,
): { price: number; rate_source: "api" | "card" | "card_fallback"; verify: VerifyResult | null } {
  if (apiPrice != null && apiPrice > 0 && card) {
    const v = verifyAgainstCard(apiPrice, card);
    return { price: v.chosen === "card" ? card.price_with_fsc : apiPrice, rate_source: v.chosen, verify: v };
  }
  if (apiPrice != null && apiPrice > 0) {
    return { price: apiPrice, rate_source: "api", verify: null };
  }
  if (card) {
    return { price: card.price_with_fsc, rate_source: "card_fallback", verify: null };
  }
  return { price: 0, rate_source: "api", verify: null };
}
