

## Fix: Align Delhivery payload with the official `cmu/create.json` spec

### What I verified against the official docs

Sources: `delhivery-express-api-doc.readme.io/reference/order-creation-api` and `/reverse-pickups`, plus the Delhivery One help center.

Authoritative rules for `POST /api/cmu/create.json`:

1. **RVP convention** (verbatim from docs):
   - `payment_mode = "Pickup"`
   - Shipment-level `name / add / pin / city / state / phone` = **end customer** (pickup point)
   - `return_name / return_add / return_pin / return_city / return_state / return_phone` = **delivery destination** (where the package goes)
   - "If you are passing the return keys then shipment will be delivered to return address."
2. **`pickup_location.name`** = a registered warehouse, **case-sensitive exact match** — billing/account anchor only.
3. **`seller_*` fields are GST/invoice fields**, not address rendering fields. Documented seller keys: `seller_name`, `seller_add`, `seller_inv`, `seller_gst_tin`. They represent the **contracting seller entity** (us, ViaSetu) — not the consignee.
4. **Undocumented keys we invented**: `return_address`, `return_pincode`, `return_contact`. These are not part of the cmu spec and are silently ignored.

### What's wrong in our current payload

In `supabase/functions/delhivery-booking/index.ts`:

- `seller_name`, `seller_add`, `seller_pin`, `seller_city`, `seller_state` are set to the **receiver** (delivery) address. This pollutes the seller/GST identity on the shipment record. The Delhivery portal's address cards read these for the "Seller / Sold By" section, which is exactly why the screenshot shows the receiver address mislabeled, and earlier showed the warehouse name.
- `return_address`, `return_pincode`, `return_contact` are non-spec keys that do nothing.
- The previous "warehouse showing" issue happened because seller fields had been set to the warehouse string. We over-corrected by stuffing the receiver in there. **Both extremes are wrong** — `seller_*` should be the ViaSetu contracting entity (or empty), and the receiver should live exclusively in `return_*`.

### The correct payload

```text
shipments[0]:
  // PICKUP point = end customer
  name, add, pin, city, state, country, phone   <-  sender_*  (end customer)
  payment_mode: "Pickup"

  // DELIVERY point = receiver (canonical RVP spec)
  return_name, return_add, return_pin,
  return_city, return_state, return_country,
  return_phone                                  <-  receiver_*

  // Seller (GST / contracting entity) — leave blank or set to ViaSetu
  seller_name: ""        (or "ViaSetu")
  seller_add:  ""
  seller_inv:  ""
  seller_gst_tin: ""
  // Drop seller_pin / seller_city / seller_state / seller_country entirely —
  // they are not part of the documented seller block.

  // Drop the invented return_address / return_pincode / return_contact keys.

  hsn_code, products_desc, weight, dimensions, etc.  (unchanged)

pickup_location:
  name: <registered warehouse, exact case>      (unchanged)
```

### Edit

Single-file change in `supabase/functions/delhivery-booking/index.ts`:

1. Remove `return_address`, `return_pincode`, `return_contact` (non-spec).
2. Set `seller_name = ""`, `seller_add = ""`, drop `seller_pin / seller_city / seller_state / seller_country`. Keep `seller_inv: ""` and `seller_gst_tin: ""` as documented blanks.
3. Keep all `name/add/pin/city/state/phone` as sender (end customer) and all `return_*` as receiver — these are already correct.
4. Update the file's header comment to reflect the spec-correct convention so this doesn't regress.

No other files, no DB changes, no new secrets, no frontend changes.

### Expected portal behaviour after fix

- "Pickup Address" card → end-customer details (correct).
- "Delivery / Return Address" card → receiver details (correct, driven by `return_*`).
- "Seller / Sold By" card → blank (or ViaSetu), no longer leaking the receiver or warehouse name.

### Verification

After redeploy, place one fresh test booking via Delhivery and confirm in the Delhivery One portal:
- Pickup card shows the customer
- Return/Delivery card shows the receiver
- Seller card is blank/ViaSetu, not the warehouse and not the receiver

We'll also tail `delhivery-booking` edge logs to confirm the outgoing JSON matches the spec above.

