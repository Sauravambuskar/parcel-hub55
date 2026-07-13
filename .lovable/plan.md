
## Problem

Assisted booking (`admin-create-payment-link`) inserts a `bookings` row with `status = PENDING_PAYMENT`, `payment_link_id`, `payment_link_url`. There is currently:
- No webhook flipping the row when the customer pays
- No UI listing these pending rows
- No mechanism to place the courier order after payment (the customer-side courier booking lives in `Booking.tsx` and runs only when the browser completes payment)

So payment `pay_TD1XoA6yZ0YRPT` was captured on Razorpay but the booking is stuck in `PENDING_PAYMENT` and no courier manifest was generated.

## Solution

Add an admin-triggered "Refresh & confirm" path that (1) queries Razorpay for the payment link, (2) if paid, updates the booking to `PAYMENT_RECEIVED`, and (3) automatically fires the appropriate direct-partner booking edge function, flipping the row to `CREATED` with an AWB — same terminal state as a normal customer booking.

### 1. New edge function: `admin-finalize-assisted-booking`

Admin-authenticated (super_admin / operations / support). Input: `{ booking_id }`. Steps:

1. Load the `bookings` row (service role). Reject if not `PENDING_PAYMENT` / `is_admin_assisted`.
2. Call Razorpay `GET /v1/payment_links/{payment_link_id}` using the environment stored implicitly (we'll accept `x-environment`, matching `admin-create-payment-link`).
3. Inspect `status` and `payments[]`:
   - `status = paid` and a captured payment exists → grab `payment_id`.
   - Otherwise → return `{ paid: false, link_status }` so the UI can say "not paid yet".
4. If paid: update the row with `payment_id`, `payment_status='paid'`, `status='PAYMENT_RECEIVED'`, `payment_link_status='paid'` (idempotent — skip if already advanced).
5. Determine partner from stored `courier_name` / a new `partner_id` field (we'll persist `partner_id` at link-creation time — see step 3 below) and call the corresponding direct-partner booking function (`shadowfax-booking`, `delhivery-booking`, `xpressbees-booking`, `urbanebolt-booking`, `shree-maruti-booking`) using the row's sender/receiver/package fields.
6. On partner success: update the row with `awb_number`, `tracking_id`, `label_url`, `status='CREATED'`, `booking_source='admin_assisted'`, and trigger the admin-notification email (same pattern `save-booking` uses).
7. On partner failure: call `confirm-booking-or-refund` with the captured `payment_id` so the customer is auto-refunded, matching the customer-side flow.

Return `{ paid, booked, awb_number?, tracking_id?, error? }`.

### 2. Small manual-payment override (for `pay_TD1XoA6yZ0YRPT` and similar)

Accept an optional `manual_payment_id` in the request. When present and the Razorpay lookup does not find a paid link (e.g. the customer paid outside the link, or the link's payments array is empty), fetch that payment id via `GET /v1/payments/{id}`, verify `status = captured` and `amount` matches the row's total, then proceed as if paid. This unblocks the current stuck order without waiting on webhook plumbing.

### 3. Persist `partner_id` + `service_code` at link creation

`admin-create-payment-link` currently stores `courier_name` (e.g. "Shadowfax") but not the machine partner_id. Add two columns to `bookings` (nullable text): `partner_id`, `service_code`, and populate them from the booking draft. The Booking.tsx assisted flow already has `selectedPartnerData.partnerId` / `.serviceCode` — we'll pass them through. Migration + updates to `Booking.tsx` (draft build) and `admin-create-payment-link`.

### 4. New admin page: `/admin/assisted-pending`

Route + sidebar entry under Admin. Lists all rows where `is_admin_assisted = true AND status = 'PENDING_PAYMENT'`. Columns: created_at, customer name/phone, courier, amount, payment_link_status, actions.

Actions per row:
- **Refresh payment** → calls `admin-finalize-assisted-booking` with `{ booking_id }`. Toasts `"Payment not received yet"` / `"Booking confirmed · AWB xxx"` / refund messaging.
- **Enter payment ID manually** → prompt for a `pay_...` id, then calls the same function with `manual_payment_id`. Used for `pay_TD1XoA6yZ0YRPT`.
- **Copy link**, **Open Razorpay dashboard**.

Auto-refresh every 30s while the tab is open.

### 5. Booking.tsx tweak

After the payment-link-sent dialog, add a "View pending bookings" link that goes to `/admin/assisted-pending` so admins can jump straight to the follow-up screen.

## Technical details

Files touched:

```text
supabase/migrations/<ts>_add_partner_id_to_bookings.sql   (new)
supabase/functions/admin-finalize-assisted-booking/index.ts (new)
supabase/functions/admin-create-payment-link/index.ts     (persist partner_id/service_code)
src/pages/Booking.tsx                                     (pass partner_id/service_code in draft)
src/pages/admin/AssistedPendingBookings.tsx               (new)
src/components/admin/AdminLayout.tsx                      (nav entry)
src/App.tsx                                               (route)
```

Data-flow when admin clicks Refresh:

```text
Admin UI ──► admin-finalize-assisted-booking
                │
                ├─► Razorpay GET /payment_links/{id}     (or /payments/{manual})
                │       └─ if not paid → return {paid:false}
                │
                ├─► bookings UPDATE → PAYMENT_RECEIVED (+ payment_id)
                │
                ├─► {partner}-booking edge function
                │       ├─ success → UPDATE → CREATED + awb
                │       └─ failure → confirm-booking-or-refund → refund + FAILED
                │
                └─► return status to UI
```

## Out of scope (call-outs)

- No Razorpay webhook is being added in this change. Refresh is admin-triggered; if we later want fully hands-off confirmation, a webhook route would be a follow-up.
- No changes to the customer-side booking path — that continues to work exactly as today.

## Confirmations needed

1. Auto-book the courier immediately on refresh (my default), or just mark the payment as received and let an admin click a separate "Place courier order" button?
2. For `pay_TD1XoA6yZ0YRPT` specifically — do you want me to run the manual-payment path against it as part of this change, or only ship the tooling and let you trigger it?
