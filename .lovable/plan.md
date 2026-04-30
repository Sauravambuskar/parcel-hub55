## Shree Maruti Courier Integration — Plan

Shree Maruti uses the Innofulfill / Delcaper API platform. It will be added as a **forward** courier (printed label is mandatory — same flow as Delhivery / XpressBees / Urbanebolt; the reverse-pickup carve-out we just added stays Shadowfax-only).

### 1. Credentials & secrets (you action)

The API uses email/password login that returns a JWT (`accessToken`, 1d) plus a refresh token (30d). Before code can run, please add these as Supabase secrets:

- `SHREE_MARUTI_PROD_EMAIL`
- `SHREE_MARUTI_PROD_PASSWORD`
- `SHREE_MARUTI_VENDOR_TYPE` *(optional, defaults to `SELLER`)*

Base URLs (already in the docs, hard-coded per environment):

- Staging: `https://qaapis.delcaper.com`
- Production: `https://apis.delcaper.com`

### 2. Shared auth helper

New file `supabase/functions/_shared/shree-maruti-auth.ts`:

- `getShreeMarutiToken(env)` → POSTs `/auth/login` with `{ email, password, vendorType: "SELLER" }`, caches the `accessToken` in module memory until ~5 min before expiry (mirrors `urbanebolt-auth.ts` pattern).
- `getShreeMarutiBaseUrl(env)` → returns staging vs prod URL based on `x-environment` header.
- Auto-retries once on `401` by refreshing the token.

### 3. Edge functions to create


| Function                      | Purpose                              | Upstream endpoint (per docs index) |
| ----------------------------- | ------------------------------------ | ---------------------------------- |
| `shree-maruti-serviceability` | Pincode check for the courier list   | `Serviceability API`               |
| `shree-maruti-rate`           | Rate calc used in pricing fallback   | `Rate calculation API`             |
| `shree-maruti-booking`        | Create forward order, return AWB     | `Booking API`                      |
| `shree-maruti-label`          | Fetch shipping label PDF/URL         | `Label and Invoice API`            |
| `shree-maruti-tracking`       | Status timeline for `/tracking` page | `Tracking API`                     |
| `shree-maruti-cancel-order`   | Cancel + trigger refund              | `Cancel API`                       |
| `shree-maruti-webhook`        | Receive push status updates          | `Webhook Response`                 |


Each function follows the existing convention: CORS headers, `x-prayog-auth` user verification (except the public webhook), `x-environment` switch, structured logging, and writes to the `bookings` table via service role.

> Note: the public Postman page only renders the Auth section without JS. Exact request/response payloads for the remaining endpoints will be filled in from the live doc once we open it during build (each function will be implemented in a small commit so we can verify with a sandbox call before moving on).

### 4. Wiring into the app

**Partner registry** (`src/components/booking/SmartRanking.tsx`, `src/pages/Booking.tsx`, `src/config/partnerLogos.ts`):

- New partner id: `shree_maruti_direct`
- Display name: `Shree Maruti Courier`
- Logo: add `src/assets/shree-maruti-logo.svg` (placeholder until you share an official asset)
- Service codes: `shree_maruti_surface`, `shree_maruti_express`

**Booking submit (`Booking.tsx`)** — add a 5th branch alongside Shadowfax / Delhivery / Urbanebolt / XpressBees that invokes `shree-maruti-booking`, stores `booking_source: 'shree_maruti_direct'`, the AWB in `prayog_awb`, and the label URL in `label_url`.

**Label download (`OrderDetails.tsx`, `History.tsx`, `get-booking-label`)** — add `shree_maruti_direct` to the allow-list. The existing Shree Maruti block in `History.tsx` (lines 289–293) currently *blocks* label downloads for legacy reasons; remove that block now that we own the integration.

**Tracking (`Tracking.tsx`)** — route Shree Maruti AWBs to `shree-maruti-tracking`; map upstream statuses to the internal `STATUS_MAP` (`Booked → CREATED`, `Picked → PICKED_UP`, `In Transit → IN_TRANSIT`, `Out for Delivery → OUT_FOR_DELIVERY`, `Delivered → DELIVERED`, `Cancelled/RTO → CANCELLED`).

**Cancellation (`useCancelOrder.ts`)** — branch on `booking_source === 'shree_maruti_direct'`, call `shree-maruti-cancel-order`, then trigger the existing Razorpay refund flow.

**Serviceability fan-out (`check-serviceability` orchestrator)** — add a parallel `shree-maruti-serviceability` call so it appears in the courier list when both pincodes are covered.

### 5. Confirmation dialog & label rules

- Forward courier → existing "Download → Print → Attach" flow stays. No change needed; `isReversePickup` remains `false` for Shree Maruti.
- Label format expected from upstream is a hosted PDF URL → store directly in `bookings.label_url`, no in-house generator needed (unlike Shadowfax).

### 6. Memory updates

After implementation, add a memory entry:

- `mem://logistics/shree-maruti-integration` — base URLs, auth flow, status map, label format.
- Update `mem://features/shipping-label-management-logic` to remove the "block Shree Maruti labels" rule.

### 7. Out of scope (this iteration)

- Manifest API, DRS, PRS — not needed for the customer app.
- Postpaid billing reconciliation — we charge customer up-front via Razorpay; partner billing is settled separately.
- Bulk order upload.

### Approval checklist before I start

1. Add the 3 secrets listed in §1.
2. Confirm Shree Maruti should appear for **all forward orders** (not just specific zones).
3. Confirm we should remove the legacy "block Shree Maruti label download" code in `History.tsx`.

Once those are confirmed, I'll implement in this order: shared auth → serviceability → rate → booking → label → tracking → cancel → webhook → UI wiring.