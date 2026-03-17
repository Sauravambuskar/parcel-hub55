

## Problem

When selecting "Self" in the address step, the sender name and phone don't populate because:

1. **`localStorage.getItem('user_profile')` is never set** — no code in the app writes to this key. The profile is fetched in `Index.tsx` but stored only in React state, not localStorage.
2. **`prayog_auth` lacks name fields** — the auth object stores `userName` (only if set during signup), not `full_name` or `name`. The phone is stored as `+91XXXXXXXXXX` which `formatPhoneDisplay` handles correctly, but the name lookup fails silently.

## Fix

Modify the `useEffect` in `AddressStep.tsx` (lines 84-105) to:

1. **Fetch the profile from Supabase** using the `get-profile` edge function (same pattern as `Index.tsx`) with the `user_id` from `prayog_auth`.
2. **Extract the phone from `prayog_auth.phone`** — strip the `+91` prefix to get the 10-digit number for the phone field.
3. **Fall back to `prayog_auth.userName`** if the profile fetch fails or returns no name.

### Changes

**File: `src/components/booking/AddressStep.tsx`**

- Import `supabase` from the client
- Replace the `useEffect` for `bookingFor === 'self'` to call `get-profile` edge function with `user_id`, then populate `name` from `profile.full_name` and `phone` from `prayog_auth.phone` (stripped of `+91`)
- Remove the dead `user_profile` localStorage read
- Keep the existing `formatPhoneDisplay` for stripping non-digits

The phone number will always come from `prayog_auth.phone` (the number used to log in), ensuring it matches the login number as expected.

