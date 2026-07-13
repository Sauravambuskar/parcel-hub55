# Investigation: pay_TCy6wryv0VCnRN

## What I found

- Queried the `bookings` table by `payment_id = 'pay_TCy6wryv0VCnRN'` (and ILIKE match). **Zero rows.**
- The most recent booking row is `pay_TCsbHIGUE3qcPp` at `2026-07-13 05:58:13 UTC` (status `FAILED`, auto-refunded). Razorpay payment IDs are time-ordered, so `pay_TCy6...` was created slightly after this — but no row was ever written for it.
- Order Monitoring reads exclusively from `bookings`, which is why this payment is invisible there.

## What this means

The customer paid on Razorpay, but the `bookings` row was never persisted. The three usual causes:

1. `razorpay-verify-payment` failed to insert the `PAYMENT_RECEIVED` placeholder row (signature/verify error, or DB error).
2. The client closed the tab between Razorpay success callback and `save-booking`, and the placeholder insert also didn't happen.
3. Payment was captured but the verify call never reached our backend.

Edge-function logs for `razorpay-verify-payment` / `save-booking` don't retain that far back (log window empty for this pay_id), so we can't confirm cause from logs alone.

## Recovery plan

I need a decision from you before touching anything, because the fix depends on what Razorpay says about this payment.

### Step 1 — Look up the payment on Razorpay (read-only)
Call `razorpay-orders` (action `fetch` on the Razorpay order) or open Razorpay Dashboard for `pay_TCy6wryv0VCnRN` to confirm:
- Status: `captured` / `authorized` / `failed`
- Amount, order_id, notes (which usually contain `user_id`, courier, pincodes)
- Whether a refund already exists

### Step 2 — Choose recovery based on Razorpay state

- **If captured, no refund, order notes have booking payload** → back-fill a `bookings` row (status `PAYMENT_RECEIVED`, `payment_status = 'paid'`) using notes from the Razorpay order, so it appears in Order Monitoring. Then either (a) manually retry the courier manifest via Assisted Booking, or (b) refund via `razorpay-refund` if the customer wants their money back.
- **If captured but notes are empty / insufficient** → refund via `razorpay-refund` and create a minimal `bookings` row (`status = FAILED`, `payment_status = refunded`, `failure_reason = 'Booking payload lost; auto-refunded'`) so it's visible for audit.
- **If already refunded on Razorpay** → insert a matching `bookings` row with `status = FAILED`, `payment_status = refunded`, and the existing `refund_id`, purely so Order Monitoring reflects reality.
- **If failed/not captured** → no action needed; nothing was charged.

### Step 3 — Prevent recurrence
Separately, add a safety net so this can't silently happen again: on `razorpay-verify-payment` success, always insert the `PAYMENT_RECEIVED` placeholder before returning to the client, and log any insert failure loudly. (Only implement if step 2 diagnosis shows this was the failure point.)

## What I need from you

1. Permission to hit Razorpay's API from an edge function to fetch this payment's details and its order notes, or paste the payment/order details from Razorpay Dashboard here.
2. Preferred recovery when captured: **refund the customer** or **back-fill and retry the courier booking**?

Once you answer, I'll switch to build mode and execute the exact SQL/edge-function calls.
