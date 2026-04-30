## Goal

Embed every partner rate card from `ViaSetu_1.xlsx` into the codebase and wire them in as:

1. **Verification** — compare live API price vs embedded card; if they diverge beyond a tolerance, log a warning and (configurably) use the card price.
2. **Fallback** — if a partner has no live rate API (or the live call fails / returns no price), serve the embedded card price so the user still sees a quote.

Today only Shadowfax & UrbaneBolt have embedded cards. Delhivery, Shree Maruti, and XpressBees rely entirely on live APIs and produce no quote when the API fails.

## What's in the sheet (verified)

- **Delhivery** — Surface Silver + Express Silver, Forward + RTO, slabs `0-250g / 250-500g / +500g till 5kg / Upto 5kg / +1kg till 10kg / Upto 10kg / +1kg`, zones A / B / C1 / C2 / D1 / D2 / E / F. Plus zone definitions (Local, ≤500km, Metro–Metro, etc.).
- **SMIL (Shree Maruti)** — "B2C Light Weight" Surface + Air, slabs `0-0.25 / 0-0.5 / Add 0.5 / Upto 1 / Upto 2 / Add 1 kg`, zones Local / Within Zone / Metro / ROI / Special. Hyperlocal card (5/10/15 km × 5/10/15 kg) also present.
- **UrbaneBolt** — Zonewise (A–E), slabs `500g / Add 500g`, FSC 15%, RVP same as forward. (Different shape from current embedded card — needs update.)
- **XpressBees** — Detailed Surface + Air weight ladder from 500g to 20kg, zones z1 (Within City) / z2 (Within State) / z3 (Regional) / z4 (Metro–Metro) / z5 (NE/J&K/KL/AN) / z6 (Rest of India), plus COD ₹25 / 1.3%.
- **Shadowfax** — Standard Express (Intracity / Within-Zone / Metro / ROI / Special) + SFX Prime (Intracity SDD/NDD / Zonal NDD / Intercity Air NDD). Already matches embedded card.

## Implementation

### 1. New shared module: `supabase/functions/_shared/rate-cards.ts`

Single source of truth for all 5 partners. Exports:

```ts
export type Partner = "delhivery" | "shree_maruti" | "urbanebolt" | "xpressbees" | "shadowfax";
export type ServiceMode = "surface" | "air" | "express" | "standard";

export interface CardQuote {
  partner: Partner;
  mode: ServiceMode;
  zone: string;          // partner-specific zone label
  chargeable_g: number;
  price: number;         // INR, pre-tax, pre-FSC
  fsc_percent: number;   // e.g. 0.15 for UB, 0.30 for SFX standard
  price_with_fsc: number;
  source: "embedded_card";
  card_version: "ViaSetu_1.xlsx";
}

export function quoteFromCard(
  partner: Partner,
  mode: ServiceMode,
  pickup: { pincode: string; city?: string; state?: string },
  delivery: { pincode: string; city?: string; state?: string },
  weight_kg: number,
  dims: { l: number; w: number; h: number },
): CardQuote | null;
```

Internals:

- One `RATE_CARD` constant per partner with the exact slab tables transcribed from the sheet.
- One `detectZone(partner, pickup, delivery)` per partner — already-correct zone logic for SFX/UB is reused; new mappings added for Delhivery zones (A–F), SMIL zones, and XpressBees zones (z1–z6) using `METRO_CITIES`, `SAME_STATE`, distance heuristics, and `SPECIAL_STATES`.
- One `pickPrice(card, chargeable_g)` per partner that walks the slab ladder.

### 2. New verification helper: `verifyAgainstCard(apiPrice, cardQuote, opts)`

```ts
export function verifyAgainstCard(apiPrice: number, card: CardQuote, tolerancePct = 0.20):
  { ok: boolean; deltaPct: number; chosen: "api" | "card"; reason?: string }
```

- Computes `|api - card| / card`.
- If within tolerance → `ok: true`, chosen = `"api"`.
- If outside → log a structured warning with both prices and partner/zone, chosen = `"api"` by default (configurable via env flag `RATE_CARD_OVERRIDE=true` to flip to `"card"`).
- Always echoes both prices in the partner `metadata` so the UI/admin can audit.

### 3. Wire into each serviceability function

For every partner serviceability edge function:

```text
1. Run live API as today.
2. Compute cardQuote = quoteFromCard(partner, mode, ...).
3. If API succeeded:
     verify = verifyAgainstCard(apiPrice, cardQuote)
     final.price = verify.chosen === "card" ? cardQuote.price_with_fsc : apiPrice
     metadata.rate_source = verify.chosen
     metadata.api_price = apiPrice
     metadata.card_price = cardQuote.price_with_fsc
     metadata.card_delta_pct = verify.deltaPct
   Else:
     final.price = cardQuote.price_with_fsc
     metadata.rate_source = "card_fallback"
4. If both API and card fail → return is_serviceable: false (today's behaviour).
```

Files touched:

- `supabase/functions/delhivery-serviceability/index.ts` (new card path; today returns "Rate quote unavailable" when API fails — this becomes a card fallback)
- `supabase/functions/shree-maruti-serviceability/index.ts` (add card verification + fallback)
- `supabase/functions/shree-maruti-rate/index.ts` (also fall back to card)
- `supabase/functions/xpressbees-serviceability/index.ts` (add card verification + fallback)
- `supabase/functions/urbanebolt-serviceability/index.ts` (replace inline card with shared module; current sheet uses Zone A–E + 500g slabs which differs slightly from current embedded "B2C Light Weight" — switch to the sheet's "UrbanEBolt" section)
- `supabase/functions/shadowfax-serviceability/index.ts` (move existing inline card into shared module; behaviour unchanged)

### 4. Surface in admin/booking metadata

Add `rate_source`, `api_price`, `card_price`, `card_delta_pct` to the partner `metadata` object that already flows into `SmartRanking.tsx`. No UI work is required for users — this is for admin auditability — but it will be visible in the existing partner debug panels.

### 5. UrbaneBolt rate card swap (data correction)

Current embedded UB card uses 0.25 / 0.5 / 1 / 2 kg slabs (older sheet). The new sheet specifies a simpler "500 g + Add 500 g" structure across Zone A–E with a flat 15% FSC. Replace with the new structure to match the contract. Old slabs are removed.

### 6. No DB or schema changes

All cards live in code. If the user later wants editable cards, we can move them to a `partner_rate_cards` table — out of scope here.

## Tolerance & override defaults

- Default tolerance: **20%** (logs but accepts API price).
- Hard cap: if API price is more than **2x** card price, force card price (anti-billing-spike guard).
- Both thresholds are constants in `rate-cards.ts` for easy tuning.

## Out of scope

- Hyperlocal SMIL rate card (separate flow, not used in current booking).
- COD/FSC/RTO/QC line items beyond the base price field already shown.
- Editable admin UI for rate cards.