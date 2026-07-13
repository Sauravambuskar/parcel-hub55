ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS partner_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_code text;