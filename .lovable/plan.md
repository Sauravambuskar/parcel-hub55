## Shree Maruti Courier Integration — Implementation Plan

Add Shree Maruti as a forward courier alongside Delhivery / XpressBees / Urbanebolt. Reverse-pickup carve-out stays Shadowfax-only. Webhook is **out of scope** for this iteration — tracking will be polled on demand.

### Prerequisites (already done)
- Secrets configured: `SHREE_MARUTI_PROD_EMAIL`, `SHREE_MARUTI_PROD_PASSWORD`, `SHREE_MARUTI_STAGING_EMAIL`, `SHREE_MARUTI_STAGING_PASSWORD`
- Shared auth helper exists: `supabase/functions/_shared/shree-maruti-auth.ts`
- Environment config wired: `getShreeMarutiConfig()` in `_shared/environment.ts`
- Legacy "block label download" removed from `History.tsx`

### Edge functions to create

| Function | Upstream endpoint | Purpose |
|---|---|---|
| `shree-maruti-serviceability` | `POST /fulfillment/.../serviceability` | Pincode coverage check |
| `shree-maruti-rate` | `POST /fulfillment/.../rate-calculation` | Rate quote for pricing |
| `shree-maruti-booking` | `POST /fulfillment/public/seller/order/ecomm/push-order` | Create forward order, return AWB |
| `shree-maruti-label` | `GET /fulfillment/.../download/label-invoice` | Download label PDF (binary) |
| `shree-maruti-tracking` | `GET /fulfillment/public/seller/order/order-tracking/{awb}` | Status timeline |
| `shree-maruti-cancel-order` | `POST /fulfillment/.../cancel-order` | Cancel + trigger Razorpay refund |

All functions follow existing conventions: CORS, `x-prayog-auth` user verification, `x-environment` switch, structured logging, service-role writes to `bookings`. All use the shared `shreeMarutiFetch()` helper for auth/refresh.

### Key implementation details

- **Weight**: convert kg → grams before pushing to upstream (Shree Maruti expects grams).
- **Payment**: hardcode `paymentType: ONLINE` (no COD per project policy).
- **Status mapping** for `shree-maruti-tracking`:
  - `BOOKED` / `ORDER_CONFIRMED` → `CREATED`
  - `PICKED_UP` → `PICKED_UP`
  - `IN_TRANSIT` / `REACHED_HUB` → `IN_TRANSIT`
  - `OUT_FOR_DELIVERY` → `OUT_FOR_DELIVERY`
  - `DELIVERED` → `DELIVERED`
  - `CANCELLED` / `RTO*` → `CANCELLED`
- **Label**: response is binary PDF → upload to Supabase storage or stream back as base64; store URL in `bookings.label_url`. (Same pattern as `delhivery-label`.)

### Frontend wiring

- **Partner registry**: add `shree_maruti_direct` to `src/config/partnerLogos.ts`; placeholder logo at `src/assets/shree-maruti-logo.svg`.
- **`SmartRanking.tsx`**: include Shree Maruti in courier list with surface + express service codes.
- **`Booking.tsx`**: add 5th submit branch → `shree-maruti-booking`; store `booking_source: 'shree_maruti_direct'`, AWB in `prayog_awb`, label URL in `label_url`.
- **`OrderDetails.tsx` + `get-booking-label`**: add `shree_maruti_direct` to label download allow-list.
- **`Tracking.tsx`**: route Shree Maruti AWBs to `shree-maruti-tracking`.
- **`useCancelOrder.ts`**: add branch for `shree_maruti_direct` → `shree-maruti-cancel-order` → existing Razorpay refund flow.
- **`check-serviceability` orchestrator**: add parallel `shree-maruti-serviceability` call.

### Confirmation dialog
No change needed — Shree Maruti is forward-only, so existing "Download → Print → Attach" flow applies (`isReversePickup` stays `false`).

### Memory updates (post-implementation)
- Create `mem://logistics/shree-maruti-integration` (base URLs, auth, status map, label format).
- Update `mem://features/shipping-label-management-logic` to drop the "block Shree Maruti labels" rule.

### Out of scope (this iteration)
- Webhook receiver + HMAC verification (deferred — relying on tracking polling).
- Manifest / DRS / PRS / bulk upload / postpaid reconciliation.

### Build order
1. `shree-maruti-serviceability` → 2. `shree-maruti-rate` → 3. `shree-maruti-booking` → 4. `shree-maruti-label` → 5. `shree-maruti-tracking` → 6. `shree-maruti-cancel-order` → 7. Frontend wiring → 8. Memory updates.
