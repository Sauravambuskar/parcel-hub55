

# Implementation Plan: Booking Flow Enhancements

This plan covers 9 feature requests across the booking flow, order history, and UI improvements.

---

## 1. Draft Orders in Order History (Resume Abandoned Bookings)

Save booking progress to `localStorage` as users fill in each step. On the History page, show a "Draft" card at the top if an incomplete booking exists.

- **Booking.tsx**: On each step change, save current state (`currentStep`, `senderData`, `receiverData`, `goodsType`, `packageWeight`, `dimensions`, `pickupPincode`, `deliveryPincode`, etc.) to `localStorage` key `booking_draft`.
- **Booking.tsx**: On mount, check for `booking_draft` and restore state if found. Clear the draft after successful booking.
- **History.tsx**: On mount, check `localStorage` for `booking_draft`. If found, show a "Resume Draft" card at the top with a CTA button that navigates to `/booking` (which will auto-restore the draft).

---

## 2. Save Addresses (Address Book)

Create a new Supabase table `saved_addresses` and a UI to save/load addresses.

- **Database migration**: Create `saved_addresses` table with columns: `id`, `user_id`, `label` (e.g., "Home", "Office"), `name`, `phone`, `flat_no`, `address`, `city`, `state`, `pincode`, `created_at`. Add RLS policies for user-owned data.
- **AddressStep.tsx**: Add a "Save this address" checkbox next to both sender and receiver sections. Add a "Saved Addresses" dropdown/button that loads previously saved addresses and auto-fills the form fields.
- **New component**: `SavedAddressPicker.tsx` - a small modal/dropdown listing saved addresses with a "Use" button.

---

## 3. Repeat / Clone Last Order

Allow users to clone a previous order from the History page.

- **History.tsx**: Add a "Repeat Order" button on each order card.
- On click, navigate to `/booking` with the order's data passed via `react-router` state (`senderData`, `receiverData`, `goodsType`, `packageWeight`, `dimensions`, `pickupPincode`, `deliveryPincode`).
- **Booking.tsx**: On mount, check for `location.state.cloneData` and pre-fill all fields. Start from step 2 (skip service type selection since it's always domestic).

---

## 4. Fix Button Hover Color Visibility

The primary color is `hsl(180, 100%, 75%)` (light cyan). Several button variants may become invisible on hover against matching backgrounds.

- **button.tsx**: Update the `ghost` variant hover to use a more visible color: change `hover:bg-accent/10` to `hover:bg-foreground/10` so it contrasts regardless of background.
- **button.tsx**: Update the `outline` variant to ensure hover state text remains visible: verify `hover:text-primary-foreground` contrast against `hover:bg-primary`.
- **BookingStep5.tsx / PartnerComparisonTable.tsx**: Review the "Continue" button and selection states against the page background to ensure visibility.

---

## 5. Dimensions Not Required for Envelopes/Documents

Currently, dimensions (L/B/H) are required for all goods types. For "Documents / Envelope", skip this requirement.

- **BookingStep2.tsx**: Update the `isValid` check on line 150 to conditionally require dimensions:
  ```
  const dimensionsRequired = goodsType !== 'documents';
  const isValid = pickupPincode && deliveryPincode && goodsType && packageWeight 
    && (!dimensionsRequired || (dimensions.length && dimensions.width && dimensions.height))
    && (goodsType !== 'others' || customGoodsType.trim());
  ```
- **BookingStep2.tsx**: Conditionally hide or collapse the dimensions fields when `goodsType === 'documents'`. Show a note like "Dimensions not required for envelopes."
- **Booking.tsx**: When `goodsType === 'documents'`, set default dimensions (e.g., `{length: "30", width: "22", height: "2"}`) in the API payload so the API doesn't reject it.

---

## 6. Partner Listing: Rename "Service" to "Mode", Add Sorting & Filtering

- **PartnerComparisonTable.tsx**: Rename the table header "Service" to "Mode". Rename the page title to "Courier Partners" instead of current heading.
- **BookingStep5.tsx**: Update heading from "Compare and Choose Your Courier Partner" (already says Courier Partner, good).
- **PartnerComparisonTable.tsx**: Add sort controls at the top of the table:
  - Sort by: Price (low-high, high-low), Delivery Time (fastest first), Rating (highest first)
  - Filter by: Mode (Surface/Air/Express/Standard), COD availability
- Use local state for sort/filter. Parse `service_name` or `delivery_modes` to determine Surface vs Air.

---

## 7. Booking for Self or Someone Else

Add a toggle at the top of the AddressStep to choose "Booking for Self" or "Booking for Someone Else."

- **AddressStep.tsx**: Add a toggle/radio at the top: "Sending for" -> "Self" | "Someone Else".
- When "Self" is selected, auto-fill sender name and phone from the user's profile stored in `localStorage` (`prayog_auth` or profile data). Make those fields read-only.
- When "Someone Else" is selected, keep the form fields empty and editable as currently.
- Fetch profile data from `localStorage` (already stored during login: `prayog_auth` contains user info, and profile has `full_name` and `phone`).

---

## 8. Missing Field Validation with Specific Error Messages

Currently the "Continue" button is just disabled when fields are missing. Users don't know which field is missing.

- **AddressStep.tsx**: Add a `submitted` state. On clicking "Continue", set `submitted = true` and check validation. If invalid, show red borders and inline error messages on each empty required field (name, phone, flat no, address, city, state).
- Show a toast or alert banner at the top summarizing: "Please fill in the following fields: Sender Name, Receiver Phone" etc.
- Use the existing `border-destructive` pattern already used for phone validation.

---

## 9. "Service" to "Mode" Label Change

- **PartnerComparisonTable.tsx**: Change `<TableHead>Service</TableHead>` to `<TableHead>Mode</TableHead>` (covered in item 6).

---

## Technical Details

### New Database Table (Migration)

```sql
CREATE TABLE public.saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  label text DEFAULT 'Home',
  name text NOT NULL,
  phone text NOT NULL,
  flat_no text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies (using text user_id since Prayog auth, not Supabase auth)
-- Will be managed via edge functions similar to profiles table
```

### Files to Create
- `src/components/booking/SavedAddressPicker.tsx` - Address book picker component

### Files to Modify
- `src/pages/History.tsx` - Draft card + Repeat Order button
- `src/pages/Booking.tsx` - Draft save/restore, clone order restore, default envelope dimensions
- `src/components/booking/BookingStep2.tsx` - Conditional dimensions for envelopes
- `src/components/booking/BookingStep5.tsx` - Heading update
- `src/components/booking/PartnerComparisonTable.tsx` - Rename Service to Mode, add sort/filter
- `src/components/booking/AddressStep.tsx` - Self/someone else toggle, saved addresses, field validation errors
- `src/components/ui/button.tsx` - Fix hover color visibility

