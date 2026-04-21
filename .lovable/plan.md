

# Fix Order History Visibility + Strengthen Pincode Mismatch Prompt

## Issue 1 — Order History Shows Nothing

### Root causes
1. **History only reads from Prayog API.** `src/pages/History.tsx` (line 135) calls `GET /gateway/booking-service/orders?filterByCurrentUser=true` and renders only that response. Anything outside Prayog (Shadowfax-direct, future Delhivery-direct) is invisible.
2. **Local Supabase bookings are unreadable from the client.** The `bookings` table RLS uses `auth.uid() = user_id`, but the app uses Prayog OTP auth — there is no Supabase auth session, so `auth.uid()` is `null` and the client query at History.tsx line 158 always returns `[]`. Currently `bookings` table has **0 rows** in the database — combined with the RLS issue, even if Shadowfax bookings were inserted, the user couldn't see them.
3. **No fallback when Prayog API fails.** If the Prayog token is expired or the call returns 401/5xx, the user gets a single error toast and an empty page.

### Fix
1. **New edge function `get-user-orders`** (service-role, follows the existing `x-prayog-auth` convention used by `saved-addresses` and `get-profile`):
   - Accepts the Prayog auth payload, derives the `user_id` (same Base64 phone-hash pattern used elsewhere).
   - Returns local Supabase `bookings` rows for that user (Shadowfax-direct, Delhivery-direct in future, plus any Prayog ones we mirrored).
2. **Refactor `History.tsx` to merge two sources**:
   - Source A: Prayog API (existing call) — yields Prayog orders.
   - Source B: new `get-user-orders` edge function — yields local bookings (Shadowfax + any non-Prayog).
   - Run both in parallel via `Promise.allSettled`. Deduplicate by `prayog_order_id` / booking id. Sort by created date desc.
3. **Normalize Supabase bookings to the same shape** as Prayog orders so the existing card UI keeps working (map `sender_*` / `receiver_*` columns into the `addresses` array, synthesize a `shipments[0]` from `prayog_awb` / weight / dims, set `carrierName` from `courier_name`).
4. **Graceful failure**: if Prayog fails but local succeeds (or vice-versa), still render what we have plus a small inline warning banner — never a blank page.
5. **Loading skeleton** stays the same; empty state only shows when **both** sources return zero.

## Issue 2 — Google Autocomplete Pincode Mismatch is Too Weak

### Current behavior (`src/components/booking/AddressStep.tsx` lines 249-283)
When a user picks a Google Places suggestion whose pincode differs from the Step-2 pincode, we just set a state flag and show a dismissible Alert under the address field. The user can ignore it, the city/state fields silently get overwritten with values from the wrong pincode, and the booking proceeds with the (locked) Step-2 pincode but a mismatched address.

### Fix
1. **Block on selection, not just warn.** When `components.pincode !== pickupPincode`/`deliveryPincode` in `handleSenderAddressSelect` / `handleReceiverAddressSelect`:
   - **Do NOT apply** the autocomplete result's `address`, `city`, or `state`.
   - Open a **modal confirmation dialog** (shadcn `AlertDialog`) titled "Pincode Mismatch" with the two pincodes shown and two actions:
     - **"Keep my Step-2 pincode"** (default) → discard the suggestion entirely; user picks a different one.
     - **"Update pincode to {actual} and go back to Step 2"** → calls `onGoToStep(2)` with the new pincode pre-filled so serviceability is re-run.
2. **Strong inline banner** stays visible until resolved (current Alert), but now it only appears as a fallback (e.g. user typed pincode manually in the textarea).
3. **Apply the same gate to `SavedAddressPicker`** (lines 317-324, 443-450): when a saved address is picked whose pincode doesn't match Step-2, show the same dialog. Today the saved-address picker silently overwrites city/state but never pincode, leaving the address mismatched with no warning at all.
4. **Final submit-time guard** in `handleContinue`: if `senderData.pincode !== pickupPincode || receiverData.pincode !== deliveryPincode` (defensive — shouldn't happen since pincode is locked, but Step-2 might have changed), block submission with a destructive toast.

## Files Modified

| File | Change |
|------|--------|
| **New** `supabase/functions/get-user-orders/index.ts` | Service-role function; reads `bookings` for the Prayog-auth user, returns normalized list |
| **New** `supabase/config.toml` entry | `verify_jwt = false` for `get-user-orders` |
| `src/pages/History.tsx` | Parallel-fetch Prayog + local, merge & dedupe, partial-failure banner, normalize local rows to existing card shape |
| `src/components/booking/AddressStep.tsx` | Block-on-mismatch dialog for autocomplete + saved-address picker, submit-time pincode guard |

## What This Does Not Change
- The bookings RLS policy stays as-is (Prayog-auth users still can't directly read `bookings` from the client; the new edge function bridges that gap, matching the existing `saved-addresses` / `get-profile` pattern).
- The pincode field on the address page remains read-only — only way to change pincode is via the dialog's "Go back to Step 2" action.

