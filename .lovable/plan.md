
# Dead vs Volumetric Weight — Chargeable Weight Fix

## Goal
Stop under-charging customers when a parcel's volumetric weight exceeds its dead weight. Use **chargeable weight = ceil_to_500g(max(deadKg, volumetricKg))** as the single source of truth for all serviceability quotes, payments, partner bookings, and admin reporting.

Formula:
```
volumetricKg = (L_cm × B_cm × H_cm) / 5000
chargeableKg_raw = max(deadKg, volumetricKg)
chargeableKg = ceil(chargeableKg_raw × 2) / 2     // round up to next 0.5 kg
```

Documents/envelopes are exempt (fixed 250 g, no dimensions).

## Changes

### 1. `src/lib/pricing.ts` — shared math
Add constants and helpers:
- `VOLUMETRIC_DIVISOR = 5000`
- `WEIGHT_SLAB_KG = 0.5`
- `computeVolumetricKg(L, B, H)`
- `computeChargeableKg(deadKg, L, B, H, { isDocument })` — returns `{ deadKg, volumetricKg, chargeableKg }`

### 2. `src/components/booking/BookingStep2.tsx`
- After dimensions are entered (non-documents), live-compute and display a small breakdown card:
  ```
  Dead weight        300 g
  Volumetric weight  5,000 g   (50×50×20 ÷ 5000)
  Chargeable weight  5,000 g   ← used for pricing
  ```
- Extend existing weight disclaimer to also warn about dimension accuracy.
- In `handleContinue`, send `weight_kg: chargeableKg` (not deadKg) to every `*-serviceability` call.
- Pass the full weight triple up via a new prop `onWeightBreakdown({ deadG, volumetricG, chargeableG })` so the parent `Booking.tsx` can persist it.

### 3. `src/pages/Booking.tsx`
- Store `weightBreakdown` in booking state.
- Forward to `BookingReviewStep` and to the `save-booking`/partner-booking payloads.

### 4. `src/components/booking/BookingReviewStep.tsx`
- Show the same 3-row breakdown in the review summary, just above the price block, so the customer sees chargeable weight before paying.

### 5. Edge functions — partner booking payloads
For each of the 5 `*-booking` functions (`delhivery-booking`, `shadowfax-booking`, `xpressbees-booking`, `urbanebolt-booking`, `shree-maruti-booking`):
- Accept `chargeable_weight_kg` in the request body.
- Send chargeable weight (in kg or g per partner contract) as the shipment weight to the partner. Dimensions still forwarded as-is so partners that re-derive volumetric match our number.

`save-booking` persists the three weight fields on the row.

### 6. Database migration
Add to `bookings`:
- `dead_weight_g` integer
- `volumetric_weight_g` integer
- `chargeable_weight_g` integer

Backfill: leave NULL for historic rows (no data to derive).

### 7. Admin `OrderMonitoring.tsx`
In the order detail panel, render a "Weight breakdown" row:
```
Dead: 300 g · Volumetric: 5,000 g · Chargeable (billed): 5,000 g
```
Visible to all admin roles (helps support explain pricing disputes).

## Out of scope
- Recomputing/re-billing historic orders.
- Per-partner divisor variants (locked to 5000 for all).
- Auto-detecting dimension mismatch at pickup (partner-side; we already warn user).

## Technical notes

```text
Customer enters: dead=300g, dims=50×50×20cm
                              │
                              ▼
        computeChargeableKg() ──► dead=0.3 vol=5.0 → 5.0 → round→5.0kg
                              │
        ┌─────────────────────┼──────────────────────┐
        ▼                     ▼                      ▼
  Step2 UI display    Serviceability quote    Partner booking
                              │                      │
                              ▼                      ▼
                        Review + pay         DB: chargeable_weight_g
```

Rate-card lookups in `_shared/rate-cards.ts` already use weight slabs, so passing 5.0 kg instead of 0.3 kg picks the correct slab automatically — no rate-card changes needed.
