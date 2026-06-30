# Plan: Update Platform Markup from 1.5× to 3×

## Goal
Change the ViaSetu pricing rule so Base Fare is calculated as `round(partner_rate × 3) + 50` instead of the current `round(partner_rate × 1.5) + 50`, while keeping the hidden-platform-fee model and reconciliation identity intact.

## Background
Current formula: `baseFare = round(cardPrice × 1.5) + 50`.
Platform fee remains hidden inside base fare as `baseFare − cardPrice`.
Partner payable is `baseFare − platformFee` (i.e., the original card price).

## New formula
- `baseFare = round(cardPrice × 3) + 50`
- `platformFee = baseFare − cardPrice`
- `gst = round(baseFare × 0.18)`
- `customerTotal = baseFare + gst + packaging + insurance`
- `partnerPayable = baseFare − platformFee = cardPrice`
- Identity check: `partnerPayable + platformFee + gst + packaging + insurance = customerTotal`

## Example (partner rate = ₹50)
- Base Fare = round(50 × 3) + 50 = ₹200
- Platform Fee = ₹150
- GST = ₹36
- Customer Total = ₹236
- Partner Payable = ₹50

## Files to change
1. `src/lib/pricing.ts` — update the multiplier constant from 1.5 to 3.
2. `supabase/functions/calculate-platform-fee/index.ts` — mirror the same change so the server-side edge function matches the client-side calculation.
3. Verify no other hardcoded `1.5` multiplier exists in booking/checkout flow (e.g., `src/lib/pricing.ts`, edge functions, admin dashboards, tests).

## Verification
- Run existing pricing tests if any; add/update the ₹50 example as a test case.
- Spot-check a live checkout flow to confirm the new customer total matches ₹236 for a ₹50 partner rate.
- Confirm the admin dashboard reconciliation identity still holds for new bookings.

## Notes
- This only changes the markup multiplier. It does not affect GST rate, payment flow, partner payout, or admin reporting logic.
- No new secrets or database schema changes are needed.