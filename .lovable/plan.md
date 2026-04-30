## Goal

Make Shree Maruti pricing rely **exclusively** on the embedded rate card from `ViaSetu_1.xlsx`. Stop calling Shree Maruti's `/fulfillment/rate-card/calculate-rate/ecomm` endpoint entirely. The serviceability check API is still used to confirm whether SURFACE / AIR is available for the pincode pair — only the price comes from the embedded card.

## Why

The user wants pricing parity with the contracted rate sheet, no surprises from live API quotes. Today the code calls the rate API, then verifies/falls back to the card. We're removing the API leg so the card is the single source of truth.

## Changes

### 1. `supabase/functions/shree-maruti-serviceability/index.ts`
- Remove the `getRate(...)` helper and the parallel rate-API calls.
- Keep `checkMode(...)` (SURFACE + AIR serviceability check) — that's still needed to know which modes the partner supports for the pincode pair.
- For each serviceable mode, build the price purely from `quoteFromCard("shree_maruti", ...)`.
- If the card returns `null` (zone couldn't be resolved or weight out of slab), mark that mode as not serviceable.
- `metadata.rate_source` is always `"card"`. Drop `api_price`, `card_delta_pct` (no comparison anymore). Keep `card_price`, `card_zone`, `chargeable_g` for audit.

### 2. `supabase/functions/shree-maruti-rate/index.ts`
- Stop calling `shreeMarutiFetch(... /calculate-rate/ecomm ...)` entirely.
- Compute the quote directly from `quoteFromCard(...)` using the existing `pinInfo()` lookup.
- Response shape stays backwards-compatible: `{ success, data: { totalAmount }, rate_source: "card", card_zone, final_price }`.
- If the card can't price the request (unknown zone / weight), return `400` with a clear message.

### 3. `supabase/functions/_shared/rate-cards.ts`
- No structural change. Quick audit pass on the SMIL "B2C Light Weight" slab table and zone resolver to make sure they exactly match the sheet (Local / Within Zone / Metro / ROI / Special; slabs `0-0.25 / 0-0.5 / Add 0.5 / Upto 1 / Upto 2 / Add 1 kg`). Fix any transcription error found.
- Add an exported `SHREE_MARUTI_CARD_VERSION` string for surfacing in metadata.

### 4. Other Shree Maruti edge functions
- Booking (`shree-maruti-booking`), label, tracking, cancel: unchanged. They don't call the rate API. Just confirm during implementation.

## Behaviour after the change

```text
Request → SMIL serviceability check (SURFACE, AIR in parallel)
        → for each serviceable mode:
              card = quoteFromCard("shree_maruti", mode, pickup, delivery, weight, dims)
              if card: emit service with price = card.price_with_fsc, rate_source="card"
              else:    skip mode
        → if no modes priced: is_serviceable=false
```

No live rate API call is made for Shree Maruti anywhere in the booking flow.

## Out of scope

- Other partners (Delhivery / XpressBees / UrbaneBolt / Shadowfax) keep their existing API + card verification logic.
- No UI changes; SmartRanking already reads from `metadata.rate_source`.
- No DB / schema changes.