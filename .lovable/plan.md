## Problem

The admin **Revenue & Commission Tracking** page (`/admin/revenue`) does not reflect what was actually charged on each booking. It computes everything as fixed percentages of `courier_price`:

- Platform Commission = `courier_price × 10%` (hardcoded)
- Prayog Commission = `courier_price × 5%` (hardcoded — this fee doesn't even exist on most bookings; the column is mostly `0`)
- GST = `courier_price × 18 / 118` (treats total as GST-inclusive — wrong; in this codebase GST is added on top of base fare)
- Base Fare = `courier_price × 67%` (made up)

But the `bookings` table already stores the **real** values written at booking time:
`base_fare`, `platform_fee`, `gst`, `packaging_amount`, `insurance_amount`, `courier_price` (= grand total).

The platform fee is also dynamic per-shipment (₹30–₹250 from `calculate-platform-fee`), not 10%, so the current display can be off by hundreds of rupees per order.

In addition, the user wants the wording changed from "Platform Commission" to **"Platform Revenue"**, and a clear **"Amount Payable to Partners"** figure (what we owe couriers).

## What will change

### 1. `src/pages/admin/RevenueManagement.tsx` — rebuild the math from real columns

Replace the percentage-based calculations with real DB values for every booking:

- `total = courier_price` (already the grand total incl. fee + GST + packaging + insurance)
- `platformRevenue = platform_fee` (real value stored per booking)
- `gst = gst` (real)
- `packaging = packaging_amount`, `insurance = insurance_amount` (real)
- `partnerPayable = courier_price − platform_fee − gst − packaging_amount − insurance_amount`
  (i.e. what the courier partner is owed; equals `base_fare` when set, with a safe fallback)

Aggregate stats (respecting the date filter and excluding `payment_status = 'cop_pending'` from collected revenue, same as today):

- **Total Collections** — sum of `courier_price` for paid orders
- **Pending COP Collection** — sum of `courier_price` for `cop_pending` orders
- **Amount Payable to Partners** — sum of `partnerPayable` for paid orders (NEW card, replaces "Prayog (5%)" which is not real)
- **Platform Revenue** — sum of `platform_fee` for paid orders (renamed from "Platform Commission (10%)", real value, no `× 0.1`)
- **GST Collected** — sum of `gst` for paid orders (real)

Transactions table columns become:
`Order ID | Date | Courier | Total | Partner Payable | Platform Revenue | GST | Packaging | Insurance | Status`
— each row reads straight from the booking row, no derivations.

Monthly Reports table:
`Month | Orders | Total Revenue | Partner Payable | Platform Revenue | GST` — all summed from real columns.

Revenue Analytics tab:
- "Total Lifetime Revenue" = sum of `courier_price`
- "Total Platform Revenue" = sum of `platform_fee` (rename, drop the "10% commission" subtitle — replace with "Net to Viasetu")
- "Total Payable to Partners" = sum of `partnerPayable` (new row)
- Average Order Value — unchanged

### 2. Price Breakdown tab — replace the static "67% / 10% / 5% / 18%" template

That tab currently shows a fictional fixed-percentage split with a ₹500 example. Replace it with a **dynamic breakdown of the filtered period** showing the real distribution:

- Bars/rows for: Partner Payable, Platform Revenue, GST, Packaging, Insurance
- Each shows ₹ amount + actual share of total collections (computed)
- Removes the ₹500 hard-coded example and the "Prayog 5%" row (Prayog commission is not charged here)

### 3. CSV export

Update headers/rows to: `Order ID, Date, Courier, Total, Partner Payable, Platform Revenue, GST, Packaging, Insurance, Status` — using real column values.

### 4. Sync the rest of the admin UI to the same model

To keep the dashboards consistent (otherwise users will see different numbers on different pages):

- **`src/pages/admin/AdminDashboard.tsx`**
  - "Platform Earnings" card → rename to **"Platform Revenue"**, value = `sum(platform_fee)` instead of `totalRevenue × 0.1`. Subtitle changes from "10% commission" to "Net to Viasetu".
  - "Revenue Breakdown" panel: replace "Platform Commission (10%)" row with "Platform Revenue" using `sum(platform_fee)`. Add a "Payable to Partners" row using the same formula.

- **`src/pages/admin/OrderMonitoring.tsx`** (lines 154–156)
  - Drop the `Math.round(courierPrice * 0.1 / 0.05 / 0.18)` fallbacks and read the real columns; only fall back to `0` when missing. Rename any "Commission" label to "Platform Revenue".

### 5. Realtime freshness (so admin numbers move as new orders come in)

`RevenueManagement.tsx` currently only fetches on mount. Add a Supabase Realtime subscription on the `bookings` table (INSERT + UPDATE) that re-runs `fetchBookings`, plus keep the manual Refresh button. Same subscription added to `AdminDashboard.tsx` so cards update live when a customer pays. Subscription is cleaned up on unmount.

## Out of scope

- No DB migration. All required columns (`base_fare`, `platform_fee`, `gst`, `packaging_amount`, `insurance_amount`, `payment_status`) already exist and are populated by `Booking.tsx` at booking time.
- No change to how prices are calculated at booking time. Only how admin pages read and label them.
- No change to Razorpay / refund flow.

## Files touched

- `src/pages/admin/RevenueManagement.tsx` — main rewrite (stats, tables, breakdown tab, export, realtime)
- `src/pages/admin/AdminDashboard.tsx` — rename + real `platform_fee` sum + realtime
- `src/pages/admin/OrderMonitoring.tsx` — drop hardcoded percent fallbacks, rename label
