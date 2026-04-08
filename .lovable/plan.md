

## Shadowfax Direct Integration — Full Flow (Serviceability, Booking, Tracking)

### Overview

Add Shadowfax as a **new direct courier partner** alongside Prayog. Shadowfax results will be merged into the existing partner list on the courier selection screen. The uploaded pincode serviceability data (~10K pincodes) will be stored in a Supabase table for fast local lookups, while order creation and tracking use the Shadowfax REST API directly.

### Prerequisites — Secrets

Two new Supabase secrets needed:
- **`SHADOWFAX_STAGING_TOKEN`** — Staging API token
- **`SHADOWFAX_PROD_TOKEN`** — Production API token

---

### Step 1: Database — Shadowfax Serviceability Pincodes Table

Create a migration to store the uploaded pincode list for fast serviceability checks:

```sql
CREATE TABLE public.shadowfax_pincodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode text NOT NULL,
  hub text,
  city text,
  state text,
  region text,
  pod text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_sfx_pincode ON public.shadowfax_pincodes(pincode);
ALTER TABLE public.shadowfax_pincodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.shadowfax_pincodes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.shadowfax_pincodes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

Also add `booking_source` column to bookings table:
```sql
ALTER TABLE public.bookings ADD COLUMN booking_source text DEFAULT 'prayog';
```

### Step 2: Seed Script — Import Pincode Data

A one-time edge function or script to parse the uploaded XLSX and insert ~10K rows into `shadowfax_pincodes`. This can also be done via a data import script.

### Step 3: Edge Function — `shadowfax-serviceability`

**File:** `supabase/functions/shadowfax-serviceability/index.ts`

- Accepts `{ pickup_pincode, delivery_pincode }`
- Queries `shadowfax_pincodes` table to check if both pincodes exist and are active
- If both serviceable, returns a normalized partner object matching Prayog's shape:
  ```json
  {
    "partner_id": "shadowfax_direct",
    "partner_code": "shadowfax",
    "partner_name": "Shadowfax",
    "is_serviceable": true,
    "services": [{
      "service_code": "sfx_standard",
      "service_name": "Standard Delivery",
      "tat_days": 3,
      "rate": { "rate_id": "sfx_rate", "price": { "amount": 0, "currency": "INR" } }
    }]
  }
  ```
- Rate will be 0 initially (Shadowfax pricing is contract-based, can be updated later)

### Step 4: Edge Function — `shadowfax-booking`

**File:** `supabase/functions/shadowfax-booking/index.ts`

- Calls Shadowfax Order Creation API: `POST /api/v3/clients/orders/`
- Base URLs: staging `https://dale.staging.shadowfax.in`, production `https://dale.shadowfax.in`
- Auth: `Token <SHADOWFAX_TOKEN>` header
- Maps sender/receiver to Shadowfax fields (`customer_name`, `customer_address`, `customer_pincode`, `customer_phone`, `seller_name`, `seller_address`, etc.)
- Returns normalized response: `{ success, awbNumber, orderId, status }`
- Stores `booking_source: "shadowfax_direct"` in the bookings table

### Step 5: Edge Function — `shadowfax-tracking`

**File:** `supabase/functions/shadowfax-tracking/index.ts`

- Calls Shadowfax Order Details API v4: `GET /api/v4/clients/status/?order_ids=<client_order_id>`
- Auth: `Token <SHADOWFAX_TOKEN>` header
- Normalizes response to match existing `TrackingData` interface (maps Shadowfax statuses like `Picked`, `Received`, `Returned To Client` to the app's timeline format)

### Step 6: Environment Config Update

**File:** `supabase/functions/_shared/environment.ts`

Add Shadowfax config:
```typescript
interface ShadowfaxConfig {
  apiBaseUrl: string;
  tokenEnvVar: string;
}

SHADOWFAX_CONFIG = {
  sandbox: { apiBaseUrl: 'https://dale.staging.shadowfax.in', tokenEnvVar: 'SHADOWFAX_STAGING_TOKEN' },
  production: { apiBaseUrl: 'https://dale.shadowfax.in', tokenEnvVar: 'SHADOWFAX_PROD_TOKEN' }
}
```

### Step 7: Frontend — Merge Shadowfax into Serviceability Flow

**File:** `src/components/booking/BookingStep2.tsx`

In `handleContinue`, after the Prayog serviceability call succeeds:
1. Also call `shadowfax-serviceability` edge function in parallel
2. If Shadowfax is serviceable, append its partner object to the Prayog `data.partners[]` array
3. Pass the merged list to `onServiceabilityData`

This means Shadowfax appears alongside Prayog partners on the courier selection screen (Step 3/BookingStep5) with no UI changes needed.

### Step 8: Frontend — Booking with Source Detection

**File:** `src/pages/Booking.tsx`

In `handlePaymentSuccess`:
- Check if `selectedPartnerData.partnerId === 'shadowfax_direct'`
- If yes: call `shadowfax-booking` edge function instead of Prayog booking API
- If Shadowfax booking fails: show error (no Prayog fallback since it's a different partner)
- Save `booking_source: 'shadowfax_direct'` to the bookings table

### Step 9: Frontend — Tracking with Source Detection

**File:** `src/pages/Tracking.tsx`

- Check `booking_source` from the bookings table for the given AWB
- If `shadowfax_direct`: call `shadowfax-tracking` edge function
- Otherwise: use existing Prayog tracking API
- Both return the same `TrackingData` shape, so the UI renders identically

### Step 10: Config & Partner Logo

- **`supabase/config.toml`**: Add 3 new function entries with `verify_jwt = false`
- **`src/config/partnerLogos.ts`**: Add Shadowfax logo mapping

---

### Technical Details

- Shadowfax uses `Token <api_token>` auth (not Bearer)
- Order Creation API: `POST https://dale.shadowfax.in/api/v3/clients/orders/` with JSON body
- Tracking API: `GET https://dale.shadowfax.in/api/v4/clients/status/?order_ids=<id>`
- Serviceability: local DB lookup (uploaded pincode list), not API call
- All responses normalized to match existing Prayog data shapes

### Flow Diagram

```text
User enters pincodes
        │
        ▼
  ┌─────────────────────────┐
  │  Prayog Serviceability  │──── in parallel ────┐
  │  (existing API call)    │                      │
  └──────────┬──────────────┘                      ▼
             │                          ┌──────────────────────┐
             │                          │ Shadowfax Pincode DB │
             │                          │ (local lookup)       │
             │                          └──────────┬───────────┘
             │                                     │
             ▼                                     ▼
        ┌─────────────────────────────────────┐
        │  Merged Partner List on Step 3      │
        │  (Prayog partners + Shadowfax)      │
        └──────────────┬──────────────────────┘
                       │
                       ▼
              User selects courier
                       │
              ┌────────┴────────┐
              │ Shadowfax?      │ Prayog partner?
              ▼                 ▼
     shadowfax-booking    Prayog booking API
              │                 │
              ▼                 ▼
         Save with          Save with
      source="shadowfax"  source="prayog"
```

