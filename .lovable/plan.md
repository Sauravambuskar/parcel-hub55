## Shadowfax integration — final plan (revised)

Apply the doc-conformance fixes for booking, cancel, and tracking. Keep serviceability fully local (Excel-seeded `shadowfax_pincodes` + in-code rate card — no live API call). Add AWB pre-generation and an in-house label generator so the user can download a shipping label.

### 1. Booking — `supabase/functions/shadowfax-booking/index.ts`

Two-step flow per the doc:

**Step A — Generate AWB**

- `POST {base}/api/v3/clients/orders/generate_awb/` with `{ "count": 1 }`
- Read `awb_numbers[0]` → use as both `client_request_id` (passed to order creation) and as our stored AWB.
- If this fails, return a clear error and do not proceed to step B.

**Step B — Create pickup request**

- `POST {base}/api/v3/clients/requests` (replaces the wrong `/api/v3/clients/orders/`).
- Body exactly per doc:
  - `client_order_number`: our `order_id` (≤100 chars).
  - `total_amount`: shipment value (incl. GST).
  - `price`: `round(total_amount / 1.18)` (excl. GST).
  - `eway_bill`: `""` (we send empty unless `total_amount > 50000`, then we'd need it from the user — out of scope for now).
  - `address_attributes` = pickup customer (sender):
  `{ address_line, city, country: "India", pincode (number), name, phone_number, alternate_contact: phone_number, latitude: "0", longitude: "0" }`.
  - `weight_details`: `{ actual_weight: round(weight_kg * 1000), volumetric_weight: round(L*B*H/5) }` (grams).
  - `seller_attributes` = drop seller (receiver):
  `{ name, address_line, city, email: "noreply@viasetu.com", pincode (string), phone, unique_code: "VIASETU" }`.
  - `skus_attributes`: `[{ name: goods_type || "Package", client_sku_id: order_id, price: shipment_value, brand: "ViaSetu", category: goods_type || "General", return_reason: "Reverse Pickup", qc_required: "false", hsn_code: "00000000", invoice_id: order_id }]`.
  - Optional: `client_request_id: <awb from step A>` so our AWB is used.
- Response success when HTTP 200 and `awb_number` present (also confirm `message: "Success"`).
- Return `{ success, awbNumber, clientRequestId, status, shadowfax_response }`.

### 2. Cancel — `supabase/functions/shadowfax-cancel-order/index.ts`

- URL → `POST {base}/api/v2/clients/requests/mark_cancel`.
- Body → `{ request_id: <stored AWB or client_order_id>, cancel_remarks: <validated> }`.
- Allowed `cancel_remarks` per doc: `Cancelled By Customer`, `Incorrect/ Incomplete contact info`, `Payment Issue`. Map any incoming reason to the closest one; default `Cancelled By Customer`.
- Success when HTTP 200 and `responseCode === 200`.
- Keep the existing booking-status update + Razorpay refund flow.

### 3. Tracking — `supabase/functions/shadowfax-tracking/index.ts`

- URL → `GET {base}/api/v4/clients/requests/{client_request_id}` (use stored AWB).
- Map response:
  - `pickup_request_state_histories[]` → `statuses[]`, each `{ status: state, location: current_location, statusTimestamp: Date.parse(created_at), event: comment, category/subcategory: from STATUS_MAP }`. Sort ascending by timestamp; the latest entry's `state` becomes the current status (also confirmed by top-level `status`).
  - `orderInformation`:
    - `cAwbNumber` / `trackingId` / `orderId` ← `awb_number`/`client_request_id`/`client_order_number`.
    - `sourceLocation` ← `address` (pickup customer block).
    - `destinationLocation` ← `seller` block.
    - `senderDetails` / `receiverDetails` mapped accordingly.
    - `bookingDate` ← `date_created` (epoch ms) or `created_at` of the first state.
    - `type: "REVERSE"`.
- Keep the existing client-side fallbacks in `Tracking.tsx` (booking row merging + cancellation override).

### 4. Serviceability — UNCHANGED

`supabase/functions/shadowfax-serviceability/index.ts` keeps the current behavior:

- Coverage from the seeded `shadowfax_pincodes` table (Excel-loaded by user).
- Pricing from the in-code RVP rate card with zone detection.
- No live Shadowfax API call.

### 5. Label download — NEW endpoint `supabase/functions/shadowfax-label/index.ts`

The Shadowfax Reverse Pickup API does NOT expose a shipping-label endpoint (the doc only has `/v1/clients/pod_details/`, which is a post-delivery proof-of-delivery image, not a label). So we generate the label ourselves.

- Edge function `shadowfax-label`:
  - Input: `{ booking_id }`.
  - Loads the booking row (sender, receiver, AWB, weight, dimensions, courier_name).
  - Renders an A6/A5 HTML label and returns it as a PDF (same approach as `delhivery-label`/`urbanebolt-label` — we'll follow whichever PDF technique those functions use; if they return HTML, we do the same and let the browser print).
  - Label content (matches our existing ViaSetu label conventions):
    - ViaSetu logo + "Shadowfax Reverse Pickup" partner badge.
    - AWB barcode (`bwip-js` or equivalent if already used by other label functions; otherwise render AWB as bold text + Code-128 SVG).
    - Sender block (pickup) and Receiver block (seller).
    - Weight + dimensions, order id, booking date.
    - "REVERSE PICKUP" watermark/badge so handlers know the direction.
- Frontend: in `OrderDetails.tsx` (and the History row action), enable the "Download Label" button for `booking_source === 'shadowfax'` (today it's likely hidden or disabled). On click, call `shadowfax-label` and download the returned PDF/HTML.

### 6. Files to change/add

- `supabase/functions/shadowfax-booking/index.ts` — full rewrite per §1.
- `supabase/functions/shadowfax-cancel-order/index.ts` — endpoint + body fix per §2.
- `supabase/functions/shadowfax-tracking/index.ts` — endpoint + response mapping per §3.
- `supabase/functions/shadowfax-label/index.ts` — NEW per §5.
- `src/pages/OrderDetails.tsx` (and label-download helper if shared) — enable Shadowfax label download.
- `src/pages/Tracking.tsx` — no change needed beyond what already merges booking data; verify the new `pickup_request_state_histories` mapping flows through cleanly.

### 7. Validation after deploy

- Place a fresh Shadowfax booking. Logs should show:
  1. `[shadowfax-booking] AWB generate response: {"message":"success","awb_numbers":["R..."]}`.
  2. `[shadowfax-booking] Order create response: {"awb_number":"R...","client_request_id":"R...","status":"New","message":"Success"}`.
- Open Order Details → click Download Label → PDF/HTML opens with the AWB and reverse-pickup sender→seller info.
- Open Tracking → timeline shows a "New" entry; status chips for pickup states render correctly.
- Cancel the order → `{"responseMsg":"Request has been marked as cancelled","responseCode":200}`; Razorpay refund triggers as today.

### 8. Out of scope (will not touch)

- Live `/v1/clients/serviceability/` API — stays local Excel-driven.
- Push callback/webhook handler.
- Bulk tracking, escalation, QC update, order-data update endpoints.
- POD details API (only useful after delivery, not for shipping labels).