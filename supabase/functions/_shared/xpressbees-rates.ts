// XpressBees rate card — Surface + Air across 6 zones (per official sheet).
// Slabs in grams, prices in INR (excl. GST). Volumetric divisor: 5000 cm³/kg.
// COD %: 1.3% (we don't expose COD yet — kept for reference).

export type XbZone = "z1" | "z2" | "z3" | "z4" | "z5" | "z6";
export type XbMode = "surface" | "air";

interface Slab {
  weight: number; // grams (upper bound of the slab)
  z1: number; z2: number; z3: number; z4: number; z5: number; z6: number;
}

const SURFACE: Slab[] = [
  { weight: 500,   z1: 26,  z2: 31,  z3: 31,  z4: 34,  z5: 47,  z6: 38 },
  { weight: 750,   z1: 34,  z2: 42,  z3: 42,  z4: 49,  z5: 75,  z6: 58 },
  { weight: 1000,  z1: 34,  z2: 42,  z3: 42,  z4: 49,  z5: 75,  z6: 58 },
  { weight: 1500,  z1: 42,  z2: 53,  z3: 53,  z4: 64,  z5: 103, z6: 78 },
  { weight: 2000,  z1: 50,  z2: 64,  z3: 64,  z4: 79,  z5: 131, z6: 98 },
  { weight: 2500,  z1: 58,  z2: 75,  z3: 75,  z4: 94,  z5: 159, z6: 118 },
  { weight: 3000,  z1: 66,  z2: 86,  z3: 86,  z4: 109, z5: 187, z6: 138 },
  { weight: 3500,  z1: 74,  z2: 97,  z3: 97,  z4: 124, z5: 215, z6: 158 },
  { weight: 4000,  z1: 82,  z2: 108, z3: 108, z4: 139, z5: 243, z6: 178 },
  { weight: 4500,  z1: 90,  z2: 119, z3: 119, z4: 154, z5: 271, z6: 198 },
  { weight: 5000,  z1: 98,  z2: 130, z3: 130, z4: 169, z5: 299, z6: 218 },
  { weight: 6000,  z1: 110, z2: 148, z3: 148, z4: 195, z5: 343, z6: 256 },
  { weight: 7000,  z1: 122, z2: 166, z3: 166, z4: 221, z5: 387, z6: 294 },
  { weight: 8000,  z1: 134, z2: 184, z3: 184, z4: 247, z5: 431, z6: 332 },
  { weight: 9000,  z1: 146, z2: 202, z3: 202, z4: 273, z5: 475, z6: 370 },
  { weight: 10000, z1: 158, z2: 220, z3: 220, z4: 299, z5: 519, z6: 408 },
  { weight: 11000, z1: 170, z2: 238, z3: 238, z4: 325, z5: 563, z6: 446 },
  { weight: 12000, z1: 182, z2: 256, z3: 256, z4: 351, z5: 607, z6: 484 },
  { weight: 13000, z1: 194, z2: 274, z3: 274, z4: 377, z5: 651, z6: 522 },
  { weight: 14000, z1: 206, z2: 292, z3: 292, z4: 403, z5: 695, z6: 560 },
  { weight: 15000, z1: 218, z2: 310, z3: 310, z4: 429, z5: 739, z6: 598 },
  { weight: 16000, z1: 230, z2: 328, z3: 328, z4: 455, z5: 783, z6: 636 },
  { weight: 17000, z1: 242, z2: 346, z3: 346, z4: 481, z5: 827, z6: 674 },
  { weight: 18000, z1: 254, z2: 364, z3: 364, z4: 507, z5: 871, z6: 712 },
  { weight: 19000, z1: 266, z2: 382, z3: 382, z4: 533, z5: 915, z6: 750 },
  { weight: 20000, z1: 278, z2: 400, z3: 400, z4: 559, z5: 959, z6: 788 },
];

