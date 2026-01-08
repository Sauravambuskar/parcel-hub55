-- Allow admin users to view all bookings for customer support
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (is_admin(auth.uid()));