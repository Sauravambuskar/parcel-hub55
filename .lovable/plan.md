# Landing Page Refresh

Scope: only `src/pages/Landing.tsx` and minor checks on `src/pages/Tracking.tsx` to ensure AWB tracking works without login. No backend, auth, or booking logic changes.

## Changes

### 1. Branding & Typography
- Replace all "ViaSetu" / "Via Setu" wordmarks with **Viasetu** (no space, no period). Includes: nav logo, mobile menu, footer logo, hero copy, FAQs, meta references in copy.
- Switch landing page font to **Helvetica**: set `fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif'` on the page wrapper. (Other app pages stay on Inter.)

### 2. Hero Simplification
- Remove the full **BookingWidget** (Domestic/International/Track tabs + pincode/weight/parcel-type inputs).
- Replace with a single, large **"Send a Parcel →"** button that navigates to `/login` (the entry point to the booking app).
- Keep the headline, subheadline, trust badges row, and right-side phone mockup.
- Add a secondary inline **"Track your parcel"** AWB mini-form in the hero (single input + button) that routes to `/tracking` with the AWB pre-filled — this gives a public tracking entry point right from the home page.

### 3. Public Tracking
- Verify `/tracking` route is public (it is — defined outside the protected layout in `App.tsx`).
- Update `Tracking.tsx` only if it currently blocks unauthenticated access (read shows it does not require auth for the search itself; will confirm and, if needed, remove any auth gate around the AWB lookup).
- The hero AWB mini-form will `navigate('/tracking', { state: { awbNumber } })` so the page auto-searches.

### 4. Navbar
- Remove **International** link.
- Keep: Compare Couriers (anchors to hero), Track Shipment (routes to `/tracking`), How It Works, Blog/FAQ.
- "Send a Parcel" button still routes to `/login`.
- "Track Your Parcel" button routes to `/tracking`.

### 5. Partners Section
- Replace `PARTNERS` list with **only the existing integrated partners**: Delhivery, Shadowfax, XpressBees, UrbaneBolt, Shree Maruti.
- Add a separate row/badges labeled **"More partners coming soon"** with placeholder names (e.g. DTDC, Blue Dart, India Post, DHL, FedEx) styled as muted/"Coming Soon" chips.

### 6. Popular Routes → Linked to App
- Each route chip currently links to `/courier/{slug}` (a non-existent route).
- Update all route chips and the footer "Popular Routes" list to link to `/login` (or `/booking` if user is already authed) so clicks funnel to the booking flow.

### 7. Removals
- Remove **International** tab/section entirely (already covered in hero + nav). Also remove the "International Shipping Made Simple" item from the Why ViaSetu list and the international FAQ entry.
- Remove the entire **Download** section (`#download` with Android/iOS buttons and phone mockup).
- Remove the "Available Now / Android / iOS" badge block under the hero phone mockup.
- Remove "International Shipping" link from footer Services list.

### 8. Untouched
- Auth, Supabase, edge functions, booking flow, all other routes.
- `index.html` SEO/meta and JSON-LD remain (only references inside the React landing change).

## Technical Notes
- Single file edit: `src/pages/Landing.tsx` (~80% rewrite of JSX, same component structure).
- Quick read of `src/pages/Tracking.tsx` to confirm the AWB lookup edge function call doesn't require an auth session; if it does, expose a public path.
- No new dependencies. Helvetica is a system font — no font import needed.
