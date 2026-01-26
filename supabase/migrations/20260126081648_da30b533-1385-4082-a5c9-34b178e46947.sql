-- Add label_url column to bookings table for storing shipping label URLs
ALTER TABLE public.bookings 
ADD COLUMN label_url TEXT NULL;