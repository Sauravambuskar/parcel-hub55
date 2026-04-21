

# Delhivery Direct — Phase 1 (Reverse Pickup, Correct Direction)

Clarification baked in: **Reverse Pickup (RVP) means the package travels FROM the end-customer TO the seller/business.** In our app:
- "Sender" (Step-3 sender block) = end-customer where the courier picks up the package = **physical origin**
- "Receiver" (Step-3 receiver block) = seller/business where the package is delivered = **physical destination**

This matches `shadowfax-booking/index.ts` (lines 56-72): `customer_*` (Shadowfax's pickup point) is mapped from our `sender_*`, and `seller_*` (Shadowfax's delivery point) is mapped from our `receiver_*`. We'll do the exact same mapping for Delhivery.

The previous plan flipped origin/destination on the rate call, which would have priced the wrong leg. Correcting that here.

## Phase 1 Scope

In: serviceability check + live rate quote (Express + Surface) so Delhivery shows up in Step 2 partner comparison.
Out (Phase 2): booking, tracking, cancel.

**Visibility**: Hidden behind `DELHIVERY_DIRECT_ENABLED = false` flag in Phase 1. Function ships and is testable via curl. Flip in Phase 2 with booking.

## Required Secrets (you'll add before deploy)

| Secret | Source |
|---|---|
| `DELHIVERY_STAGING_TOKEN` | Delhivery One staging API key |
| `DELHIVERY_PROD_TOKEN` | Delhivery One production API key |

Warehouse name not needed in Phase 1.

## Reverse Pickup — Correct Direction

The package physically moves **sender → receiver** (customer → seller). Delhivery's rate API parameters:

```text
o_pin = sender_pincode    (origin = physical pickup = end-customer)
d_pin = receiver_pincode  (destination = physical delivery = seller/business)
ss    = Delivered
md    = E (Express) or S (Surface)
cgm   = chargeable weight in grams
pt    = Pre-paid
rt    = R                 ← reverse-pickup flag (tells Delhivery this is RVP, not forward)
```

The `rt=R` flag tells Delhivery the **shipment type** is reverse (so it's billed/handled as RVP), but origin/destination still describe the actual physical movement. Same convention will apply in Phase 2's `/api/cmu/create.json` payload.

## Architecture

```text
BookingStep2 (parallel fan-out)
 ├─ Prayog /serviceability/v3/check
 ├─ shadowfax-serviceability   (RVP, customer→seller)
 └─ delhivery-serviceability   ← NEW (RVP, sender→receiver)
       ├─ GET /c/api/pin-codes/json/?filter_codes={sender},{receiver}
       │     → both must return pre_paid: "Y"
       └─ Parallel:
           GET /api/kinko/v1/invoice/charges/.json?md=E&rt=R&o_pin={sender}&d_pin={receiver}&...
           GET /api/kinko/v1/invoice/charges/.json?md=S&rt=R&o_pin={sender}&d_pin={receiver}&...
```

## Edge Function: `delhivery-serviceability/index.ts`

Input (matches `shadowfax-serviceability` shape — `pickup_pincode` is the sender, `delivery_pincode` is the receiver):
```text
{ pickup_pincode, delivery_pincode, weight_kg, length_cm, width_cm, height_cm }
```

Logic:
1. Read `x-environment` header → pick token + base URL via `_shared/environment.ts` (extend with `DELHIVERY_CONFIG` + `getDelhiveryConfig()`).
2. **Pincode check**: `GET /c/api/pin-codes/json/?filter_codes={pickup_pincode},{delivery_pincode}`. Both must return `pre_paid: "Y"`. Either fails → `{ is_serviceable: false }`.
3. **Chargeable weight** = `max(weight_kg * 1000, (L * W * H) / 5000 * 1000)` grams.
4. **Two parallel rate calls** (correct direction):
   - `o_pin = pickup_pincode` (sender), `d_pin = delivery_pincode` (receiver), `rt=R`, `pt=Pre-paid`, `ss=Delivered`, `cgm={weight}`, `md=E` (Express)
   - Same again with `md=S` (Surface)
5. Normalize to existing partner shape:
   ```text
   partner_id: "delhivery_direct"
   partner_code: "delhivery"
   partner_name: "Delhivery"
   services: [
     { service_code: "delhivery_express", tat_days: 2,
       rate: { price: { amount: <total_amount>, currency: "INR" } } },
     { service_code: "delhivery_surface", tat_days: 4,
       rate: { price: { amount: <total_amount>, currency: "INR" } } }
   ]
   ```
   `total_amount` from Delhivery already includes fuel surcharge & freight. TAT defaults (Express 2d, Surface 4d) — Phase 2 may refine via `predict-eta`.
6. **Graceful failure**: one mode fails → return the other; both fail → `{ is_serviceable: false }` + log warning so the parallel fan-out keeps Prayog/Shadowfax working.

## Frontend Wiring (Hidden in Phase 1)

In `BookingStep2.tsx`'s `Promise.allSettled` array, add the new function call. Gate the merge into `partners[]` behind:
```text
const DELHIVERY_DIRECT_ENABLED = false; // flip in Phase 2
```
Logs run, function exercised in real usage, row hidden from users.

`src/config/partnerLogos.ts` gets a `'delhivery_direct'` entry (uses existing Delhivery logo URL) — ready for Phase 2.

## Phase 2 Preview (separate PR)

`delhivery-booking` (RVP via `/api/cmu/create.json` — pickup_location = sender, consignee = receiver, `payment_mode = "Prepaid"`, `rt=R`/RVP-flagged shipment), `delhivery-tracking` (`/api/v1/packages/json/`), `delhivery-cancel-order` (edit API with `cancellation: true`), `isDelhiveryDirect` branches in `Booking.tsx` + `Tracking.tsx` + `useCancelOrder.ts`, persist with `booking_source = 'delhivery_direct'`, flip `DELHIVERY_DIRECT_ENABLED = true`. Will need `DELHIVERY_CLIENT_WAREHOUSE_NAME` + `DELHIVERY_PROD_CLIENT_WAREHOUSE_NAME` secrets.

## Files Modified / Created

| File | Change |
|---|---|
| **New** `supabase/functions/delhivery-serviceability/index.ts` | Pincode check + parallel Express/Surface RVP rate calls (sender=origin, receiver=destination), normalized response |
| `supabase/functions/_shared/environment.ts` | Add `DELHIVERY_CONFIG` + `getDelhiveryConfig()` |
| `supabase/config.toml` | Add `[functions.delhivery-serviceability] verify_jwt = false` |
| `src/config/partnerLogos.ts` | Add `'delhivery_direct'` entry |
| `src/components/booking/BookingStep2.tsx` | Add 3rd entry in parallel fan-out; merge gated behind `DELHIVERY_DIRECT_ENABLED = false` |

