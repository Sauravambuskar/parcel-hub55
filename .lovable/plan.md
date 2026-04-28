## Problem

1. **401 Unauthorized on save-booking** — Booking succeeded at Urbanebolt but the row never saved to `bookings`, so it's missing from /history.
   - Root cause: After the recent auth migration, sessions are stored under `auth_session` (see `src/lib/auth.ts`). `Booking.tsx` still reads only the legacy `prayog_auth` key in 7 places. For new logins that key is empty, so no `x-prayog-auth` header is sent → `save-booking` rejects with 401.

2. **Failed/cancelled orders disappear** — Today, if any step throws (partner API error, parser mismatch, refund path, etc.) the code returns early without inserting a row. The user wants every attempt persisted with a clear status + reason so History is the single source of truth.

## Fix

### 1. Use the unified auth key everywhere in Booking.tsx
Replace all 7 `localStorage.getItem('prayog_auth')` calls with the unified lookup already used at line 97:
```ts
localStorage.getItem('auth_session') || localStorage.getItem('prayog_auth')
```
Extract into a tiny local helper at the top of the component to avoid repetition. This immediately fixes the 401 and the missing-from-history symptom for every partner (Urbanebolt, Shadowfax, Delhivery, XpressBees) and for the refund fallback.

### 2. Always log every booking attempt to history
Add new fields to `bookings` (migration):
- `failure_reason text` — human-readable reason (e.g. "Urbanebolt manifest failed: AWB not returned", "User cancelled at payment", "Pickup partner unreachable")
- `failure_step text` — which step failed (`payment`, `manifest`, `label`, `cancel`, etc.)
- Extend `status` usage with: `CREATED`, `BOOKING_FAILED`, `CANCELLED`, `REFUNDED`, `PAYMENT_FAILED`

Wrap the booking flow in `Booking.tsx › handlePaymentSuccess` so that **every exit path** writes a row via `save-booking` before returning:
- Partner API success → status `CREATED` (existing behaviour)
- Partner API returned no AWB / non-2xx → status `BOOKING_FAILED` + `failure_reason` from the partner response, then trigger refund
- Outer catch (unexpected error) → status `BOOKING_FAILED` + `failure_reason` = error message, then trigger refund
- Refund completed → update same row to `REFUNDED` (idempotent on `payment_id`, already supported by `save-booking`)
- User cancellation via `urbanebolt-cancel-order` etc. → update row to `CANCELLED` with reason

`save-booking` is already idempotent on `payment_id`, so writing early then updating later is safe.

### 3. Surface failure reason in History UI
- `get-user-orders/index.ts`: include `failure_reason` and `failure_step` in the normalized order object (under `_booking` and a top-level `statusReason`).
- `src/pages/History.tsx` + order card: when `status` is `BOOKING_FAILED`, `CANCELLED`, `REFUNDED`, or `PAYMENT_FAILED`, render a red/amber badge plus a one-line reason underneath the AWB area. Successful orders look unchanged.

### 4. Backfill the orphan AWB
The earlier successful Urbanebolt manifest (`AWB 200001021145`) exists at the courier but not in our DB. Insert one row via the data tool with status `CREATED`, the captured AWB + label URL, and `failure_reason = 'Backfilled — manifest succeeded but legacy parser returned failure'` so it shows up in History.

## Files touched

- `src/pages/Booking.tsx` — unified auth lookup helper; ensure every exit path calls `save-booking`
- `supabase/functions/save-booking/index.ts` — accept and persist `failure_reason`, `failure_step` (no schema-checking, just pass-through)
- `supabase/functions/get-user-orders/index.ts` — expose new fields
- `src/pages/History.tsx` (and the order card it renders) — show status badge + reason for non-successful rows
- New migration: add `failure_reason` and `failure_step` columns to `bookings`
- Data insert: backfill the orphan Urbanebolt AWB

## Out of scope

- No changes to RLS (existing policies on `bookings` are fine; service-role insert via `save-booking` continues to be the write path).
- No changes to the partner edge functions themselves — the booking flow already captures their responses; we just persist them.
