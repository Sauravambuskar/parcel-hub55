# Fix order status counts in admin

## Problem

The stat tiles in **Order Monitoring** show `0` for In Transit, Pending, and Delivered even though 25 orders exist. The DB stores statuses with mixed casing and partner-native values like `Delivered`, `CANCELLED`, `READY_FOR_DISPATCH`, `Out for Pickup`, but the current code does strict equality checks like `b.status === "delivered"` / `=== "in_transit"`, so nothing matches.

The project already has a canonical bucketing helper (`src/lib/booking-status.ts → bucketOfStatus`) that normalizes any partner status into one of: `created`, `confirmed`, `picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `cancelled`, `rto`, `other`. We should route every status comparison through it.

## Changes

**`src/pages/admin/OrderMonitoring.tsx`**
- Import `bucketOfStatus` from `@/lib/booking-status`.
- Replace stat tiles with bucket-based counts:
  - **Total Orders** — all bookings (unchanged)
  - **In Transit** — buckets `confirmed` + `picked_up` + `in_transit` + `out_for_delivery` (everything moving but not yet delivered/cancelled)
  - **Pending** — bucket `created` (newly created, not yet manifested)
  - **Delivered** — bucket `delivered`
  - Add a 5th tile: **Cancelled** — bucket `cancelled` + `rto` (so the 8 CANCELLED + 4 FAILED orders are visible)
- Update the filter dropdown logic (`selectedFilter` for `pending` / `in_transit` / `delivered`) to use `bucketOfStatus` instead of string equality.
- Update the Active/Completed tabs and their `.filter(...)` row lists to use `bucketOfStatus(b.status) === "delivered"` for the "completed" side and everything-else for "active".
- Update `getStatusColor` to switch on the bucket so badges color correctly for any raw status string.

**`src/pages/admin/RevenueManagement.tsx`**
- Add a **Completed Orders** stat tile to `revenueStats` showing the count of bookings in this period whose bucket is `delivered`, so revenue monitoring also surfaces completion progress (placed between Total Collections and Pending COP Collection).
- Keep the existing revenue math unchanged (still based on `payment_status`, which is the correct signal for "money actually collected").

## Out of scope
- No DB/schema changes — statuses already exist as stored.
- No edge function changes.
- Not normalizing stored status values in the DB; bucketing at the read layer is enough and stays robust as new partner status strings appear.
