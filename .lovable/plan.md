## Goal
Let admins see where users drop off in the 6-step booking flow — per-user (in User Management) and in aggregate (funnel dashboard).

## Approach
Persist the furthest step each user reaches as they progress. If they later complete a booking, mark the session as completed; otherwise it's an "abandoned" session.

## Database
New table `public.booking_progress`:
- `user_id` (uuid)
- `session_id` (uuid) — one per booking attempt, generated on Step 1 entry
- `last_step` (int 1–6)
- `last_step_name` (text, e.g. "Address", "Parcel", "Courier", "Review", "Payment", "Confirmation")
- `completed` (bool, default false) — flipped true when booking row is created
- `booking_id` (uuid, nullable) — links to `bookings.id` when completed
- `started_at`, `updated_at`
- Index on `(user_id, updated_at desc)` and `(completed, last_step)`

RLS: users can insert/update their own rows; admins (via `is_admin`/`is_operations`) can select all.
Grants: authenticated (insert/update/select own), service_role (all).

## Frontend wiring
In `src/pages/Booking.tsx`:
- On mount of Step 1, generate `session_id` (stored in component state + localStorage for resume).
- On each step change, upsert `{user_id, session_id, last_step, last_step_name}` to `booking_progress` (fire-and-forget; no UI blocking).
- After successful booking creation (existing success path), update the row: `completed=true, booking_id=<new id>`.

## Admin UI
1. **User detail page** (User Management) — new "Booking Activity" section:
   - Table of recent sessions: started_at, last step reached, status (Completed / Abandoned at Step X), linked booking if completed.
2. **New funnel dashboard** at `/admin/abandonment` (linked from AdminLayout sidebar):
   - Bar chart: count of sessions whose furthest step = N, split by completed vs abandoned.
   - Filters: date range, last 7/30/90 days.
   - Summary cards: total sessions, completion rate, top drop-off step.

## Files to add/change
- Migration: create `booking_progress` table + policies + grants.
- `src/pages/Booking.tsx` — session id + step upsert + completion update.
- `src/pages/admin/UserManagement.tsx` (or `AdminUserManagement.tsx`) — Booking Activity section.
- `src/pages/admin/AbandonmentFunnel.tsx` — new page.
- `src/components/admin/AdminLayout.tsx` — sidebar link.
- `src/App.tsx` — route for the new admin page.

## Out of scope
- Saving the actual draft form data (addresses, parcel details) — only step number is tracked.
- Event-level funnel (entry/exit per step).
