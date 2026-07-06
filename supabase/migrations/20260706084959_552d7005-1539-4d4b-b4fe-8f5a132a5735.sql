
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_admin_assisted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by_admin_id uuid,
  ADD COLUMN IF NOT EXISTS created_by_admin_email text,
  ADD COLUMN IF NOT EXISTS payment_link_id text,
  ADD COLUMN IF NOT EXISTS payment_link_url text,
  ADD COLUMN IF NOT EXISTS payment_link_status text;

CREATE INDEX IF NOT EXISTS bookings_created_by_admin_id_idx
  ON public.bookings (created_by_admin_id)
  WHERE created_by_admin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bookings_payment_link_id_idx
  ON public.bookings (payment_link_id)
  WHERE payment_link_id IS NOT NULL;
