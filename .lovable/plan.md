

## XpressBees Direct Integration — Manual Serviceability + Rate Card

Since the XpressBees franchise B2C API exposes only Login, Courier List, Shipments, Cancel, Track, Pickup, Rate Calculator and NDR — there is **no live pincode serviceability endpoint** — we'll mirror the Shadowfax pattern: pincode CSV in DB + rate card in code.

### What I need from you first

1. **Credentials** (Supabase secrets):
   - `XPRESSBEES_PROD_EMAIL`, `XPRESSBEES_PROD_PASSWORD` (for `/api/users/franchise_login`)
   - `XPRESSBEES_PICKUP_LOCATION` (the pickup location name registered on your XpressBees franchise panel)
2. **Two CSVs / sheets** (you upload, I'll seed):
   - **Serviceable pincodes** — columns: `pincode, city, state, zone (intra/metro/roi/special), is_cod, is_prepaid`
   - **Rate card** — slabs by zone × weight (forward + RTO), FSC %, COD %, min chargeable weight, volumetric divisor
3. **Courier ID list** — the JSON returned by `GET /api/franchise/shipments/courier` (or let me call it once after creds land and cache it). We need the `courier_id` values so we can show service modes (Surface / Air / etc.) on the ETA cards.

### Architecture

```text
Frontend (BookingStep2)
   │  parallel serviceability fan-out
   ▼
xpressbees-serviceability  ── reads ──▶  xpressbees_pincodes (Postgres)
   │                                      + rate_card.ts (in-code)
   ▼
returns { is_serviceable, services[]: [Surface, Air, …] with price + TAT }

xpressbees-booking  ──▶  POST /api/franchise/shipments/  (Bearer)
xpressbees-tracking ──▶  POST /api/franchise/shipments/track
xpressbees-cancel   ──▶  POST /api/franchise/shipments/cancel
xpressbees-label    ──▶  fetched from booking response / label endpoint
xpressbees-webhook  ──▶  public, updates bookings.status by AWB
```

### Build steps

**1. Database**
- New table `xpressbees_pincodes` (mirrors `shadowfax_pincodes`): `pincode, city, state, zone, is_cod, is_prepaid, is_active`. RLS: public read, service-role write. Seeded from your CSV via migration.

**2. Shared helpers**
- `_shared/environment.ts` → add `XPRESSBEES_CONFIG` (single base `https://ship.xpressbees.com`, since franchise API has no UAT).
- `_shared/xpressbees-auth.ts` → `getXpressbeesToken()` calls `/api/users/franchise_login`, caches JWT in-memory, refreshes on 401.
- `_shared/xpressbees-rates.ts` → pure function `quote({zone, weight_kg, dimensions, mode}) → {price, tat_days}`. Encodes the rate card you provide. Applies min chargeable weight + max(actual, volumetric).

**3. Edge functions** (all `verify_jwt = false`, CORS, env header)
- `xpressbees-serviceability` — looks up both pincodes in `xpressbees_pincodes`, derives zone (intra-city if same city; else metro/ROI/special based on the destination zone column), runs `quote()` for each available service mode, returns same shape as Shadowfax/Delhivery/Urbanebolt.
- `xpressbees-booking` — maps booking → franchise shipment payload (field names from the docs: `consigner_*`, `consignee_*`, `products[]`, `weight` in **grams**, `length/breadth/height` in cm, `courier_id`, `pickup_location`, `payment_method: "PPD"`, `order_amount`, `collectable_amount: 0`). Persists AWB + label URL.
- `xpressbees-tracking` — POST to track endpoint with AWB; normalize to shared status enum (DELIVERED / OUT_FOR_DELIVERY / IN_TRANSIT / RTO / CANCELLED).
- `xpressbees-cancel-order` — POST to cancel with AWB + reason.
- `xpressbees-label` — return label URL stored at booking, or fetch on-demand if endpoint exists.
- `xpressbees-webhook` — public; updates `bookings.status` by AWB.

All registered in `supabase/config.toml`.

**4. Frontend wiring** (mirror Urbanebolt exactly)
- `BookingStep2.tsx` → add `{ code: 'xpressbees', fn: 'xpressbees-serviceability' }` to `DIRECT_PARTNERS`.
- `partnerLogos.ts` → add `xpressbees` + `xpressbees_direct` (placeholder until you share the logo).
- `useCancelOrder.ts` → `xpressbees_direct` branch.
- `get-booking-label/index.ts`, `Tracking.tsx`, `History.tsx` → recognize `xpressbees_direct`.
- `Booking.tsx`, `save-booking`, `confirm-booking-or-refund` → accept `xpressbees_direct` as valid source.

**5. Pricing**
- Platform commission + 18% GST flow through the existing `usePlatformFee` / `calculate-platform-fee` path. No partner-specific changes.
- Hidden platform-fee-merged-into-base-fare convention is preserved.

### Payload mapping (Shipments API)

```text
id                <- internal booking id
payment_method    <- "PPD" (no COD; COP handled separately)
consigner_*       <- sender_*  (city/state/pincode/address/phone/name)
consignee_*       <- receiver_* (same)
products[0]       <- { product_name: goods_type, product_qty: "1",
                       product_price: shipment_value, product_sku: id, product_hsn: "" }
invoice[0]        <- empty strings (no e-invoice)
weight            <- package_weight_kg * 1000  (grams, string)
length/breadth/height <- cm (string)
courier_id        <- selected service from serviceability response
pickup_location   <- XPRESSBEES_PICKUP_LOCATION
order_amount      <- shipment_value
collectable_amount<- "0"
```

### Verification checklist

1. Login returns token, cached across calls.
2. Pincode CSV seeded; serviceability returns XpressBees with correct zone-based price + TAT.
3. Test booking → AWB stored, label saved, visible in History with all action buttons.
4. Tracking shows live status.
5. Cancel from History/Details succeeds.
6. Webhook hit updates status without refresh.

### Out of scope for this round
NDR re-attempt, COD/Prepaid switch, ePOD fetch, Pickup Shipment endpoint (we'll rely on auto-pickup tied to `pickup_location`). Easy follow-ups.

### Open question
**Do you already have an XpressBees pincode CSV from them, or should I send you a template (`pincode,city,state,zone,is_cod,is_prepaid`) for you to fill?** Same question for the rate card — share the sheet they gave you and I'll encode it.

