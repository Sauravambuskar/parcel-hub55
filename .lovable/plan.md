

## Plan: Order Cancellation + Tracking/Status Validation

### Overview
Add a "Cancel Order" feature for customers on both Prayog and Shadowfax orders, with proper API integration. Also validate tracking/status flows for both sources.

### Step 1: Edge Function — `shadowfax-cancel-order`

**File:** `supabase/functions/shadowfax-cancel-order/index.ts`

- Calls Shadowfax Cancel API: `POST /api/v3/clients/orders/cancel/`
- Auth: `Token <SHADOWFAX_TOKEN>` header
- Payload: `{ client_order_id, cancel_remarks }` (valid remarks: "Cancelled By Customer", "Incorrect/ Incomplete contact info", "Payment Issue")
- Cancellation constraint: order must NOT be in `Out For Pickup`, `Picked`, or `Cancelled` status
- Returns normalized response: `{ success, message }`
- On success: update bookings table status to `CANCELLED`, initiate auto-refund via `razorpay-refund` if payment was collected

### Step 2: Edge Function — `prayog-cancel-order`

**File:** `supabase/functions/prayog-cancel-order/index.ts`

- Calls Prayog cancel API: `DELETE /gateway/booking-service/orders/{orderId}` (or the appropriate Prayog cancellation endpoint — needs to be confirmed from existing Prayog API patterns)
- Auth: Bearer token from request body (passed from frontend)
- Returns normalized response: `{ success, message }`
- On success: update bookings table, initiate auto-refund

### Step 3: Frontend — Cancel Button on Order Details Page

**File:** `src/pages/OrderDetails.tsx`

- Add a "Cancel Order" button (red/destructive variant) visible only when order status allows cancellation (not `Delivered`, `Cancelled`, `Picked`, `Out For Pickup`, `FAILED`)
- On click: show confirmation dialog with cancellation reason picker (dropdown with 3 options: "Cancelled By Customer", "Incorrect/ Incomplete contact info", "Payment Issue")
- On confirm:
  1. Check `booking_source` from bookings table
  2. If `shadowfax_direct`: call `shadowfax-cancel-order` edge function
  3. If `prayog`: call `prayog-cancel-order` edge function
  4. On success: show success toast, update local order status, initiate refund flow
  5. On failure: show error toast with reason (e.g., "Order cannot be cancelled at this stage")

### Step 4: Frontend — Cancel Button on History Page

**File:** `src/pages/History.tsx`

- Add a small "Cancel" button on each order card (only for cancellable statuses: `CREATED`, `BOOKED`, `New`, `Assigned`)
- Uses same cancellation flow as OrderDetails but with a quick-action confirmation dialog

### Step 5: Tracking Status Validation

**File:** `supabase/functions/shadowfax-tracking/index.ts`

- Add missing Shadowfax statuses to STATUS_MAP: `New`, `Assigned`, `Out For Pickup`, `Not Contactable`, `Not Attempted`, `Cid`, `QC Failed`, `On Hold`, `Lost`, `Undelivered`, `Item added to Bag`, `Bag In Transit`, `Bag Received`, `Return to Seller initiated`, `Return Shipment Out for Delivery`, `Received at Return DC`, `Received at RTS destination hub`
- Ensure all statuses map to appropriate app categories

**File:** `src/pages/Tracking.tsx`

- Validate that both Prayog and Shadowfax tracking data renders correctly with the existing UI
- Add `CANCELLED` status color handling (already present)
- Add cancel button on tracking page too (if order is in cancellable state)

### Step 6: Config Update

**File:** `supabase/config.toml`

- Add entries for the 2 new edge functions with `verify_jwt = false`

### Technical Details

- Shadowfax Cancel API: `POST https://dale.shadowfax.in/api/v3/clients/orders/cancel/` with JSON `{ client_order_id: "...", cancel_remarks: "Cancelled By Customer" }`
- Cancellation is only allowed before `Out For Pickup` / `Picked` / `Cancelled` status
- Auto-refund is triggered on successful cancellation if `payment_id` exists in bookings table
- Valid cancellation remarks for Shadowfax: "Cancelled By Customer", "Incorrect/ Incomplete contact info", "Payment Issue"

### Files Changed
1. `supabase/functions/shadowfax-cancel-order/index.ts` (new)
2. `supabase/functions/prayog-cancel-order/index.ts` (new)  
3. `supabase/functions/shadowfax-tracking/index.ts` (edit — add missing statuses)
4. `src/pages/OrderDetails.tsx` (edit — add cancel button + dialog)
5. `src/pages/History.tsx` (edit — add cancel action)
6. `src/pages/Tracking.tsx` (edit — add cancel button)
7. `supabase/config.toml` (edit — add new function entries)

