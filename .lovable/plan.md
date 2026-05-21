## Goal

Add a Refresh button to the "Order Status Overview" card on `/admin/dashboard`. Clicking it pulls the latest tracking from each partner for every active (non-terminal) order and updates `bookings.status` in the DB, so the bucket counts reflect reality.

## What to build

### 1. New edge function: `admin-refresh-order-statuses`

`supabase/functions/admin-refresh-order-statuses/index.ts`

- POST, CORS + `x-environment` header forwarded.
- Auth: require caller is an admin. Use the user's JWT to look up `admin_users.is_active` via service-role client; reject otherwise.
- Body (optional): `{ booking_ids?: string[], limit?: number }`. Default behaviour: select all `bookings` whose `status` bucket is NOT in `{delivered, cancelled, rto}` and that have a `prayog_awb` or `tracking_id`, limit 200, ordered newest first.
- For each booking, look up the partner tracking function by `booking_source` using the same map as `OrderMonitoring.tsx`:
  - `shadowfax_direct` → `shadowfax-tracking`
  - `delhivery_direct` → `delhivery-tracking`
  - `urbanebolt_direct` → `urbanebolt-tracking`
  - `xpressbees_direct` → `xpressbees-tracking`
  - `shree_maruti_direct` → `shree-maruti-tracking`
  - Skip `prayog`-sourced bookings (no direct tracking fn) — return as `skipped`.
- Invoke the tracking function with `{ waybill, awb, client_request_id, order_id }`. Throttle with a small concurrency limiter (e.g. 5 parallel) to avoid hammering partner APIs.
- From the response take `statuses[0]` (already sorted newest-first by each tracking fn). Derive new status text = `statuses[0].subcategory || statuses[0].status || category`.
- Compare bucket of new vs old via shared status mapping. Update `bookings.status` only when the text actually changes. Use service role.
- Return `{ checked, updated, skipped, errors: [{id, reason}] }`.

Note: bucket-mapping logic must match `src/lib/booking-status.ts`. Duplicate the small `bucketOfStatus` function in `supabase/functions/_shared/booking-status.ts` and import from both places later if convenient; for this change, inline a copy inside the edge function to avoid touching the frontend module.

### 2. UI change: `src/pages/admin/AdminDashboard.tsx`

In the "Order Status Overview" `CardHeader` (around line 272):
- Wrap title + a Refresh button in a flex row.
- Button uses existing `RefreshCw` icon (already imported) with `animate-spin` when loading.
- Handler `refreshStatuses()`:
  - calls `supabase.functions.invoke("admin-refresh-order-statuses", { body: {}, headers: { "x-environment": CURRENT_ENV } })`
  - on success toast: `Refreshed N orders, M updated` (skips/errors shown as muted detail).
  - on done, call existing `fetchDashboardData()` to repaint counts.
- Local `refreshing` state separate from `loading`.

No changes to existing single-order tracking flow in `OrderMonitoring.tsx`.

## Out of scope

- Realtime push of tracking updates (still polled-on-click).
- Backfilling history of status changes.
- Touching Prayog-sourced orders (no direct tracking fn available).

## Files

- New: `supabase/functions/admin-refresh-order-statuses/index.ts`
- Edited: `src/pages/admin/AdminDashboard.tsx`
