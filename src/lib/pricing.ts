// Single source of truth for ViaSetu pricing math.
// Formula: baseFare = round(cardPrice * 3) + 50 ; gst = 18% of baseFare.
// "Platform fee" is hidden inside Base Fare and is derived as baseFare - cardPrice.

export const MARKUP_PCT = 2.0;   // 200% markup on courier card price (i.e., 3x total)
export const ZONE_FEE = 50;      // flat ₹50 zone fee
export const GST_RATE = 0.18;

export function computeBaseFare(cardPrice: number): number {
  const card = Number(cardPrice) || 0;
  return Math.round(card * (1 + MARKUP_PCT)) + ZONE_FEE;
}

export function computeGst(baseFare: number): number {
  return Math.round((Number(baseFare) || 0) * GST_RATE);
}

export function computeTotal(cardPrice: number): number {
  const base = computeBaseFare(cardPrice);
  return base + computeGst(base);
}

export interface PriceBreakdown {
  cardPrice: number;
  baseFare: number;
  platformFee: number; // baseFare - cardPrice (hidden inside baseFare in UI)
  gst: number;
  total: number;
  markupPct: number;
  zoneFee: number;
}

export function computePriceBreakdown(cardPrice: number): PriceBreakdown {
  const card = Number(cardPrice) || 0;
  const baseFare = computeBaseFare(card);
  const gst = computeGst(baseFare);
  return {
    cardPrice: card,
    baseFare,
    platformFee: baseFare - card,
    gst,
    total: baseFare + gst,
    markupPct: MARKUP_PCT,
    zoneFee: ZONE_FEE,
  };
}

// ─── Chargeable weight (dead vs volumetric) ───────────────────────────
// All Indian express partners (Delhivery, XpressBees, Shadowfax, UrbaneBolt,
// Shree Maruti) bill on max(dead, volumetric) using a 5000 divisor. We round
// the final chargeable weight UP to the next 0.5 kg slab so we never quote
// below what the partner will actually invoice us.
export const VOLUMETRIC_DIVISOR = 5000;
export const WEIGHT_SLAB_KG = 0.5;

export function computeVolumetricKg(
  lengthCm: number | string,
  widthCm: number | string,
  heightCm: number | string,
): number {
  const l = Number(lengthCm) || 0;
  const w = Number(widthCm) || 0;
  const h = Number(heightCm) || 0;
  if (l <= 0 || w <= 0 || h <= 0) return 0;
  return (l * w * h) / VOLUMETRIC_DIVISOR;
}

export interface ChargeableWeight {
  deadKg: number;
  volumetricKg: number;
  chargeableKg: number; // rounded up to next 0.5 kg slab
}

export function computeChargeableKg(
  deadKg: number,
  lengthCm: number | string,
  widthCm: number | string,
  heightCm: number | string,
  opts?: { isDocument?: boolean },
): ChargeableWeight {
  const dead = Math.max(0, Number(deadKg) || 0);
  // Documents/envelopes: no dimensions, chargeable == dead (typically 0.25 kg).
  if (opts?.isDocument) {
    return { deadKg: dead, volumetricKg: 0, chargeableKg: dead };
  }
  const vol = computeVolumetricKg(lengthCm, widthCm, heightCm);
  const raw = Math.max(dead, vol);
  // Round UP to next WEIGHT_SLAB_KG (0.5 kg).
  const chargeable = raw <= 0
    ? 0
    : Math.ceil(raw / WEIGHT_SLAB_KG) * WEIGHT_SLAB_KG;
  return { deadKg: dead, volumetricKg: vol, chargeableKg: chargeable };
}

