

## Fix: Delhivery delivery address shows "VIASETUPRIVATELIMIT C2C"

### Root cause

Delhivery's dashboard "Delivery Address" panel renders the `seller_*` fields from the shipment payload, not the `return_*` fields. Our current `delhivery-booking` function sends `seller_name: warehouse` ("VIASETUPRIVATELIMIT C2C") and an empty `seller_add`, which is exactly what shows up on the portal screenshot.

The `return_*` fields (which already carry the correct receiver address) drive RVP routing/billing but not the address card displayed in the Delhivery UI.

### Change

Single-file edit in `supabase/functions/delhivery-booking/index.ts`:

Replace the seller block in the shipment payload so it carries the **receiver** (end-delivery) details:

```text
seller_name    →  receiver_name
seller_add     →  receiver_address
seller_pin     →  receiver_pincode      (new key)
seller_city    →  receiver_city         (new key)
seller_state   →  receiver_state        (new key)
seller_country →  "India"               (new key)
seller_gst_tin →  ""                    (unchanged)
seller_inv     →  ""                    (unchanged)
```

`pickup_location.name` stays as the registered warehouse — required for RVP billing/account routing. The `return_*` block also stays unchanged. Only the seller card (which Delhivery surfaces as "Delivery Address" in the portal) is corrected.

Update the file's header comment to document the corrected convention so future edits don't regress this.

### Files changed

```text
EDIT  supabase/functions/delhivery-booking/index.ts   (seller_* now carry receiver address)
```

No frontend changes, no DB changes, no new secrets.

### Expected result

New Delhivery bookings will show the actual end-customer name + address in the Delhivery portal's "Delivery Address" panel instead of "VIASETUPRIVATELIMIT C2C". Existing bookings already created cannot be re-rendered — only new ones are affected.

### Verification

After deploy, place a fresh test booking via Delhivery and confirm the portal's Delivery Address card shows the receiver's name, street, pincode, city, state. We'll also tail the `delhivery-booking` edge function logs to confirm the outgoing payload contains the receiver in the `seller_*` keys.

