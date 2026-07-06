
# Admin-Assisted Booking Flow

Let admins (super_admin, operations, support) create a booking on behalf of a customer using the same 6-step flow customers use, then send a Razorpay payment link the customer completes to confirm the order.

## 1. Admin navigation & access
- Add "Assisted Booking" entry to `AdminLayout` sidebar (visible to super_admin, operations, support).
- New route `/admin/assisted-booking` guarded by `ProtectedAdminRoute` with those three roles.

## 2. Customer lookup step (new Step 0)
- New page `src/pages/admin/AssistedBooking.tsx`.
- First panel: admin enters customer's 10-digit phone + name.
- Calls new edge function `admin-lookup-customer` (service-role) that:
  - Derives `user_id` via the existing phone-hash convention.
  - Fetches `profiles` row if it exists; if not, upserts a minimal profile (name + phone).
  - Returns `{ user_id, phone, name, isNew }`.
- Once resolved, admin sees "Booking for: <name> · <phone>" banner pinned at the top for the rest of the flow.

## 3. Reuse the consumer booking flow
- Refactor `src/pages/Booking.tsx` so its stepper (Step1–Step6 components + state) is exported as a reusable `<BookingWizard>` accepting:
  - `mode: "self" | "admin_assisted"`
  - `customer: { userId, name, phone }` (overrides the logged-in user for self/receiver defaults, address prefill, saved addresses, draft persistence)
  - `onComplete(bookingId)` callback
- Consumer `/booking` page becomes a thin wrapper passing the current session user.
- Admin page mounts `<BookingWizard mode="admin_assisted" customer={lookedUpCustomer} />`.
- Saved-address picker, pincode autofill, goods-type/weight logic, serviceability, courier selection, ETA, review — all identical.

## 4. Payment: send link instead of in-session Razorpay
- In `mode="admin_assisted"`, Step 6 replaces the "Pay now" button with **"Send payment link to customer"**.
- New edge function `admin-create-payment-link`:
  - Creates the booking row with `status='PENDING_PAYMENT'`, `is_admin_assisted=true`, `created_by_admin_id=<admin auth uid>`.
  - Calls Razorpay **Payment Links API** (`POST /v1/payment_links`) with:
    - amount, currency INR, customer name/phone, description = order summary
    - `notify: { sms: true }` (uses Razorpay's SMS; no extra provider)
    - `callback_url` → existing verify page, `callback_method: get`
    - `notes.booking_id` for reconciliation
  - Stores `razorpay_payment_link_id` + `payment_link_url` on the booking.
- Existing `razorpay-verify-payment` webhook path already flips status to `CONFIRMED` and triggers courier booking; extend it to also handle `payment_link.paid` events (match by `notes.booking_id`).
- Admin sees confirmation screen with: link URL (copy button), "Resend SMS" action, and booking reference. No courier booking is placed until payment succeeds.

## 5. Audit trail
Migration on `bookings`:
- `is_admin_assisted boolean not null default false`
- `created_by_admin_id uuid` (references admin user id, nullable)
- `payment_link_id text`, `payment_link_url text`, `payment_link_status text`
- Index on `created_by_admin_id`.
- RLS: extend existing owner-select policy so admins with roles super_admin/operations/support can select/insert/update these rows (via `is_operations(auth.uid())`).

## 6. Admin order monitoring
- On `OrderMonitoring` admin page, add an "Assisted" badge when `is_admin_assisted=true` and a filter toggle "Assisted only". Show `created_by_admin_email` (joined from `admin_users`).

## Technical details

**New files**
- `src/pages/admin/AssistedBooking.tsx` — lookup + wizard host
- `src/components/booking/BookingWizard.tsx` — extracted from `Booking.tsx`
- `supabase/functions/admin-lookup-customer/index.ts`
- `supabase/functions/admin-create-payment-link/index.ts`

**Modified**
- `src/pages/Booking.tsx` → wraps `<BookingWizard mode="self" />`
- `src/components/booking/BookingStep6.tsx` → conditional CTA based on `mode`
- `src/components/admin/AdminLayout.tsx` → sidebar item
- `src/components/admin/ProtectedAdminRoute.tsx` route map in `App.tsx`
- `supabase/functions/razorpay-verify-payment/index.ts` → also accept payment-link webhook payload
- `src/pages/admin/OrderMonitoring.tsx` → badge + filter

**Secrets**: reuses existing `RAZORPAY_PROD_KEY_ID` / `RAZORPAY_PROD_KEY_SECRET`. No new secrets.

**Migration**: single migration adding the four columns + index + updated policies with `GRANT`s preserved.

## Out of scope
- Offline/manual payment recording (not selected).
- Admin paying via Razorpay checkout in-session (not selected).
- Customer OTP re-verification for the assisted booking.
