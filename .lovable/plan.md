## Goal

The current XpressBees edge functions hit the wrong endpoints (`/api/shipments2`, `/api/shipments2/cancel`, `/api/shipments2/track/...`) and use a non-conforming payload. The official franchise API doc you shared uses different URLs and a different schema. We will align every XpressBees function to the doc exactly.

## Endpoints (per doc)

All endpoints sit on `https://ship.xpressbees.com`.

| Purpose          | Method | URL                                                  |
|------------------|--------|------------------------------------------------------|
| Login            | POST   | `/api/users/franchise_login`                         |
| Courier list     | GET    | `/api/franchise/shipments/courier`                   |
| Create shipment  | POST   | `/api/franchise/shipments`                           |
| Cancel shipment  | POST   | `/api/franchise/shipments/cancel_shipment`           |
| Track shipment   | POST   | `/api/franchise/shipments/track_shipment`            |
| Pickup manifest  | POST   | `/api/franchise/shipments/manifest` (body `{ awb_numbers }`) |
| Rate calculator  | POST   | `/api/franchise/shipments/courier_serviceability`    |
| NDR list / create| GET/POST | `/api/franchise/ndr` , `/api/franchise/ndr/create` |

Login + auth header (`Bearer <token>` from `data` field) stay as already implemented.

## Create-shipment payload (per doc, flat object)

```json
{
  "id": "<order id, ≤20 chars>",
  "unique_order_number": "yes",
  "payment_method": "prepaid",        // doc uses "payment_method", not "payment_type"
  "consigner_name": "...", "consigner_phone": "10-digit",
  "consigner_pincode": "6-digit", "consigner_city": "...", "consigner_state": "...",
  "consigner_address": "...",
  "consignee_name": "...", "consignee_phone": "10-digit",
  "consignee_pincode": "6-digit", "consignee_city": "...", "consignee_state": "...",
  "consignee_address": "...",
  "products": [
    { "product_name": "...", "product_qty": "1", "product_price": "<amount>",
      "product_sku": "<order id>" }
  ],
  "invoice": [
    { "invoice_number": "<order id>", "invoice_date": "YYYY-MM-DD" }
  ],
  "weight": "<grams>", "length": "<cm>", "breadth": "<cm>", "height": "<cm>",
  "courier_id": "01" /* B2C Air */ | "02" /* B2C surface */,
  "pickup_location": "customer",       // since pickup is from sender, not franchise warehouse
  "shipping_charges": "0",
  "cod_charges": "0",
  "discount": "0",
  "order_amount": "<total>",
  "collectable_amount": "0"            // prepaid → 0
}
```

Success response uses `response: true` and returns `awb_number` + `label` URL — we already parse those.

## Files to change

### 1. `supabase/functions/_shared/xpressbees-auth.ts`
- Keep base host `https://ship.xpressbees.com` and login at `/api/users/franchise_login` with `{ email, password }`. (Already correct.) No further changes.

### 2. `supabase/functions/xpressbees-booking/index.ts`
- Change endpoint from `/api/shipments2` to `/api/franchise/shipments`.
- Replace payload with the flat franchise schema above (consigner_/consignee_ fields, `products[]`, `invoice[]`, `payment_method`, `pickup_location: "customer"`, `weight` in grams as string, dimensions as strings).
- Update courier-id defaults: Air = `"01"`, Surface = `"02"` (per doc, not `"1"`/`"2"`).
- Truncate `id` to 20 chars (doc max).
- Parse response: success when `result.response === true`; pull `awb_number` and `label`.

### 3. `supabase/functions/xpressbees-cancel-order/index.ts`
- Change endpoint from `/api/shipments2/cancel` to `/api/franchise/shipments/cancel_shipment`.
- Body: `{ "awb_number": "<awb>" }` (not `{ awb, reason }`).
- Treat success when `result.response === true`. Keep existing booking-update + Razorpay refund flow.

### 4. `supabase/functions/xpressbees-tracking/index.ts`
- Change from `GET /api/shipments2/track/{awb}` to `POST /api/franchise/shipments/track_shipment` with body `{ "awb_number": "<awb>" }`.
- Response shape is `{ response, message, tracking_data: { delivered: [...], "out for delivery": [...], "in transit": [...], "pending pickup": [...] } }` — flatten all bucket arrays into a single history list, sort by `event_time` (epoch seconds), then map to the existing `TrackingData` shape using `status_code` / `message` / `location` / `ship_status`.

### 5. `supabase/functions/xpressbees-label/index.ts` (verify)
- The doc has no separate "fetch label" endpoint — the label URL comes back inside the create-shipment response (`label` field). Update label fetcher to read the stored `label_url` from the booking row instead of calling XpressBees. (Will inspect file in build mode and align if needed.)

### 6. `supabase/functions/xpressbees-serviceability/index.ts` (optional, follow-up)
- Currently uses seeded pincode table + in-code rate card. The doc exposes `POST /api/franchise/shipments/courier_serviceability` for live rates. We will keep the local seeded-pincode coverage check (faster) but optionally swap the price calculation to the live API. **Out of scope for this fix unless you want it now.**

## Out of scope (ask before doing)
- Hooking up `GET /api/franchise/shipments/courier` (we already hardcode `01`/`02`).
- Pickup manifest generation (`/manifest`).
- NDR list / create endpoints.
- Live courier_serviceability quote.

If you want any of these wired up too, say so and I'll add them in the same change.

## Validation
After deploy, retry the booking that just failed. Expected log line:
```
[xpressbees-booking] response 200 {"response":true,"message":"booked","shipping_id":...,"awb_number":"...","label":"https://xb-files..."}
```
