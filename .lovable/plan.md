## Why chargeable weight is always ≥ 1000 g

There are two bugs that together force every Shree Maruti quote to land on the 1 kg slab regardless of what the user enters:

### Bug 1 — 1 kg floor in `chargeableGrams` (root cause)

`supabase/functions/_shared/rate-cards.ts` line 74:

```ts
const actual = Math.max(1, Number(weightKg) || 0) * 1000;
```

The `Math.max(1, …)` is applied to the **kg value before multiplying by 1000**. So any weight below 1 kg (250 g, 500 g, 750 g) gets clamped to `1` kg → 1000 g actual. This is what produces the `chargeable_g: 1000` you saw, and it affects all five partners that use this helper, not just Shree Maruti.

The intent was clearly "minimum 1 gram", not "minimum 1 kg". The floor should be applied **after** the conversion to grams.

### Bug 2 — Frontend fallback default is 1000 g

`src/components/booking/BookingStep2.tsx` lines 171-173:

```ts
const weightKg = weightUnit === 'g'
  ? (parseFloat(packageWeight) || 1000) / 1000   // ← falls back to 1000 g
  : parseFloat(packageWeight) || 1.0;
```

If the weight field is empty or non-numeric, it silently sends 1 kg to the edge function. Combined with Bug 1, the user has no way to get a sub-kg quote unless they enter a valid number AND the backend floor is removed.

The `isValid` check on line 149 already requires `packageWeight` to be truthy, but `parseFloat("")` → `NaN`, and the `|| 1000` swallows it silently. Better to send the parsed value (or 0) and let the backend reject invalid inputs explicitly.

## Fix

### 1. `supabase/functions/_shared/rate-cards.ts`

Replace the broken floor:

```ts
function chargeableGrams(weightKg: number, l: number, w: number, h: number): number {
  const actualG = Math.max(0, Number(weightKg) || 0) * 1000;
  const volG = ((Number(l) || 0) * (Number(w) || 0) * (Number(h) || 0)) / 5000 * 1000;
  return Math.max(1, Math.ceil(Math.max(actualG, volG)));  // 1 g minimum, applied to grams
}
```

Now a 250 g parcel with 10×10×10 cm box (vol = 200 g) correctly resolves to **chargeable_g = 250** → Shree Maruti Surface ROI 0–250 g slab = ₹44 (was ₹83).

### 2. `src/components/booking/BookingStep2.tsx`

Tighten the weight parse so an empty/invalid field doesn't silently become 1 kg:

```ts
const weightG = parseFloat(packageWeight);
if (!weightG || weightG <= 0) {
  toast({ title: "Invalid weight", description: "Enter package weight in grams.", variant: "destructive" });
  setIsCheckingServiceability(false);
  return;
}
const weightKg = weightG / 1000;
```

(Removes the `|| 1000` fallback. `weightUnit` branch is gone since the unit is locked to grams now.)

## Impact

- **Shree Maruti**: 0.25 / 0.5 / 0.75 kg parcels now hit their correct sub-kg slabs (₹44 / ₹48 / ₹83 for ROI Surface, etc.) instead of all rounding up to ₹83.
- **Delhivery, XpressBees, UrbaneBolt, Shadowfax**: same fix benefits all of them — light parcels (e.g. 250 g) will now hit their lowest slab (Delhivery ₹28 zone A, etc.) instead of being floored to 1 kg.
- **No schema or API change.** Volumetric weight calculation is unchanged.

## Out of scope

- The partner serviceability APIs themselves (Shree Maruti's `check-ecomm-order-serviceability`) still receive `weight_kg` as-is — they don't use it for slab pricing, only for serviceability, so no change needed there.
- Booking payload (`shree-maruti-booking`) already converts grams correctly via `Math.round(package_weight * 1000)`.
