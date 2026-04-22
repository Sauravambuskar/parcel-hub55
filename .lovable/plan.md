

## Remove Prayog Completely — Phone+Name Login & Direct-Partner-Only Serviceability

Strip out all Prayog dependencies (OTP auth, aggregator, booking, tracking, label, orders fetch) and keep the app running on **Shadowfax + Delhivery direct integrations** with a clean architecture for adding more direct partners later.

### Part 1 — New Login (no OTP)

**`src/pages/Login.tsx`** — replace OTP flow with single-screen phone + name form:
1. User enters 10-digit phone + name → click "Continue".
2. Generate same deterministic `user_id`: `btoa('+91' + phone).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)` — preserves existing accounts.
3. Call `get-profile` with that ID:
   - If profile exists with a different name → soft-confirm dialog: "An account exists as '<existing>'. Continue as '<existing>' or update name to '<new>'?"
   - If profile exists with same name → instant login.
   - If no profile → call `update-profile` to create one.
4. Save to localStorage as `auth_session` (rename from `prayog_auth` but keep backward-compat read so existing logged-in users aren't kicked out):
   ```ts
   { phone: '+91xxx', user_id, customer_id, userName, authenticated_at }
   ```
   (No `id_token`, no `prayog_token`.)
5. Navigate to `/home`.

### Part 2 — Replace `prayog_auth` reads everywhere

Touched files (rename key, drop token usage):
- `Landing.tsx`, `Index.tsx`, `History.tsx`, `OrderDetails.tsx`, `Tracking.tsx`, `Settings.tsx`, `Booking.tsx`, `AddressStep.tsx`, `PaymentModal.tsx`, `admin/RealTimeTracking.tsx`, `useCancelOrder.ts`, etc.
- Keep a small helper `src/lib/auth.ts` that reads either `auth_session` (new) or `prayog_auth` (legacy) for one transition.

### Part 3 — Serviceability: direct-only, pluggable

**`src/components/booking/BookingStep2.tsx`** — remove the Prayog `fetch()` call entirely. Keep `Promise.allSettled` over a registry of direct-partner edge functions:
```ts
const DIRECT_PARTNERS = [
  { code: 'shadowfax', fn: 'shadowfax-serviceability' },
  { code: 'delhivery', fn: 'delhivery-serviceability' },
  // future: { code: 'dtdc', fn: 'dtdc-serviceability' }, ...
];
```
Each partner returns a normalized `partner` object; merge into `serviceabilityData.partners`. Drop the `DIRECT_PARTNER_CODES` filter (no longer needed since Prayog is gone). If zero partners are serviceable → "Service Unavailable" toast.

Also drop the `check-serviceability` edge function (Prayog wrapper) — no longer used.

### Part 4 — Booking, tracking, label, cancel — direct-only

- **`Booking.tsx`** — currently routes by partner code: Shadowfax → `shadowfax-booking`, Delhivery → `delhivery-booking`, anything else → `prayog-create-booking`. Change the fallback to **error toast** ("This partner is no longer supported") since Prayog partners won't appear anymore. Default new bookings' `booking_source` to the actual direct partner code (no more `'prayog'`).
- **`History.tsx`** — remove the Prayog `fetch(...orders)` call; rely solely on `get-user-orders` (Supabase `bookings` table). Drop `prayog` from the `Promise.allSettled`.
- **`OrderDetails.tsx`** — remove the Prayog order GET. Build the page entirely from the `bookings` row + the appropriate direct tracking function (`shadowfax-tracking` / `delhivery-tracking`) based on `booking_source`. Label download already uses direct functions for SFX/Delhivery; remove the Prayog label fallback.
- **`Tracking.tsx`** — remove Prayog tracking branch; route only to `shadowfax-tracking` / `delhivery-tracking`. If `booking_source` is unknown, show "Tracking unavailable for this order."
- **`useCancelOrder.ts`** — drop `prayog-cancel-order` branch.
- **`admin/RealTimeTracking.tsx`** — replace Prayog tracking call with `shadowfax-tracking` / `delhivery-tracking` (admin enters AWB + selects courier).

### Part 5 — Edge functions to delete

Delete (`supabase--delete_edge_functions`):
- `prayog-send-otp`
- `prayog-verify-otp`
- `prayog-create-booking`
- `prayog-cancel-order`
- `check-serviceability`

Also remove their entries from `supabase/config.toml`.

### Part 6 — Database (no migration needed now)

Existing columns `prayog_awb`, `prayog_order_id`, `prayog_commission`, `booking_source` remain — they hold historical data. New bookings will populate `prayog_awb` with the direct AWB and `booking_source` with `shadowfax_direct` / `delhivery_direct` (already the convention). A future cleanup migration can rename these, out of scope.

### Part 7 — Config & memory cleanup

- **`src/config/environment.ts`** — delete `PRAYOG_CONFIG` export, `TENANT_IDS`, `API_KEYS`, and `prayog` block from `EnvironmentConfig`. Keep environment toggle for Razorpay only.
- Optionally request user delete unused secrets later: `PRAYOG_TENANT_ID`, `PRAYOG_API_KEY`, `PRAYOG_PROD_TENANT_ID`, `PRAYOG_PROD_API_KEY` (I'll list them in a note; user clears manually in dashboard).
- Update memory: invalidate `mem://auth/prayog-otp-authentication`, `mem://technical/prayog-api-endpoints-updated-v2`, `mem://features/tracking-api-integration` (Prayog v2 → direct only). Add new memory: `mem://auth/phone-name-login` and `mem://logistics/direct-partners-only`.

### Adding a new direct partner later (the pattern)

1. Create `supabase/functions/<partner>-serviceability/index.ts` returning `{ is_serviceable, partner: { partner_code, partner_name, services: [...], capabilities, is_serviceable } }`.
2. Add entry to `DIRECT_PARTNERS` array in `BookingStep2.tsx`.
3. Create `<partner>-booking`, `<partner>-tracking`, `<partner>-cancel-order`, `<partner>-label` functions following the Shadowfax/Delhivery shape.
4. Add a new `case` in the booking dispatcher and tracking dispatcher.

### Verification

1. Fresh login: enter a brand-new phone + name → goes straight to `/home`, no OTP prompt.
2. Existing user (already in `profiles`): enter same phone → sees soft-confirm if name differs, instant login otherwise; their old order history is visible.
3. Booking flow shows only Shadowfax and Delhivery on serviceability.
4. Place a Shadowfax test booking → AWB + label work via direct functions.
5. Place a Delhivery test booking → end-to-end works via direct functions.
6. History page loads from `bookings` table only (no Prayog 401s in console).
7. Old logged-in user (legacy `prayog_auth` key) still loads correctly until they re-login.

