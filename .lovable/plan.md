## Goal
Capture 3 onboarding questions from every user (new signups + existing users on next login), store them on their profile, expose in admin User Management with CSV export.

## Questions
1. **Where did you hear about us?** — free text (max 200 chars)
2. **How often do you send parcels in a month?** — dropdown: `1-5`, `5-10`, `10+`
3. **What type of courier do you send?** — dropdown: `Documents`, `Box Items`

## Database (migration)
Add 4 columns to `public.profiles`:
- `survey_source text`
- `survey_frequency text` (check: 1-5 / 5-10 / 10+)
- `survey_courier_type text` (check: Documents / Box Items)
- `survey_completed_at timestamptz`

No new table — keeps the survey one-to-one with the user. Existing RLS already covers self-update via the `update-profile` edge function.

## Frontend
**New component:** `src/components/OnboardingSurveyDialog.tsx`
- Modal dialog (cannot be dismissed without submitting; "Skip for now" not allowed per requirement to capture data — confirm in question below).
- 3 fields with validation (zod).
- Submits via existing `update-profile` edge function (extended to accept the 4 new fields).

**Trigger logic:** In `src/App.tsx` (or a small `SurveyGate` mounted under authenticated routes):
- After auth resolves, fetch profile.
- If `survey_completed_at IS NULL` → show dialog over current route.
- Applies to both fresh signups and returning existing users on their next session.

**Edge function update:** `supabase/functions/update-profile/index.ts` — accept and persist the 4 new fields; set `survey_completed_at = now()` when all three answers present.

## Admin User Management
Update `src/pages/admin/UserManagement.tsx`:
- Add columns in the user table: Source, Frequency, Courier Type, Survey Date.
- Add **Export CSV** button that downloads all users (or filtered set) including the survey columns. Client-side CSV generation from the already-fetched rows.

## Out of scope
- No changes to login/OTP flow itself — the gate fires post-auth on first authenticated render.
- No edits to KYC or other profile fields.

## Open question
The user said "These responses…will help us capture some data." Should the survey be **mandatory** (blocking modal, no skip) or **dismissible once** (skip → ask again next login)? Default in plan is mandatory; will confirm before building.
