## Problem

On the admin Revenue and Order Monitoring screens, the per-order split does not add up to the amount the customer paid.

Example — order `VIAS0000000017`:
- Stored: `courier_price=192`, `base_fare=163`, `platform_fee=88`, `gst=29`
- Shown: Total ₹192, Partner Payable ₹163, Platform Revenue ₹88 → 163+88+29 = 280 ≠ 192

## Root cause

The pricing model (`src/lib/pricing.ts`) is:

```
baseFare    = round(cardPrice * 1.5) + 50     ← markup is INSIDE baseFare
platformFee = baseFare - cardPrice            ← already embedded in baseFare
gst         = round(baseFare * 0.18)
total       = baseFare + gst                  ← stored as courier_price
```

So `base_fare` ≠ what we owe the courier. The amount actually payable to the partner is the **card price** = `base_fare − platform_fee`.

Both admin screens treat `base_fare` as Partner Payable, double-counting the ₹88 platform fee.

Correct split for VIAS0000000017: Partner ₹75 + Platform ₹88 + GST ₹29 = ₹192 ✓

## Fix

Change the `partnerPayable` derivation in two places to subtract `platform_fee` from `base_fare`:

1. **`src/pages/admin/RevenueManagement.tsx`** — `breakdownOf()` (around line 35-47)
   - New: `partnerPayable = max(0, base_fare - platform_fee)` when `base_fare > 0`
   - Fallback (no `base_fare` stored): `total - platform_fee - gst - packaging - insurance` (unchanged)
   - This automatically corrects: Stats cards (Amount Payable to Partners), Transactions table, Price Breakdown tab, Monthly Reports, Analytics tab, and CSV export.

2. **`src/pages/admin/OrderMonitoring.tsx`** — `calculatePriceBreakdown()` (around line 191-212)
   - Same correction. Rename `baseFare` → `partnerPayable` in the returned object and update the two display labels at lines ~660-664 to read from `partnerPayable`.

3. **Sanity assertion** — add a small console.warn in `breakdownOf` when `|partnerPayable + platformRevenue + gst + packaging + insurance − total| > 1` so any future pricing drift is visible to admins in devtools.

## Out of scope

- No DB migration. Stored columns are correct; only the admin presentation layer is wrong.
- Razorpay reconciliation page (`Reconciliation.tsx`) is unaffected — it compares Razorpay-captured amount vs `courier_price`, both of which are already the gross total.
- Customer-facing pricing (`pricing.ts`, booking review, invoice) is correct and unchanged.

## Validation

After the fix, for every booking in the table the invariant must hold (±₹1 rounding):
```
partnerPayable + platformRevenue + gst + packaging + insurance == courier_price
```
Spot-check: VIAS0000000017 → 75 + 88 + 29 = 192 ✓; VIAS0000000014 → 72 + 120 + 35 = 227 ✓.
