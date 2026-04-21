

## Delhivery C2C Forward Order — Full 7-Step Integration

Implement the complete C2C flow where the **sender's address** is dynamically registered as the pickup location for each booking, so Delhivery picks up from the customer (not your warehouse) and delivers to the receiver.

### Flow

```text
1. Serviceability check  (sender + receiver pincodes)
2. Create pickup location (sender's address)        ← NEW
3. Fetch waybill (AWB)                              ← NEW
4. Create shipment (with sender as pickup, receiver as consignee)
5. Generate shipping label                          ← NEW (fetch URL)
6. Create pickup request                            ← NEW
7. Track shipment
```

### Files to change / create

**1. `supabase/functions/delhivery-warehouse-create/index.ts`** (new)
- POST `/api/backend/clientwarehouse/create/`
- Body: sender name, address, pincode, city, phone, return address (same as sender for C2C).
- Returns warehouse `name` (we'll use sender phone + timestamp as the unique name, e.g. `VS_<phone>_<ts>`).
- Handles "warehouse already exists" gracefully — reuses existing name.

**2. `supabase/functions/delhivery-fetch-waybill/index.ts`** (new)
- GET `/waybill/api/bulk/json/?count=1&cl=<client_name>`
- Returns single AWB string.
- `client_name` from new env var `DELHIVERY_PROD_CLIENT_NAME`.

**3. `supabase/functions/delhivery-pickup-request/index.ts`** (new)
- POST `/fm/request/new/`
- Body: `pickup_location` (the warehouse name from step 2), `pickup_date`, `pickup_time`, `expected_package_count`.
- Schedules courier pickup from sender's address.

**4. `supabase/functions/delhivery-booking/index.ts`** (rewrite)
- Orchestrates steps 2 → 3 → 4 → 6 in sequence:
  1. Call `delhivery-warehouse-create` with sender details → get pickup_location name.
  2. Call `delhivery-fetch-waybill` → get AWB.
  3. POST `/api/cmu/create.json` with:
     - Top-level `name/add/pin/city/state/phone` = **receiver** (consignee/destination).
     - `waybill` = AWB from step 3.
     - `payment_mode: "Prepaid"`.
     - `pickup_location.name` = warehouse from step 2.
     - No `return_*` keys.
     - `seller_*` blank.
  4. Call `delhivery-pickup-request` with pickup_location name + tomorrow's date.
- Returns AWB, pickup_id, label fetch URL.

**5. `supabase/functions/delhivery-label/index.ts`** (new)
- GET `/api/p/packing_slip?wbns=<AWB>&pdf=true`
- Returns Delhivery's hosted label URL/PDF link.
- Called on demand from the order details page (same pattern as Shadowfax).

**6. `supabase/functions/delhivery-serviceability/index.ts`** (already exists, no change needed for forward — already removed `rt=R` per prior plan).

**7. `supabase/functions/delhivery-tracking/index.ts`** (small fix)
- Change `type: "REVERSE"` → `"FORWARD"`.
- `sourceLocation` ← sender pickup point, `destinationLocation` ← consignee.

**8. `supabase/config.toml`** — register the four new functions with `verify_jwt = false`.

**9. `src/pages/Booking.tsx` / booking handler** — when Delhivery is selected, the orchestration is fully server-side; no frontend changes beyond the existing `delhivery-booking` invocation. Label download button on order details page calls the new `delhivery-label` function (mirrors Shadowfax label flow).

### New secret required

- `DELHIVERY_PROD_CLIENT_NAME` — your Delhivery account's client name (different from warehouse name; needed for the waybill-fetch API). I'll request this from you after plan approval.

All other Delhivery secrets already exist (`DELHIVERY_PROD_TOKEN`, `DELHIVERY_PROD_CLIENT_WAREHOUSE_NAME` — the latter becomes a fallback only).

### Idempotency & error handling

- Warehouse-create: if Delhivery returns "already exists" for the generated name, treat as success and reuse it. Use `VS_<sender_phone>` (no timestamp) so the same customer's repeat bookings reuse the same registered pickup location.
- Each step logs its full request/response for debugging via `delhivery-booking` logs.
- If any step (2–4, 6) fails, return a structured error with which step failed; the existing `confirm-booking-or-refund` flow then triggers a Razorpay refund (no DB changes needed — current refund logic already handles booking failures).

### Verification after deploy

1. Place one fresh test booking via Delhivery in the app.
2. In Delhivery One portal:
   - **Pickup card** → sender's name + address (the customer's address, registered live).
   - **Delivery card** → receiver's name + address.
   - **Seller card** → blank.
3. A pickup request appears in the Delhivery portal scheduled for tomorrow at the sender's address.
4. Label download button on order details returns a valid PDF.
5. Tracking page shows direction = forward, source = sender, destination = receiver.

