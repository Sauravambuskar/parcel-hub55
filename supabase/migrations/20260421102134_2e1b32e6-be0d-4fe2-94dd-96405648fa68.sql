ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS refund_id text,
  ADD COLUMN IF NOT EXISTS refund_reason text;

CREATE INDEX IF NOT EXISTS bookings_payment_id_idx ON public.bookings (payment_id);