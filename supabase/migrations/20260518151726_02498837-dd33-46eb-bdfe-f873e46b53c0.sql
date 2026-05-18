
DROP POLICY IF EXISTS "Users view their own disputes" ON public.cancellation_disputes;
DROP POLICY IF EXISTS "Users create their own disputes" ON public.cancellation_disputes;

CREATE POLICY "Anyone can create a dispute"
  ON public.cancellation_disputes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read disputes by user id"
  ON public.cancellation_disputes FOR SELECT
  TO anon, authenticated
  USING (true);
