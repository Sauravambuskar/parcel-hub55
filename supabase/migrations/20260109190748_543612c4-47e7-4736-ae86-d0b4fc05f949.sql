-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- Create a more restrictive policy that blocks direct client inserts
-- Only service role (Edge Functions) can insert, not anon users
-- Note: Service role bypasses RLS, so this effectively blocks all direct client inserts
CREATE POLICY "Only authenticated service can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (false);

-- Add a comment explaining the security model
COMMENT ON TABLE public.bookings IS 'Bookings are inserted via the save-booking Edge Function which validates Prayog authentication. Direct client inserts are blocked by RLS.';