// Deterministic platform-fee endpoint.
//
// Pricing model (single source of truth, mirrored in src/lib/pricing.ts):
//   baseFare = round(cardPrice * 3) + 50
//   platformFee = baseFare - cardPrice
//
// This endpoint is kept for backwards compatibility with `usePlatformFee`. It no
// longer calls any AI service — the markup + ₹50 flat zone fee is applied
// uniformly across all 5 courier partners. Callers that have the courier card
// price should compute the fee directly via computeBaseFare(cardPrice) - cardPrice.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MARKUP_PCT = 0.5;
const ZONE_FEE = 50;
const REPRESENTATIVE_CARD_PRICE = 100; // legacy fallback for callers without a card price

interface PlatformFeeRequest {
  source_pincode: string;
  destination_pincode: string;
  weight_kg?: number;
  shipment_value?: number;
  card_price?: number; // optional: when provided, fee is exact
}

function computeBaseFare(card: number): number {
  return Math.round((Number(card) || 0) * (1 + MARKUP_PCT)) + ZONE_FEE;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as PlatformFeeRequest;
    const { source_pincode, destination_pincode, card_price } = body;

    if (!source_pincode || !destination_pincode) {
      return new Response(
        JSON.stringify({ error: 'source_pincode and destination_pincode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const card = Number.isFinite(Number(card_price)) && Number(card_price) > 0
      ? Number(card_price)
      : REPRESENTATIVE_CARD_PRICE;

    const baseFare = computeBaseFare(card);
    const platformFee = Math.max(0, baseFare - card);

    return new Response(
      JSON.stringify({
        platform_fee: platformFee,
        distance_km: 0,
        distance_tier: 'Flat',
        breakdown: {
          base_fee: ZONE_FEE,
          distance_fee: 0,
          weight_surcharge: 0,
          markup_pct: MARKUP_PCT,
          zone_fee: ZONE_FEE,
          card_price_used: card,
        },
        explanation: `Flat ${MARKUP_PCT * 100}% markup + ₹${ZONE_FEE} zone fee on courier card price`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error('Error in calculate-platform-fee:', error);
    return new Response(
      JSON.stringify({ error: String(error?.message || error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
