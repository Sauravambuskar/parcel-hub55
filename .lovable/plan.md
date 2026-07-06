## Problem

When the user enters a weight with **Box** selected and then switches to **Documents / Envelope**, the previously entered weight persists in state. It should snap to the fixed envelope default (250g = 0.25 kg), and clear when switching back to Box.

## Fix

In `src/pages/Booking.tsx`, update the `handleInputChange` `"goodsType"` case:

- If new value is `documents` → `setPackageWeight("0.25")` and clear `dimensions` (`{ length: "", width: "", height: "" }`) since envelope has no dimensions.
- If new value is `box` (switching away from documents) → `setPackageWeight("")` so the user is forced to enter the actual box weight (avoids the reverse bug of carrying 0.25 kg into a box).

No changes to BookingStep2 UI (it already hides the weight field for documents and shows the "Weight fixed at 250g" note). No pricing / API changes — downstream code already uses `packageWeight` as source of truth.

## Verification

- Select Box, enter 2 kg → switch to Envelope → weight state becomes 0.25 kg, UI shows the fixed-weight note, pricing recalculates on 0.25 kg.
- Switch back to Box → weight field is empty, user must re-enter.
