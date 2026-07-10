## Goal
In the admin **Assisted Booking** flow (Step 5 – courier selection), show the raw partner-quoted price alongside the customer-facing marked-up price, so the agent can see both numbers at a glance. Regular (customer) bookings stay unchanged.

## Detection
`Booking.tsx` already tracks an `assistedContext` state that is truthy only when an admin is booking on behalf of a customer. This flag is the trigger for showing the extra column/line.

## Changes

**1. `src/pages/Booking.tsx`**
- Pass a new `isAssisted={!!assistedContext}` prop into `BookingStep5` where it's rendered.

**2. `src/components/booking/BookingStep5.tsx`**
- Accept `isAssisted` and forward it to `SmartRanking`, `ETACard`, and (if present) `PartnerComparisonTable`.

**3. `src/components/booking/ETACard.tsx`**
- Accept optional `isAssisted` prop.
- When true, render a small secondary line under the main price: `Partner: ₹<cardPrice>` (raw `courierData.rate.price.amount`, rounded), in muted text. Main price (marked-up via `computeBaseFare`) stays as-is.

**4. `src/components/booking/SmartRanking.tsx`**
- Accept optional `isAssisted` prop.
- In each ranked row, show the raw partner price under the marked-up price in muted small text (e.g. `Partner ₹X`). No math changes; only display.

**5. `src/components/booking/PartnerComparisonTable.tsx`**
- Accept optional `isAssisted` prop.
- When true, in the Price cell add a second line `Partner ₹<cardPrice>` in muted text below the marked-up chip.

## Non-goals / guardrails
- No changes to pricing math (`computeBaseFare`, GST, platform fee).
- No changes to customer flow UI, order payload, or Razorpay amounts.
- No DB / edge function changes.
- Purely presentational, gated on `isAssisted`.

## Verification
- Load `/admin/assisted-booking` → continue to step 5 → confirm both prices show.
- Load `/booking` as a normal user → confirm only the marked-up price shows (unchanged).
