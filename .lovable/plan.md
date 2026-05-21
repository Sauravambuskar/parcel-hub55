## Goal

When a booking fails after payment, capture the **exact partner API error** and show it to the **super admin** in the admin order details. Consumers continue to see the existing friendly message ("Partner couldn't accept the booking. Payment refunded.").

## Problem

Today, `confirm-booking-or-refund` receives the raw partner error via the `error_detail` request field, but it only stores it inside the Razorpay refund `notes`. The `bookings` row keeps only the generic `failure_reason` string. So when an admin opens a failed order, there is no way to see what Delhivery / Shadowfax / XpressBees actually returned — exactly what happened with the May 19 and May 20 orders.

## Plan

### 1. Database — store raw partner error

Add one nullable column to `bookings`:

- `partner_error_raw text` — full error payload/message returned by the partner API (truncated server-side to ~2000 chars).

No RLS changes needed (super admin already has `SELECT` via `is_admin`).

### 2. Edge function — `confirm-booking-or-refund`

- Persist `error_detail` (already received in the request body) into the new `partner_error_raw` column on both the UPDATE and INSERT paths.
- Keep `failure_reason` as the friendly, consumer-facing sentence (unchanged).
- Truncate to 2000 chars before writing.

### 3. Edge function — `get-booking-detail`

- Add `partner_error_raw`, `failure_reason`, `failure_step`, `refund_reason`, `refund_id` to the `_booking` payload it already returns, so the admin detail UI can render them. Consumer-facing fields stay unchanged.

### 4. Admin UI — `src/pages/admin/OrderMonitoring.tsx`

In the order detail drawer/dialog, when `status === 'FAILED'` (or cancelled with `failure_step`), render a new **"Failure diagnostics (admin only)"** section visible only when `adminUser.role === 'super_admin'`:

- Failure step (`failure_step`)
- Friendly reason (`failure_reason`)
- **Raw partner response** (`partner_error_raw`) inside a monospace `<pre>` with copy button
- Refund id + refund status

Non-super-admin roles (operations / support) see only the friendly reason — same as the consumer.

### 5. Consumer UI

No change. `History` / `OrderDetails` continue to display `failure_reason` only.

## Technical notes

```text
bookings
  + partner_error_raw  text  null
```

Files touched:
- migration: add column
- `supabase/functions/confirm-booking-or-refund/index.ts` — write `partner_error_raw`
- `supabase/functions/get-booking-detail/index.ts` — expose admin fields
- `src/pages/admin/OrderMonitoring.tsx` — render super-admin-only diagnostics block

Out of scope: backfilling the two existing failed orders (their raw error was never stored and edge logs are gone). Going forward, every new failure will carry the raw partner response.
