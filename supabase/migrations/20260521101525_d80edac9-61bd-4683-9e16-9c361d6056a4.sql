ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS dead_weight_g integer,
ADD COLUMN IF NOT EXISTS volumetric_weight_g integer,
ADD COLUMN IF NOT EXISTS chargeable_weight_g integer;