# Dispute Resolution + Dashboard Status Fix

## Problem 1 — Dashboard shows 0 for everything

Bookings in the DB use uppercase statuses (`CREATED`, `CANCELLED`, plus partner-reported ones like `MANIFESTED`, `IN_TRANSIT`, `DELIVERED`, `RTO`, etc.), but `AdminDashboard.tsx` filters by lowercase literals (`"pending"`, `"in_transit"`, `"delivered"`). Result: counts are always 0.

## Problem 2 — No dispute / cancellation flow

Today when a customer hits "Cancel" and the courier API rejects it (e.g. `READY_FOR_DISPATCH`, `PICKED_UP`), they just see a toast and the request disappears. Admin has no record, no way to follow up, and no way to reinstate an order if they manually resolve it with the partner.

## What we'll build

### 1. Cancellation policy notice at booking time
- On Booking Review step, add a clear notice: *"Orders generally cannot be cancelled once placed and handed to the courier. You can request cancellation, but if the courier has already accepted it, our team will reach out to resolve."*
- Same line shown in the post-payment confirmation screen.

### 2. New `cancellation_disputes` table (one row per failed-cancel attempt)
Fields: booking_id, user_id, reason (customer-provided), partner_error (raw message), partner_status_at_attempt, status (`open` | `in_progress` | `resolved_cancelled` | `resolved_reinstated` | `closed`), admin_notes, assigned_admin, resolved_at, refund_id.
RLS: customer can view own; admins (`is_admin`) can view/update all.

### 3. Customer side — graceful failure
- When `useCancelOrder` catches a partner rejection, instead of just a destructive toast, open a "Request Admin Help" dialog. Customer confirms reason → we insert a row into `cancellation_disputes` with status `open`.
- Customer sees a "Cancellation requested — our team will contact you" badge on the order in History/OrderDetails.
- Optional toggle: send themselves a confirmation (already covered by existing toast).

### 4. Admin Dispute Resolution page (`/admin/disputes`)
- New sidebar entry under AdminLayout.
- Lists all disputes, filter by status, search by tracking ID / phone.
- Drawer per dispute showing: customer name + phone (click-to-call / WhatsApp link), full booking summary, partner error, timeline.
- Admin actions:
  - **Contact customer** — logs a note with timestamp.
  - **Force cancel & refund** — calls existing partner cancel function (retry), and if successful triggers `razorpay-refund`. Marks dispute `resolved_cancelled`.
  - **Reinstate order** — clears the dispute, sets booking status back to its prior value (`CREATED` / partner-reported), marks dispute `resolved_reinstated`. Customer's order returns to normal in their app.
  - **Close without action** — with mandatory note.

### 5. Notifications
- On dispute creation: insert a row in a lightweight `admin_notifications` view (or just realtime subscribe to `cancellation_disputes` on the admin dashboard → red badge on sidebar "Disputes" entry).
- Customer gets a toast + the order card shows status pill "Cancellation under review".
- (SMS/email out of scope unless you want it — current project doesn't send transactional SMS for this.)

### 6. Dashboard fixes
- Normalize status comparisons to lowercase in `AdminDashboard.tsx`.
- Expand the "Order Status Overview" card from 3 tiles to a full breakdown driven by actual data: **Created, Confirmed/Manifested, Picked Up, In Transit, Out for Delivery, Delivered, Cancelled, RTO, Disputed (open)**. Each tile is clickable → filters Orders page.
- Add "Open Disputes" stat card to the top KPI row.

## Technical section

**Files to add**
- `supabase/migrations/<new>.sql` — `cancellation_disputes` table + RLS + realtime publication.
- `src/pages/admin/DisputeResolution.tsx`
- `src/components/admin/DisputeDetailDrawer.tsx`
- `src/components/booking/CancellationPolicyNotice.tsx`

**Files to edit**
- `src/hooks/useCancelOrder.ts` — on partner failure, create dispute row instead of (or in addition to) destructive toast; expose `onPartnerRejection` callback.
- `src/components/booking/CancelOrderDialog.tsx` — show two-step UX: try cancel → if rejected, switch to "Request admin help" view.
- `src/components/booking/BookingReviewStep.tsx` + post-confirmation screen — add policy notice.
- `src/pages/OrderDetails.tsx` + `src/pages/History.tsx` — show dispute badge when an open dispute exists.
- `src/pages/admin/AdminDashboard.tsx` — fix status filters (lowercase compare), add expanded status breakdown grid, add Open Disputes KPI.
- `src/components/admin/AdminLayout.tsx` — add "Disputes" nav item with unread badge.
- `src/App.tsx` — route `/admin/disputes`.

**Status mapping table** (used by both dashboard and dispute UI) added to `src/lib/booking-status.ts` so all surfaces share one canonical list.

**No new secrets, no new partner integrations.** Refund path reuses `razorpay-refund`; reinstate is a pure DB update.

## Out of scope (ask if you want them)
- Bulk dispute export
- SMS/email notifications to customer on status change
- Customer-side chat thread inside the app (we just log admin notes for now)
