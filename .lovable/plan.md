## Goal
On Step 3 ETA cards, if a courier looks unreliable, show a small warning with the AI-aggregated reason so the user understands the low score before choosing.

## Trigger
A partner is flagged "low reliability" when EITHER:
- `partner_ratings.rating < 4.0`, OR
- `courier_scores.avg_delay_days > 1`

## What we show
A subtle amber chip under the partner name:
```
⚠ Lower reliability  ⓘ
```
Hover/tap reveals a tooltip with the top 1–2 `cons` from `partner_ratings` (e.g. "Frequent delivery delays", "Patchy customer support"). If no cons are available, fall back to a generic line: "Mixed customer feedback on recent shipments."

The chip is informational only — it does not block selection or re-rank partners.

## Changes

### 1. `usePartnerRatings.ts`
Hook already returns `rating` and `cons[]` from `partner_ratings`. Extend the request/response shape so each entry also carries `avg_delay_days` joined from `courier_scores` (matched by `partner_code` ↔ `courier_id`). One extra read inside `fetch-partner-ratings` edge function.

### 2. `fetch-partner-ratings` edge function
After loading partner_ratings, look up `courier_scores` rows for the same partner codes and attach `avg_delay_days` and `reliability_score` to each returned rating object. No schema changes.

### 3. `ETACard.tsx`
- Accept new optional props: `cons?: string[]`, `avgDelayDays?: number`.
- Compute `isLowReliability = (rating != null && rating < 4) || (avgDelayDays != null && avgDelayDays > 1)`.
- When true, render an amber chip below the partner name. Use shadcn `Tooltip` to show top 2 cons (joined with " · "), or fallback text.
- No layout shift when chip is absent.

### 4. `BookingStep5.tsx` (parent of ETA cards)
Pass `cons` and `avg_delay_days` from `ratings.get(partner_code)` into each `<ETACard>`.

## Out of scope
- Changing ranking/sort logic in SmartRanking.
- Showing the warning in the comparison table or AI Recommends row (user asked only for the ETA card).
- Editing the AI prompt that generates cons.

## Technical note
```text
partner_ratings ──► rating, cons[]
courier_scores  ──► avg_delay_days
        │
        ▼
  fetch-partner-ratings (merge)
        │
        ▼
  usePartnerRatings hook
        │
        ▼
  BookingStep5 → ETACard → amber chip + tooltip
```