const AIR: Slab[] = [
  { weight: 500,   z1: 28,  z2: 33,  z3: 33,  z4: 49,   z5: 68,   z6: 54 },
  { weight: 750,   z1: 36,  z2: 44,  z3: 44,  z4: 83,   z5: 111,  z6: 89 },
  { weight: 1000,  z1: 36,  z2: 44,  z3: 44,  z4: 83,   z5: 111,  z6: 89 },
  { weight: 1500,  z1: 44,  z2: 56,  z3: 56,  z4: 116,  z5: 155,  z6: 123 },
  { weight: 2000,  z1: 53,  z2: 68,  z3: 68,  z4: 150,  z5: 198,  z6: 157 },
  { weight: 2500,  z1: 61,  z2: 79,  z3: 79,  z4: 184,  z5: 241,  z6: 191 },
  { weight: 3000,  z1: 70,  z2: 91,  z3: 91,  z4: 218,  z5: 285,  z6: 225 },
  { weight: 3500,  z1: 78,  z2: 103, z3: 103, z4: 252,  z5: 328,  z6: 260 },
  { weight: 4000,  z1: 87,  z2: 114, z3: 114, z4: 286,  z5: 372,  z6: 294 },
  { weight: 4500,  z1: 95,  z2: 126, z3: 126, z4: 320,  z5: 415,  z6: 328 },
  { weight: 5000,  z1: 104, z2: 138, z3: 138, z4: 354,  z5: 458,  z6: 362 },
  { weight: 6000,  z1: 116, z2: 157, z3: 157, z4: 416,  z5: 539,  z6: 431 },
  { weight: 7000,  z1: 129, z2: 176, z3: 176, z4: 479,  z5: 619,  z6: 499 },
  { weight: 8000,  z1: 142, z2: 195, z3: 195, z4: 541,  z5: 700,  z6: 567 },
  { weight: 9000,  z1: 155, z2: 214, z3: 214, z4: 604,  z5: 780,  z6: 636 },
  { weight: 10000, z1: 167, z2: 233, z3: 233, z4: 666,  z5: 861,  z6: 704 },
  { weight: 11000, z1: 180, z2: 252, z3: 252, z4: 728,  z5: 941,  z6: 773 },
  { weight: 12000, z1: 193, z2: 271, z3: 271, z4: 791,  z5: 1022, z6: 841 },
  { weight: 13000, z1: 205, z2: 290, z3: 290, z4: 853,  z5: 1102, z6: 909 },
  { weight: 14000, z1: 218, z2: 309, z3: 309, z4: 916,  z5: 1183, z6: 978 },
  { weight: 15000, z1: 231, z2: 328, z3: 328, z4: 978,  z5: 1263, z6: 1046 },
  { weight: 16000, z1: 244, z2: 347, z3: 347, z4: 1041, z5: 1344, z6: 1115 },
  { weight: 17000, z1: 256, z2: 366, z3: 366, z4: 1103, z5: 1424, z6: 1183 },
  { weight: 18000, z1: 269, z2: 385, z3: 385, z4: 1166, z5: 1505, z6: 1251 },
  { weight: 19000, z1: 282, z2: 404, z3: 404, z4: 1228, z5: 1585, z6: 1320 },
  { weight: 20000, z1: 294, z2: 424, z3: 424, z4: 1291, z5: 1666, z6: 1388 },
];

const VOLUMETRIC_DIVISOR = 5000; // cm³/kg

// Metro cities for zone-4 derivation (Metro-to-Metro).
const METRO_CITIES = new Set([
  "delhi", "new delhi", "mumbai", "navi mumbai", "thane",
  "bangalore", "bengaluru", "chennai", "kolkata", "hyderabad",
  "pune", "ahmedabad",
]);

// North-East / J&K / Kerala / A&N (zone-5 per the rate card).
const Z5_STATES = new Set([
  "assam", "arunachal pradesh", "manipur", "meghalaya", "mizoram",
  "nagaland", "tripura", "sikkim",
  "jammu and kashmir", "ladakh",
  "kerala",
  "andaman and nicobar islands", "andaman & nicobar islands", "andaman and nicobar",
]);

export function detectZone(
  pickupCity: string, pickupState: string,
  deliveryCity: string, deliveryState: string,
): XbZone {
  const pCity = (pickupCity || "").trim().toLowerCase();
  const dCity = (deliveryCity || "").trim().toLowerCase();
  const pState = (pickupState || "").trim().toLowerCase();
  const dState = (deliveryState || "").trim().toLowerCase();

  // z5 — Special (NE / J&K / Kerala / A&N) on either end overrides everything
  if (Z5_STATES.has(pState) || Z5_STATES.has(dState)) return "z5";
  // z1 — Within City (same city)
  if (pCity && dCity && pCity === dCity) return "z1";
  // z4 — Metro to Metro (different metros)
  if (METRO_CITIES.has(pCity) && METRO_CITIES.has(dCity)) return "z4";
  // z2 — Within State
  if (pState && dState && pState === dState) return "z2";
  // z3 — Regional (neighbouring states – best-effort; fall through to z6 otherwise)
  if (pState && dState && isRegional(pState, dState)) return "z3";
  // z6 — Rest of India
  return "z6";
}

