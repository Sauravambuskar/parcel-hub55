## Goal

Stop users from cancelling an order after it's been placed. Make the no-cancellation policy crystal clear BEFORE they pay, and direct them to email [support@viasetu.com](mailto:support@viasetu.com) if they truly need to cancel after booking.

## Changes

### 1. Pre-booking confirmation prompt (`BookingReviewStep.tsx`)

- Replace the existing soft "Cancellation policy" amber notice with a stronger one: "Orders once placed cannot be cancelled. If you need to cancel after booking, email [support@viasetu.com](mailto:support@viasetu.com)."
- Intercept the `Pay Now` button click with an `AlertDialog` confirmation: "Orders cannot be cancelled once placed. Are you sure you want to proceed?" with Cancel / "Yes, place order" actions. Only on confirm do we call `onConfirm()` (which opens the payment modal).

### 2. Remove customer cancel UI

Strip the cancel button and `CancelOrderDialog` from customer-facing screens:

- `src/pages/History.tsx` — remove cancel button, `useCancelOrder`, `CancelOrderDialog`, related state.
- `src/pages/OrderDetails.tsx` — same.
- `src/pages/Tracking.tsx` — same.

In place of the cancel button on OrderDetails and Tracking, show a small inline note: "Need to cancel? Email [support@viasetu.com](mailto:support@viasetu.com)" with a `mailto:` link and inform user that we will respond in a few hours.

### 3. Keep admin cancel intact

`src/pages/admin/OrderMonitoring.tsx` keeps using `useCancelOrder` + `CancelOrderDialog` so support staff can still cancel on behalf of a customer after an email request. No change there.

### 4. Leftover files

- `src/components/booking/CancellationPolicyNotice.tsx` — no longer referenced; leave file in place (unused) to avoid scope creep, OR delete. Will delete since nothing imports it.
- `src/hooks/useCancelOrder.ts` and `src/components/booking/CancelOrderDialog.tsx` — keep (admin still uses them).

### Out of scope

- No backend / edge-function changes. Partner cancel endpoints remain available for admin use.
- No changes to refund logic.

## Files touched

- edit: `src/components/booking/BookingReviewStep.tsx`
- edit: `src/pages/History.tsx`
- edit: `src/pages/OrderDetails.tsx`
- edit: `src/pages/Tracking.tsx`
- delete: `src/components/booking/CancellationPolicyNotice.tsx` (unused after edits)