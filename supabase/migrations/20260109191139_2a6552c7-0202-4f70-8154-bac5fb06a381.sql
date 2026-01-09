-- Drop the overly restrictive INSERT policy
DROP POLICY IF EXISTS "Only authenticated service can create bookings" ON public.bookings;

-- Create a proper INSERT policy that allows authenticated users to create their own bookings
CREATE POLICY "Users can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);