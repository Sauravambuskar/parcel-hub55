DROP POLICY IF EXISTS "Anyone can create a dispute" ON public.cancellation_disputes;
DROP POLICY IF EXISTS "Anyone can read disputes by user id" ON public.cancellation_disputes;
DROP POLICY IF EXISTS "Service role full access disputes" ON public.cancellation_disputes;
CREATE POLICY "Service role full access disputes"
  ON public.cancellation_disputes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);