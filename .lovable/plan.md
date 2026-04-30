## Goal

Replace the current non-deterministic AI-driven platform fee with a deterministic formula applied per-courier:

```
baseFare  = round(cardPrice * 1.5) + 50
gst       = round(baseFare * 0.18)
total     = baseFare + gst
```

The courier-specific card price is preserved (so XpressBees stays cheaper than Delhivery Air, etc.). The flat ₹50 zone fee + 50% markup is applied uniformly across all 5 partners (Shree Maruti, Delhivery, XpressBees, UrbaneBolt, Shadowfax) and all services (Surface/Air).

## Changes

### 1. New shared helper — `src/lib/pricing.ts`

Create a single source of truth used by every UI surface that displays a price:

```ts
export const MARKUP_PCT = 0.5;     // 50%
export const ZONE_FEE   = 50;      // flat ₹50
export const GST_RATE   = 0.18;

export function computeBaseFare(cardPrice: number) {
  return Math.round((cardPrice || 0) * (1 + MARKUP_PCT)) + ZONE_FEE;
}
export function computeGst(baseFare: number)   { return Math.round(baseFare * GST_RATE); }
export function computeTotal(cardPrice: number) {
  const base = computeBaseFare(cardPrice);
  return base + computeGst(base);
}
export function computePriceBreakdown(cardPrice: number) {
  const base = computeBaseFare(cardPrice);
  const gst  = computeGst(base);
  return { cardPrice, baseFare: base, gst, total: base + gst, markupPct: MARKUP_PCT, zoneFee: ZONE_FEE };
}
```

### 2. Frontend — replace `(cardPrice + platformFee)` usages

Files to update:

- `src/pages/Booking.tsx` — drop `usePlatformFee` hook usage for the listing/total math. Keep `platformFee` variable available for legacy props but derive it per-selected-service via `computeBaseFare(cardPrice) - cardPrice`. Update every spot where `baseFare`, `platform_fee`, `gst`, `total` are computed for the selected service to use the new helpers (lines ~219, 391, 547, 699, 767, 836, 905, 974, 1053, 1107, 1149, 1240).
- `src/components/booking/BookingStep5.tsx` — replace `(price + platformFee)` mapping (line 104, 226) with `computeBaseFare(price)` and pass full breakdown to children.
- `src/components/booking/SmartRanking.tsx` — replace 5 occurrences of `+ platformFee` with `computeBaseFare(...)`.
- `src/components/booking/PartnerComparisonTable.tsx` — replace `+ platformFee` mapping with `computeBaseFare(...)`.
- `src/components/booking/ETACard.tsx` — replace `courierData.price + platformFee` with `computeBaseFare(courierData.price)` for the displayed total. Show breakdown tooltip if already wired.
- `src/components/booking/BookingStep2.tsx` line 338 — replace hardcoded `const platformFee = 50; basePrice = apiPrice + platformFee;` with `basePrice = computeBaseFare(apiPrice)`.
- `src/components/booking/BookingReviewStep.tsx` — ensure base/GST display uses helper (verify on edit).

### 3. Backend — deterministic platform-fee endpoint

`supabase/functions/calculate-platform-fee/index.ts`:

- Remove the AI (Lovable Gateway) call entirely.
- Replace with a pure deterministic computation. Since the new model is markup-on-card-price (not per-shipment), this endpoint becomes a thin compatibility wrapper that returns a representative platform fee for legacy callers:
  ```
  representative_card_price = 100  // fallback; real callers should use the helper
  platform_fee = computeBaseFare(card) - card  // = 100
  ```
  Return shape kept identical so `usePlatformFee` consumers don't break, but `breakdown.distance_fee` is removed and `explanation` becomes `"Flat 50% markup + ₹50 zone fee per courier card price"`.

### 4. Persisted price metadata (orders / Razorpay)

In `src/pages/Booking.tsx` order-creation paths and edge functions that snapshot pricing:

- `supabase/functions/razorpay-create-order/index.ts`
- `supabase/functions/razorpay-verify-payment/index.ts`
- `supabase/functions/save-booking/index.ts`
- `supabase/functions/get-booking-detail/index.ts` (display only)

Make sure `base_fare`, `platform_fee` (now derived as `baseFare - cardPrice`), `gst`, `total` are stored using the new formula. No DB schema change — fields already exist in `bookings.price_breakdown` JSON.

### 5. Admin views (display only)

`src/pages/admin/RevenueManagement.tsx`, `OrderMonitoring.tsx`, `AdminDashboard.tsx`, `OrderDetails.tsx` already read `platform_fee` from stored `price_breakdown`. No code change needed — they will simply display the new (deterministic) values for new orders. Old orders keep their historical numbers.

## Worked Example (Pune → Bhopal, 1 kg)

| Courier            | Card | Base = round(card×1.5)+50 | GST 18% | **Total** |
| ------------------ | ---- | ------------------------- | ------- | --------- |
| Shree Maruti Surf  | ₹83  | ₹175                      | ₹32     | **₹207**  |
| Shree Maruti Air   | ₹102 | ₹203                      | ₹37     | **₹240**  |
| Delhivery Air      | ₹110 | ₹215                      | ₹39     | **₹254**  |
| XpressBees Surf    | ₹78  | ₹167                      | ₹30     | **₹197**  |
| Shadowfax          | ₹95  | ₹193                      | ₹35     | **₹228**  |

Deterministic: same input always yields the same number. Per-courier differentiation preserved.

## Out of Scope

- Distance-tiered zone fees (can revisit later by replacing `ZONE_FEE` constant with a `getZoneFee(km)` lookup).
- Changes to courier rate cards in `supabase/functions/_shared/rate-cards.ts`.
- Refund / cancellation logic — they read from stored `price_breakdown`, so they auto-adapt.

## Test Checklist (post-implementation)

1. Pune (411001) → Bhopal (462013), 1 kg → all 5 couriers display deterministic totals matching the table above.
2. Same pincode pair, 5 kg → totals scale with card price; markup math holds.
3. Local lane (411001 → 411014) → cheaper card → cheaper total, still markup + ₹50.
4. Razorpay charged amount === `total` shown on review screen.
5. Admin OrderMonitoring shows `platform_fee = baseFare − cardPrice` for new orders.
