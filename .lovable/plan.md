

## Urbanebolt Direct Integration

Add Urbanebolt as a third direct courier partner alongside Shadowfax and Delhivery, covering serviceability + price quote, booking, tracking, cancellation, and label download.

### What needs to happen first (from you)
- **Sandbox (UAT) credentials**: `username` and `password` for `https://uat.urbanebolt.in/api/v1/auth/getToken/`
- **Production credentials** (when ready): same pair for `https://api.urbanebolt.in/...`
- **Customer code** that Urbanebolt assigns to your account (used in payloads)

I'll request these as Supabase secrets:
- `URBANEBOLT_UAT_USERNAME`, `URBANEBOLT_UAT_PASSWORD`
- `URBANEBOLT_PROD_USERNAME`, `URBANEBOLT_PROD_PASSWORD`
- `URBANEBOLT_CUSTOMER_CODE`

### What I will build

#### 1) Shared environment + token helper
Update `supabase/functions/_shared/environment.ts`:
- Add `URBANEBOLT_CONFIG` (UAT vs PROD base URLs)
- Add `getUrbanboltConfig(env)` returning `{ apiBaseUrl, username, password, customerCode }`

Create `supabase/functions/_shared/urbanebolt-auth.ts`:
- `getUrbanboltToken(env)` calls `/auth/getToken/`, caches the JWT in-memory per function instance until expiry, refreshes on 401
- All Urbanebolt edge functions reuse this

#### 2) New edge functions (all with `verify_jwt = false`, CORS, env header)
- `urbanebolt-serviceability` — calls Pincode API for both pickup & delivery, returns the same shape Shadowfax/Delhivery use (`{ is_serviceable, partner: { partner_code: 'urbanebolt', services: [...] } }`). Price + TAT computed from the rate card sheet you shared (intra-city + intercity tiers, weight slabs, FSC).
- `urbanebolt-booking` — calls Manifest API with mapped softdata payload (sender, receiver, package, payment mode, customer code), persists `prayog_awb` (= AWB returned), `booking_source = 'urbanebolt_direct'`, and `label_url` if returned.
- `urbanebolt-tracking` — calls Tracking PULL API by AWB, normalizes status to the same shape used by Shadowfax/Delhivery tracking.
- `urbanebolt-cancel-order` — calls Cancellation API with AWB + reason; updates booking row.
- `urbanebolt-label` — calls Print Label API by AWB, returns label URL/blob; persisted into `bookings.label_url`.
- `urbanebolt-webhook` — public endpoint registered in Urbanebolt panel; receives status updates and updates `bookings.status` by AWB.

Register all six in `supabase/config.toml` with `verify_jwt = false`.

#### 3) Wire into existing flows
- `src/components/booking/BookingStep2.tsx` → add `{ code: 'urbanebolt', fn: 'urbanebolt-serviceability' }` to `DIRECT_PARTNERS` so it runs in parallel.
- `src/config/partnerLogos.ts` → add `urbanebolt` and `urbanebolt_direct` entries (placeholder via UI Avatars until you provide an SVG/PNG).
- `src/hooks/useCancelOrder.ts` → add `urbanebolt_direct` branch invoking `urbanebolt-cancel-order`.
- `supabase/functions/get-booking-label/index.ts` → handle `booking_source === 'urbanebolt_direct'` by calling `urbanebolt-label` and persisting the URL.
- `src/pages/Tracking.tsx` → route to `urbanebolt-tracking` when source matches.
- `supabase/functions/save-booking/index.ts` and `confirm-booking-or-refund` → recognize `urbanebolt_direct` as a valid source.

#### 4) Booking payload mapping (Urbanebolt softdata)
Mapping ViaSetu booking → Urbanebolt manifest fields (mandatory fields from the shared spec sheet):
```text
shipment_no       <- internal booking id
awb               <- left blank (Urbanebolt assigns)
order_no          <- internal booking id
payment_mode      <- 'Prepaid' (no COD; COP handled separately if requested)
customer_code     <- URBANEBOLT_CUSTOMER_CODE
consignee_name    <- receiver_name
consignee_address <- receiver flat + address
consignee_city    <- receiver_city
consignee_state   <- receiver_state
consignee_pin     <- receiver_pincode
consignee_mobile  <- receiver_phone
seller_name       <- sender_name
seller_address    <- sender flat + address
seller_pin        <- sender_pincode
product_desc      <- goods_type
qty               <- 1
weight (kg)       <- package_weight
length/width/height <- dimensions (cm)
declared_value    <- shipment_value
```

#### 5) Verification checklist
1. Sandbox token fetch succeeds, cached across calls.
2. Pincode check returns serviceable for a known UAT pincode pair; Urbanebolt appears as a partner card on Step 4 alongside Shadowfax/Delhivery.
3. Place a test booking → AWB stored, label downloads via `urbanebolt-label`, booking visible in History with all action buttons working.
4. Tracking page shows live status from Tracking PULL API.
5. Cancel from History/Details succeeds and reflects status.
6. Webhook hit updates the booking status without manual refresh.

### Out of scope for this round
ePOD, NDR re-attempt/RTO-lock, and PayMode change endpoints — happy to add as a follow-up once core flow is verified.

