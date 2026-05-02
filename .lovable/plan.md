## Goal

Generate **ViaSetu_Pricing_Methodology.pdf** — a concise, professionally formatted PDF that documents how courier/delivery charges are calculated in the current build. Reflects actual code (deterministic markup model), not generic ride-hailing concepts.

## Table of Contents (tight, 1 page each unless noted)

1. **Executive Summary** — one paragraph + headline formula box
2. **Pricing Formula at a Glance** — canonical equation, constants table
3. **Component Breakdown** — Card Price · Markup · Zone Fee · GST · Hidden Platform Fee
4. **Weight & Package Size** — chargeable weight, volumetric divisor, slab logic
5. **Delivery Speed & Location** — Surface vs Air; pincode/zone classification
6. **Time, Surge & Discounts** — explicit "not implemented" statement, with rationale
7. **Real-Time Calculation Flow** — sequence diagram + step list
8. **Integrations** — Google Places, partner APIs, Razorpay, AI Gateway scope
9. **Edge Cases** — unserviceable, API failure, COD, cancellation/refund
10. **Worked Examples** — 3 lanes × 2 weights × 5 couriers
11. **Appendix** — constants, file references, version stamp

## Source of Truth (from codebase)

- `src/lib/pricing.ts` — `baseFare = round(cardPrice × 1.5) + 50`; `gst = round(baseFare × 0.18)`; total = base + GST. Hidden platform fee = `baseFare − cardPrice`.
- `supabase/functions/calculate-platform-fee/index.ts` — deterministic, no AI.
- `supabase/functions/_shared/rate-cards.ts` — embedded ViaSetu_1.xlsx cards; chargeable weight = `max(actual_g, L×W×H/5000 × 1000)`; FSC per partner.
- Per-partner `*-rate` / `*-serviceability` edge functions for card prices.
- `predict-eta/index.ts` — adjusts ETA only (weekends/holidays/weight); no price impact.
- Razorpay edge functions charge exactly the displayed total.

## Key Editorial Decisions (kept short)

- Sections that don't apply to current build (peak/off-peak, surge, coupons, dynamic AI pricing) get a single short subsection each saying *"Not implemented in current version"* with a one-line reason — instead of being omitted, so the reader's checklist is fully addressed.
- Each section ≤ ~250 words; tables preferred over prose where possible.
- One ASCII sequence diagram in §7.

## Implementation

- Python `reportlab` Platypus.
- Register DejaVuSans so `₹` renders correctly (avoid the "INR" workaround used previously).
- Brand: cyan header bars (`#06B6D4`), black text, light grid tables.
- Output → `/mnt/documents/ViaSetu_Pricing_Methodology.pdf`.
- Mandatory QA: `pdftoppm -jpeg -r 150` → inspect every page → fix clipping/overlap/missing glyphs → re-render until clean.
- Emit `<lov-artifact>` tag on completion.

## Out of Scope

- No code changes.
- No new pricing features — doc reflects current behavior only.
