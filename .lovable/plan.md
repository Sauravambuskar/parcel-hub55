

## Auto-Refund Safety Net — Plan

Goal: guarantee that **every payment captured by Razorpay either results in a confirmed booking OR is refunded automatically**, with a database audit trail in every case.

### Current state (gaps)

The codebase already calls `razorpay-refund` in three places (Shadowfax, Delhivery, Prayog branches) when the partner booking API rejects the order. But there are **five failure paths today where money is captured and no refund fires**:

1. PaymentModal signature verification fails → payment captured, user told "contact support", no refund.
2. Shadowfax / Delhivery branches refund but never write a `FAILED / refunded` row to `bookings` (only Prayog branch does this).
3. Any thrown error in `handlePaymentSuccess` after payment but before/after the partner call (network blip, JS crash, user closes tab) → no refund.
4. `save-booking` edge function failure after a successful partner booking is silently logged — booking exists with the courier but not in our DB; no compensating action.
5. Refund logic lives only in the browser. If the user closes the tab during the partner API call, refund never runs.

### What we will build

#### 1. New centralized edge function: `confirm-booking-or-refund`

Single server-side function the client calls **once** right after Razorpay verification succeeds. Responsibilities:

- Accept `{ payment_id, order_id, booking_payload, partner_payload, partner_route }`.
- Call the partner booking API (Shadowfax / Delhivery / Prayog) server-side.
- On success: insert the `bookings` row with `payment_status = 'paid'` and return AWB/label.
- On any failure (partner API error, network error, exception): immediately call Razorpay refund API, then insert `bookings` row with `status = 'FAILED'` and `payment_status = 'refunded'` (or `refund_failed`).
- Refund call is wrapped in retry (3 attempts, exponential backoff).

This makes the booking + refund atomic from the client's perspective and removes dependence on the browser staying open.

#### 2. PaymentModal verification-failure refund

Update `src/components/PaymentModal.tsx`: when `razorpay-verify-payment` returns `verified=false` or errors, immediately invoke `razorpay-refund` for that `payment_id` before showing the error toast. Surface a refund-confirmation message to the user.

#### 3. Booking-row audit trail in every branch

Update `src/pages/Booking.tsx` Shadowfax and Delhivery branches to mirror the Prayog branch: write a `FAILED` booking row with `payment_status = 'refunded' | 'refund_failed'` whenever auto-refund is triggered. Ensures History page reflects the refunded transaction.

#### 4. Outer safety net in `handlePaymentSuccess`

Wrap the entire `handlePaymentSuccess` body in a guarded try/catch that, in the `catch`, checks if `paymentDetails?.razorpay_payment_id` is set and no successful booking row exists yet — if so, fire a last-resort refund + write a `FAILED` row. Catches JS errors, network failures, and unexpected partner SDK responses.

#### 5. Idempotency + booking-side reconciliation

- Add a `payment_id` uniqueness check in `save-booking`: if a row with that `payment_id` already exists, return it (prevents duplicate refunds if retry happens).
- The `razorpay-refund` function already returns refund_id; we'll persist it into `bookings` as a new column `refund_id` (text).

#### 6. Refund visibility (already partially built)

The Order Details page already shows refund status. We'll make sure the new `FAILED + refunded` rows render with a clear "Payment refunded — booking could not be created" card.

### Database changes

Single migration:

```sql
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS refund_id text,
  ADD COLUMN IF NOT EXISTS refund_reason text;

CREATE INDEX IF NOT EXISTS bookings_payment_id_idx ON bookings (payment_id);
```

`payment_status` already supports the values `paid | refunded | refund_failed | pending` (used elsewhere) — no enum change needed.

### Files to create / edit

```text
NEW   supabase/functions/confirm-booking-or-refund/index.ts
EDIT  supabase/config.toml                      (verify_jwt = false for new fn)
EDIT  src/components/PaymentModal.tsx           (refund on verify failure)
EDIT  src/pages/Booking.tsx                     (write FAILED rows in SFX/DLV branches; outer safety-net refund; call new fn optional)
NEW   migration                                 (refund_id, refund_reason, index)
```

### Flow diagram

```text
 Razorpay capture ──► verify-payment
                          │
                ┌─────────┴─────────┐
              verified            failed
                │                    │
                ▼                    ▼
       partner booking call    razorpay-refund  ──► toast "Refunded"
                │
        ┌───────┴───────┐
      success         failure / exception / network
        │                    │
        ▼                    ▼
  save booking         razorpay-refund (3x retry)
  payment_status=paid        │
                      ┌──────┴──────┐
                   refunded     refund_failed
                      │              │
                      ▼              ▼
              save FAILED row   save FAILED row
              + refund_id       + manual support flag
```

### User-facing behaviour after this change

- Payment captured + booking succeeds → confirmation dialog (unchanged).
- Payment captured + booking fails → toast: "Booking could not be created. Your payment of ₹X has been refunded automatically. Refund ID: rfnd_XXXX". History shows a "Refunded" badge on that order.
- Payment captured + refund also fails (rare) → toast with payment ID + support instruction. History shows "Refund pending — contact support" so admin team can reconcile.
- Verification failure → automatic refund instead of "contact support".

