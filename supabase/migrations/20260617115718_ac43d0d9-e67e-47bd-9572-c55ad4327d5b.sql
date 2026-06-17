
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS parcel_photos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS parcel_photos_uploaded_at timestamptz;

DROP POLICY IF EXISTS "Admins can read parcel photos" ON storage.objects;
CREATE POLICY "Admins can read parcel photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'parcel-photos'
  AND public.is_admin(auth.uid())
);
