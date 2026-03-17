

# Fix: Weight Display on Order Details Page

## Problem
When a user enters 6 kg as the package weight, the Order Details page shows it as "6 g" or "0.6 g" because:
1. The weight unit label is hardcoded as **"g" (grams)** on the Order Details page, when the API stores weight in **kilograms**.
2. The `weightUnit` toggle (kg/g) in BookingStep2 is local state and never passed up to the parent `Booking.tsx`, so conversion context is lost.

## Root Cause
- `src/pages/OrderDetails.tsx` lines 279, 280, 522, 531 all display weight with `"g"` suffix
- The Prayog API and the booking payload both use **kg** as the unit (see `Booking.tsx` line 498: `parseFloat(packageWeight) || 1` and BookingStep2 converts grams to kg before API calls)

## Changes

### 1. OrderDetails.tsx - Fix weight unit display
- Change all weight display labels from `"g"` to `"kg"` (4 places):
  - Line 279: `physicalWeight` in invoice → change to "kg"
  - Line 280: `volumetricWeight` in invoice → change to "kg"  
  - Line 522: `physicalWeight` in UI card → change to "kg"
  - Line 531: `volumetricWeight` in UI card → change to "kg"

### 2. Booking.tsx - Ensure weight is always stored in kg
- Pass `weightUnit` state up from BookingStep2 to Booking.tsx
- When building the API payload, convert the raw `packageWeight` to kg if the user selected grams: `weightUnit === 'g' ? parseFloat(packageWeight) / 1000 : parseFloat(packageWeight)`
- Store the kg-converted value in the Supabase `package_weight` field as well

### 3. BookingStep2.tsx - Propagate weight unit to parent
- Add `onWeightUnitChange` callback prop (or include unit in existing `onInputChange`)
- Call it whenever the user toggles between kg and g

### Technical Summary
- **Files to modify**: `src/pages/OrderDetails.tsx`, `src/pages/Booking.tsx`, `src/components/booking/BookingStep2.tsx`
- The fix ensures weight is consistently stored and displayed in kg throughout the app
