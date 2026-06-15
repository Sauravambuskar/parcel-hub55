
# Universal AWB Tracking (3rd-party orders)

Today `/tracking` only works for AWBs that exist in our `bookings` table. This plan adds a fallback path: when no booking is found, fan out the AWB to all 5 partner tracking edge functions in parallel and show whichever returns valid data. Publicly accessible, no login required.

## Scope

- One file edited: `src/pages/Tracking.tsx`
- One small edge-function tweak: ensure each partner tracking function returns a consistent "not found" signal instead of a 500.
- No DB changes, no new tables, no auth changes.

## Behavior

1. User enters AWB on `/tracking` (route already public).
2. We still try `get-booking-detail` first **only if the user is logged in** — keeps the existing rich behavior (cancellation overlay, address merge, refund state) for our own orders.
3. If no booking match (or user is logged out), enter **Universal mode**:
   - Call all 5 partner tracking edge functions in parallel via `Promise.allSettled`:
     `delhivery-tracking`, `urbanebolt-tracking`, `shree-maruti-tracking`, `xpressbees-tracking`, `shadowfax-tracking`.
   - Each call passes `{ waybill: awb }` and `x-environment: CURRENT_ENV`.
   - A response counts as a **hit** when `statuses` is a non-empty array. Anything else (error, `{error:...}`, empty statuses) is a miss.
4. Render outcomes:
   - **1 hit** → show tracking, with a small badge "Tracked via <Partner>" and a note "This AWB was not booked through ViaSetu — data shown directly from <Partner>."
   - **0 hits** → friendly empty state: "We couldn't find this AWB on any of our partner networks (Delhivery, XpressBees, Shadowfax, Shree Maruti, Urbanebolt). Double-check the number, or contact the courier directly." List the 5 checked partners.
   - **>1 hits** (unlikely, AWB collision) → show a chooser: "We found this AWB on multiple networks. Which courier did you ship with?" — clicking a card renders that partner's data.

## Caveat banner (always shown in universal mode)

A muted info banner under the AWB input:
> "XpressBees and Shadowfax only return data for shipments on ViaSetu's account. Tracking for those carriers placed elsewhere won't be found here."

## Technical details

### `src/pages/Tracking.tsx`

- Refactor `fetchTrackingData(awb)`:
  1. Skip the `get-booking-detail` block entirely when `getAuthSession()` is null.
  2. Keep the existing partner-by-`booking_source` routing when a booking row is found.
  3. New `else` branch (replaces today's "Tracking Unavailable" toast) calls a new helper `tryUniversalTracking(awb)`.
- New helper `tryUniversalTracking(awb)`:
  ```ts
  const partners = [
    { key: 'delhivery',    fn: 'delhivery-tracking',    body: { waybill: awb } },
    { key: 'urbanebolt',   fn: 'urbanebolt-tracking',   body: { waybill: awb } },
    { key: 'shree_maruti', fn: 'shree-maruti-tracking', body: { waybill: awb, order_id: awb } },
    { key: 'xpressbees',   fn: 'xpressbees-tracking',   body: { waybill: awb } },
    { key: 'shadowfax',    fn: 'shadowfax-tracking',    body: { client_request_id: awb, awb, order_id: awb } },
  ];
  const results = await Promise.allSettled(
    partners.map(p => supabase.functions.invoke(p.fn, { body: p.body, headers: { 'x-environment': CURRENT_ENV } }))
  );
  // Map to { partner, data } where data?.statuses?.length > 0
  ```
- New state: `universalCandidates: Array<{ partner: string; data: TrackingData }>` and `universalNoMatch: boolean`.
- New tiny render branches for the 0-hit empty state and >1-hit chooser; reuse existing tracking-detail JSX for the 1-hit case.
- Add `<PageSeo title="Track Any Parcel — Delhivery, XpressBees, Shadowfax, Shree Maruti, Urbanebolt | ViaSetu" />` already exists; tweak description to mention 3rd-party support.

### Partner edge function consistency check

Verify each tracking function returns HTTP 200 with `{ statuses: [], error?: 'not_found' }` (or equivalent) for unknown AWBs, instead of 4xx/5xx — otherwise `Promise.allSettled` works but the failed entries are noisier and we can't distinguish "AWB not on this network" from "partner API down". If any function currently throws on unknown AWB, wrap the upstream call so it resolves to `{ statuses: [] }`. Touch only what's needed; do not change response shape on success.

### Public access

- `/tracking` is already in the public route table (no auth guard). No router changes needed.
- The 5 partner tracking edge functions are already `verify_jwt = false` (or invoked with anon key) — confirm in `supabase/config.toml` and only adjust if a function currently requires auth.

## Out of scope

- AWB-format auto-detection (regex per carrier). Skipped — fan-out is simpler and the user already chose it.
- Caching tracking results. Not needed for a manual lookup feature.
- Tracking history / save-to-account for logged-in users.
- Admin analytics on universal-tracking lookups.

## Risks

- **API quota**: every public lookup hits 5 partner APIs. Low risk for now (manual UI, no automation), but worth monitoring after launch.
- **False positives on AWB collision**: handled by the >1-hit chooser.
- **Partner API auth scope**: XpressBees/Shadowfax will almost always return empty for 3rd-party AWBs — the caveat banner sets expectations.
