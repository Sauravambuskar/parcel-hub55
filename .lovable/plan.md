## Goal

Run a final end-to-end validation pass on all 5 logistics integrations — **Delhivery, XpressBees, UrbaneBolt, Shadowfax, Shree Maruti** — confirm each functional surface works, and produce a partner-by-partner readiness report. Fix any bugs found along the way.

## Scope of validation

Five surfaces × five partners = 25 checkpoints:

| Surface | What we verify |
|---|---|
| Serviceability | Pincode coverage call returns success/unavailability with reason, surfaces in BookingStep2 |
| Rate / pricing | Partner appears in SmartRanking with correct price, GST, hidden platform fee |
| Booking | Order creation succeeds, AWB stored, `booking_source` set correctly, label URL captured |
| Label | Download via `get-booking-label` returns a valid URL/PDF for that partner |
| Tracking | `Tracking.tsx` routes the AWB to the correct partner function and returns mapped status |
| Cancellation + refund | `useCancelOrder` branch fires, friendly errors for non-cancellable states, Razorpay refund triggers when paid |

## Validation method

For each partner, in order:

1. **Static review** — read the partner's edge function set and confirm CORS, `x-prayog-auth` user gate, `x-environment` switch, and service-role writes match the project conventions.
2. **Frontend wiring** — confirm partner ID exists in `Booking.tsx` submit branches, `OrderDetails.tsx` label allow-list, `Tracking.tsx` router, `useCancelOrder.ts` branch, `partnerLogos.ts`, and `BookingStep2.tsx` serviceability fan-out.
3. **Live function probe** — using `supabase--curl_edge_functions`, hit each partner's serviceability endpoint with a known-good Indian pincode pair (e.g. 110001 → 400001) and confirm a 200 response shape.
4. **Recent-traffic check** — pull last 50 log lines for booking + label + cancel functions via `supabase--edge_function_logs` to look for unhandled errors, 500s, or auth refresh loops.
5. **DB sanity** — for the most recent real booking per partner, query `bookings` to confirm `prayog_awb`, `label_url`, `booking_source`, `status`, `payment_status` are populated correctly.

## Issues already known and addressed in this session

- Shree Maruti label parser (handles array-of-objects response)
- Shree Maruti cancel: friendly error mapping for `READY_FOR_DISPATCH`, `PICKED_UP`, `DELIVERED`, etc. (just shipped)

We will extend the same friendly-error mapping pattern to **Delhivery, XpressBees, UrbaneBolt, Shadowfax** cancel branches in `useCancelOrder.ts` if their upstream returns similar lifecycle-state rejections. This makes the experience consistent across partners.

## Deliverables

1. **Readiness matrix** — a 5×6 table posted in chat:

````text
Partner        | Service. | Rate | Booking | Label | Track | Cancel
---------------+----------+------+---------+-------+-------+--------
Delhivery      |   ✅     |  ✅  |   ✅    |  ✅   |  ✅   |  ✅
XpressBees     |   ✅     |  ✅  |   ✅    |  ✅   |  ✅   |  ✅
UrbaneBolt     |   ✅     |  ✅  |   ✅    |  ✅   |  ✅   |  ✅
Shadowfax      |   ✅     |  ✅  |   ✅    |  ✅   |  ✅   |  ✅
Shree Maruti   |   ✅     |  ✅  |   ✅    |  ✅   |  ✅   |  ✅
````

Each cell links to either a passing log line or a fix that was applied.

2. **Code fixes** for any gaps found. Likely candidates (will only ship if confirmed):
   - Unify lifecycle-state friendly error messages across all 4 other partners' cancel branches in `useCancelOrder.ts`.
   - Make sure `get-booking-label` falls back to `bookings.label_url` if a fresh fetch fails (graceful degradation).
   - Verify all five partners are present in `OrderDetails.tsx` cancel-button visibility logic.

3. **Summary note** — a short go/no-go verdict per partner with any caveats (e.g. "XpressBees sandbox returns rate but prod credentials needed for booking").

## Out of scope

- New features (no new partners, no manifest/DRS, no webhook receivers).
- Visual redesigns.
- Database schema changes — read-only queries only.

## Files I expect to touch (only if fixes needed)

- `src/hooks/useCancelOrder.ts` — extend friendly-error mapping
- `src/pages/OrderDetails.tsx` — confirm cancel-button gating
- `supabase/functions/get-booking-label/index.ts` — graceful fallback (only if a partner regression is found)

No edge-function logic rewrites planned unless live probes uncover a real bug.
