-- Add pricing breakdown columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS base_fare numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS prayog_commission numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS packaging_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_id text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS prayog_order_id text,
ADD COLUMN IF NOT EXISTS prayog_awb text;