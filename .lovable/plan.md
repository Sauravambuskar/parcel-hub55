
## Fix order history actions for direct bookings

Restore all three actions for newly placed direct-partner orders in History:
- View details
- Download/view shipping label
- Cancel order
- Keep track order working from the same data path

### Root causes found
1. **Cancel from History breaks** because `get-user-orders` does not return the AWB inside `_booking`, so Delhivery cancellation is being called with `awb=undefined`.
2. **Order Details says “order not found”** because `OrderDetails.tsx` still queries `bookings` directly from the browser. With the new phone+name login, there is no Supabase auth session, so RLS blocks that read.
3. **Tracking/meta lookups are still partly client-side** for the same reason, so direct-order actions are reading the right row in History but not in Details/Tracking.
4. **Label download is not partner-aware enough**: it only works if `label_url` was already saved on the row. For Delhivery, it should also fetch on demand via `delhivery-label` when missing/expired.

### What to build

#### 1) Fix the History payload
Update `supabase/functions/get-user-orders/index.ts` so each returned order includes complete booking action metadata:
- `id`
- `booking_source`
- `status`
- `payment_status`
- `prayog_awb`
- `tracking_id`
- `prayog_order_id`
- `label_url`

This lets History pass the correct AWB for cancellation and use a stable local booking reference for details/labels.

#### 2) Stop reading `bookings` directly from the browser
Add a dedicated edge function for a **single booking lookup** scoped by the custom session (`x-prayog-auth`), for example:
- input: `booking_id` or `order_id`
- output: normalized booking row + partner/action metadata

Then update:
- `src/pages/OrderDetails.tsx`
- `src/pages/Tracking.tsx`

to use that edge function instead of `supabase.from('bookings')...`.

This removes the RLS mismatch caused by the non-Supabase login system.

#### 3) Use booking UUID for the Details route
Update `src/pages/History.tsx` so the Details button navigates with the local booking id (already available as `_localBookingId`) instead of the external order id string.

Then update `OrderDetails.tsx` to load by booking id through the new edge function. This makes the details page deterministic and avoids ambiguous lookups.

#### 4) Fix cancel order end-to-end
Update:
- `supabase/functions/get-user-orders/index.ts`
- `src/pages/History.tsx`
- `src/pages/OrderDetails.tsx`

so cancellation always receives:
- `booking_id`
- `booking_source`
- `awb` = `prayog_awb || tracking_id`

That will fix Delhivery cancellation immediately. Shadowfax will continue using `client_order_id`.

#### 5) Add partner-aware label fetching
Create a small edge function for **label retrieval** scoped to the current user, for example:
- lookup booking by `booking_id`
- detect `booking_source`
- if `label_url` already exists, return it
- if `booking_source === 'delhivery_direct'`, invoke `delhivery-label` with AWB, persist `label_url` back to `bookings`, return it
- if `booking_source === 'shadowfax_direct'`, return stored `label_url` if present; if no direct label API is available in the current integration, return a clear “label unavailable for this courier” response instead of a dead button

Then wire both:
- History label button
- Order Details label button

to use this function instead of only trusting the cached `label_url`.

#### 6) Keep tracking routed through partner APIs
Update `src/pages/Tracking.tsx` to:
- use route state first when coming from History/Details
- otherwise fetch booking meta through the new booking-detail lookup edge function
- invoke `shadowfax-tracking` or `delhivery-tracking` based on `booking_source`

That keeps tracking aligned with the same row that History is showing.

#### 7) Finish the last auth cleanup in these flows
Replace remaining raw `localStorage.getItem('prayog_auth')` usage in booking/payment/history action paths with the shared auth helper so these flows no longer depend on the legacy key surviving forever.

### Files likely touched
- `src/pages/History.tsx`
- `src/pages/OrderDetails.tsx`
- `src/pages/Tracking.tsx`
- `src/pages/Booking.tsx`
- `src/components/PaymentModal.tsx`
- `src/lib/auth.ts` or a shared request helper
- `supabase/functions/get-user-orders/index.ts`
- new edge function for single-booking lookup
- new edge function for partner-aware label retrieval

### Technical details
```text
History list
  -> get-user-orders
     -> returns display data + booking action meta

Details page
  -> get-user-booking-detail(booking_id)
     -> normalized booking row
     -> load cancel/track/label actions from same source

Label button
  -> get-booking-label(booking_id)
     -> stored label_url OR fetch from partner API OR clear unsupported response

Cancel button
  -> useCancelOrder
     -> Shadowfax: client_order_id
     -> Delhivery: waybill from prayog_awb/tracking_id
```

### Verification
1. Place a new Delhivery booking.
2. Open History:
   - order appears
   - Details opens successfully
   - Cancel opens and succeeds
   - Label downloads successfully
   - Track opens the correct shipment
3. Refresh History:
   - label button still works from persisted `label_url`
   - cancelled status is reflected
4. Repeat with Shadowfax:
   - Details works
   - Cancel works
   - Track works
   - Label either works from stored URL or shows a clean unsupported state instead of failing
