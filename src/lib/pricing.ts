// Single source of truth for ViaSetu pricing math.
// Formula: baseFare = round(cardPrice * 1.5) + 50 ; gst = 18% of baseFare.
// "Platform fee" is hidden inside Base Fare and is derived as baseFare - cardPrice.

export const MARKUP_PCT = 0.5;   // 50% markup on courier card price
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
