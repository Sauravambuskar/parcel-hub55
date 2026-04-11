

## Plan: Clean up ETACard display

### Changes (single file: `src/components/booking/ETACard.tsx`)

1. **Remove COD and Insurance indicators** — Delete the conditional blocks that render "Insured" and "COD" badges in the info section.

2. **Round off all prices** — Ensure `totalPrice` uses `Math.round()` so the price badge always shows a whole number (e.g., ₹249 instead of ₹248.5).

### Technical details

In `ETACard.tsx`:
- Remove the `Shield` import and the two conditional `<span>` blocks for insurance and COD (lines ~120-130).
- Change `const totalPrice = courierData.price + platformFee;` to `const totalPrice = Math.round(courierData.price + platformFee);`.

