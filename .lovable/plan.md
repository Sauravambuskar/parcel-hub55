## Parcel Photo Upload Feature

Let users upload up to 5 photos of the packed parcel after booking confirmation. Photos are mandatory before pickup, surfaced in the post-order instruction box (where label printing instructions live) and in the Order History / Order Details page. Admins view & download photos from the Order Monitoring section.

### 1. Storage
- Create a new private Supabase storage bucket `parcel-photos`.
- Path convention: `{user_id}/{booking_id}/{uuid}.{ext}`.
- RLS on `storage.objects`:
  - Users can `SELECT/INSERT/DELETE` their own files (path prefix = their `user_id`).
  - Admins (`is_admin(auth.uid())`) can `SELECT` all.
- Admin downloads use short-lived signed URLs generated client-side.

### 2. Database (migration)
- Add column `parcel_photos jsonb DEFAULT '[]'::jsonb` to `public.bookings`.
  - Each entry: `{ path: string, uploaded_at: timestamptz }`.
- Add column `parcel_photos_uploaded_at timestamptz` for sorting/filtering.
- No new tables.

### 3. Upload UI (user-facing)
- New component `src/components/booking/ParcelPhotoUpload.tsx`:
  - Drag-drop + file picker, image-only, max 5 files, max ~5MB each, client-side compression (canvas resize to 1600px).
  - Thumbnails with delete button.
  - Uploads via `supabase.storage.from('parcel-photos').upload(...)` then calls edge function `save-parcel-photos` to persist the path array on the booking (RLS-safe).
- Mount points:
  - **Order History detail / Order Details page** (`src/pages/OrderDetails.tsx`) — primary upload location.
  - **Post-order confirmation instructions box** (`src/components/booking/BookingConfirmationDialog.tsx` — the screen with label-printing instructions): add a clearly highlighted "Upload parcel photos (required before pickup)" section above/below label instructions, linking to / inlining the same component.
- Mandatory enforcement:
  - Warning banner on Order Details + confirmation dialog when `parcel_photos.length === 0`: "Pickup will not be scheduled until parcel photos are uploaded."
  - Disable / hide "Mark ready / Schedule pickup" actions until ≥1 photo uploaded.
  - Backend pickup-trigger edge functions (Delhivery/Shadowfax/etc. pickup-request) reject with clear error if `parcel_photos` is empty.

### 4. Edge function
- New `supabase/functions/save-parcel-photos/index.ts`:
  - Auth via existing JWT pattern, verifies caller owns the booking, validates payload (zod: array of {path} max length 5), updates `bookings.parcel_photos` and `parcel_photos_uploaded_at`.

### 5. Admin Order Monitoring
- `src/pages/admin/OrderMonitoring.tsx`:
  - Add "Photos" column showing count badge (e.g. `📷 3`).
  - Row expand / detail modal: thumbnail grid of all parcel photos with:
    - Click to open full-size lightbox.
    - "Download" button per photo (signed URL, `download` attribute).
    - "Download all (zip)" button — client-side using `jszip` (add dep) fetching each signed URL.
  - Filter toggle: "Missing parcel photos".

### Technical notes
- New dep: `jszip` for admin bulk download.
- Reuse existing `supabase` client; no service-role usage in browser.
- Signed URL TTL: 5 minutes.
- Image compression handled in browser to keep bucket lean.
- File-type whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/heic` (converted to jpeg on upload).

### Files touched
- New: `supabase/migrations/<ts>_parcel_photos.sql`, `supabase/functions/save-parcel-photos/index.ts`, `src/components/booking/ParcelPhotoUpload.tsx`, `src/components/admin/ParcelPhotoGallery.tsx`.
- Edited: `src/pages/OrderDetails.tsx`, `src/components/booking/BookingConfirmationDialog.tsx`, `src/pages/admin/OrderMonitoring.tsx`, `src/integrations/supabase/types.ts` (auto), pickup-request edge functions (add photo-presence guard).