// Rough "regional" adjacency. XpressBees doesn't publish a public list — these
// pairings are based on common North/South/East/West clusters. Used only when
// neither metro-to-metro nor same-state applies; otherwise z6.
const REGIONAL_CLUSTERS: string[][] = [
  // North
  ["delhi", "haryana", "punjab", "uttar pradesh", "uttarakhand", "himachal pradesh", "rajasthan", "chandigarh"],
  // West
  ["maharashtra", "gujarat", "goa", "madhya pradesh", "dadra and nagar haveli", "daman and diu"],
  // South
  ["karnataka", "tamil nadu", "andhra pradesh", "telangana", "puducherry"],
  // East / Central
  ["west bengal", "odisha", "jharkhand", "bihar", "chhattisgarh"],
];

function isRegional(a: string, b: string): boolean {
  for (const cluster of REGIONAL_CLUSTERS) {
    if (cluster.includes(a) && cluster.includes(b)) return true;
  }
  return false;
}

function getSlab(table: Slab[], grams: number): Slab {
  // Round up to the next slab; cap at the heaviest slab's price (over 20kg
  // would normally need surface freight tier — we cap and let the frontend
  // handle very heavy shipments separately).
  const w = Math.max(500, Math.ceil(grams));
  for (const s of table) {
    if (w <= s.weight) return s;
  }
  return table[table.length - 1];
}

export interface QuoteInput {
  zone: XbZone;
  mode: XbMode;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface QuoteResult {
  price: number;
  chargeableWeightKg: number;
  volumetricWeightKg: number;
  slabWeightG: number;
  zone: XbZone;
  mode: XbMode;
}

export function quote(input: QuoteInput): QuoteResult {
  const { zone, mode } = input;
  const l = Math.max(1, Number(input.lengthCm) || 10);
  const w = Math.max(1, Number(input.widthCm) || 10);
  const h = Math.max(1, Number(input.heightCm) || 10);
  const volKg = (l * w * h) / VOLUMETRIC_DIVISOR;
  const actualKg = Math.max(0.1, Number(input.weightKg) || 0.5);
  const chargeableKg = Math.max(actualKg, volKg);
  const grams = chargeableKg * 1000;

  const table = mode === "air" ? AIR : SURFACE;
  const slab = getSlab(table, grams);
  const price = (slab as any)[zone] as number;

  return {
    price: Math.round(price),
    chargeableWeightKg: Number(chargeableKg.toFixed(3)),
    volumetricWeightKg: Number(volKg.toFixed(3)),
    slabWeightG: slab.weight,
    zone,
    mode,
  };
}

// TAT estimates per zone & mode (working days). Conservative, normalized.
export function tatDays(zone: XbZone, mode: XbMode): { days: number; label: string } {
  const isAir = mode === "air";
  switch (zone) {
    case "z1": return isAir ? { days: 1, label: "Same/Next Day" } : { days: 1, label: "Next Day" };
    case "z2": return isAir ? { days: 1, label: "1-2 Days" } : { days: 2, label: "2-3 Days" };
    case "z3": return isAir ? { days: 2, label: "2-3 Days" } : { days: 3, label: "3-4 Days" };
    case "z4": return isAir ? { days: 2, label: "1-2 Days" } : { days: 3, label: "3-5 Days" };
    case "z5": return isAir ? { days: 3, label: "3-5 Days" } : { days: 5, label: "5-7 Days" };
    case "z6": return isAir ? { days: 3, label: "2-4 Days" } : { days: 4, label: "4-6 Days" };
  }
}

export function zoneLabel(zone: XbZone): string {
  switch (zone) {
    case "z1": return "Within City";
    case "z2": return "Within State";
    case "z3": return "Regional";
    case "z4": return "Metro to Metro";
    case "z5": return "Special (NE/J&K/KL/AN)";
    case "z6": return "Rest of India";
  }
}
