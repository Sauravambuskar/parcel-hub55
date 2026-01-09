-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;

-- Create a new policy that allows inserts without checking auth.uid()
-- This is needed because Prayog auth doesn't use Supabase auth
CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (true);

-- Keep select policies restricted so only admins and the user can see their bookings
-- Users can still view their own bookings by user_id matching

-- Also remove the foreign key constraint on user_id if it exists
-- since we're using Prayog user IDs which are UUIDs but not in auth.users
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;