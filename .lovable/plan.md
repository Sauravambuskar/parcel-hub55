

# Plan: Add Payment Method "pickup" for Delhivery Orders

## Overview
After payment confirmation, the booking API needs to pass a `paymentMethod: "Pickup"` key specifically for orders placed with Delhivery courier partner. Other partners will not include this field.

## Current Architecture
The booking payload is constructed in **two locations**:
1. **Frontend** (`src/pages/Booking.tsx`): Lines 455-566 - Main payment flow that calls the Prayog API directly
2. **Edge Function** (`supabase/functions/prayog-create-booking/index.ts`): Lines 61-162 - Alternative booking creation path

Both locations construct a `payment` object with `type: "PREPAID"`. For Delhivery orders only, we need to add `paymentMethod: "Pickup"`.

## Implementation Steps

### Step 1: Update Frontend Booking Payload (src/pages/Booking.tsx)

**Location**: Around line 549-564 in the `handlePaymentSuccess` function

**Change**: 
- Check if `selectedService?.partner_code` matches "delhivery" (case-insensitive)
- If Delhivery, add `paymentMethod: "Pickup"` to the payment object

```typescript
// Before
payment: {
  finalAmount: totalAmount,
  type: "PREPAID",
  breakdown: { ... }
}

// After (for Delhivery)
payment: {
  finalAmount: totalAmount,
  type: "PREPAID",
  paymentMethod: "Pickup",  // Only for Delhivery
  breakdown: { ... }
}
```

### Step 2: Update Edge Function (supabase/functions/prayog-create-booking/index.ts)

**Location**: Around line 153-161

**Change**: 
- Check if `carrierName` or `partner_code` from `selectedService` matches "delhivery" (case-insensitive)
- Conditionally add `paymentMethod: "Pickup"` to the payment object

---

## Technical Details

### Partner Identification
The partner is identified via `partner_code` field which comes from the serviceability API. For Delhivery, the code is typically `"delhivery"` (lowercase).

### Matching Logic
```typescript
const isDelhivery = (partnerCode: string) => 
  partnerCode?.toLowerCase().includes('delhivery');
```

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/Booking.tsx` | Add conditional `paymentMethod` in payment object |
| `supabase/functions/prayog-create-booking/index.ts` | Add conditional `paymentMethod` in payment object |

