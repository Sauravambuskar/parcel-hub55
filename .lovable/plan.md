

## Add Cash-on-Pickup (COP) — Temporary, All Couriers

A new payment option alongside Razorpay. When chosen, skip the Razorpay modal, mark the booking `payment_status='cop_pending'`, and book with the courier as Prepaid (we settle with the partner internally). Easy to remove later by deleting one toggle.

### Files

**1. `src/pages/Booking.tsx`** (review step / payment trigger)
- Replace single "Pay" CTA with two side-by-side buttons:
  - **Pay Now** (Razorpay, existing flow)
  - **Cash on Pickup** (new flow)
- COP click path:
  - Skip `razorpay-create-order` and the Razorpay modal entirely.
  - Skip `confirm-booking-or-refund` (no payment to refund).
  - Generate `orderId` locally, then run the same courier booking branch (Shadowfax / Delhivery / Prayog) with no `paymentDetails`.
  - On success, save booking with `payment_status: 'cop_pending'`, `payment_id: null`, `booking_source` unchanged.
  - On failure, just show error — no refund needed.
- Add a confirmation dialog before COP submit: "You will pay ₹X in cash to the courier at pickup. Continue?"

**2. `src/pages/OrderDetails.tsx`** + `src/pages/History.tsx`
- Render a yellow "Cash on Pickup — Pending" badge when `payment_status === 'cop_pending'`.
- Show "Mark as paid" button visible only to admins (existing `is_admin` check pattern) that updates `payment_status` to `paid`. Skip if out of scope — confirm in note below.

**3. `src/pages/admin/RevenueManagement.tsx`** + `OrderMonitoring.tsx`
- Add a `cop_pending` filter chip and exclude `cop_pending` totals from "Collected revenue" — show separately as "Pending COP collection".

**4. Memory update** (`mem://payments/no-cash-on-delivery-policy`)
- Add note: "TEMPORARILY OVERRIDDEN — COP enabled for all couriers during partner onboarding. Revert by removing the COP button in `BookingReviewStep` / `Booking.tsx`."

### No DB migration needed
The existing `payment_status` column is `text` with no CHECK constraint — `'cop_pending'` is a valid value. No schema change.

### No edge function changes
- `delhivery-booking`, `shadowfax-booking`, `prayog-create-booking` already book as Prepaid regardless of how the customer paid us; no change.
- Razorpay functions untouched.

### Out of scope (ask if you want these)
- Admin "Mark as paid" UI on OrderDetails — I'll add a minimal version unless you say skip.
- COP-only restriction per courier (e.g. only Delhivery) — currently all couriers per your message.
- Reconciliation report / CSV export of pending COP — can add later.

### Verification
1. Place a test booking → review step shows two buttons.
2. Click "Cash on Pickup" → confirm dialog → no Razorpay modal → booking created → AWB returned → order in History shows yellow "COP pending" badge.
3. Click "Pay Now" on a separate booking → existing Razorpay flow still works unchanged.

