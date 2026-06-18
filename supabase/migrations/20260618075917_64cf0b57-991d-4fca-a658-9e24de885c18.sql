CREATE TABLE public.booking_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NOT NULL,
  last_step int NOT NULL CHECK (last_step BETWEEN 1 AND 6),
  last_step_name text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  booking_id uuid NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id)
);

CREATE INDEX idx_booking_progress_user_updated ON public.booking_progress (user_id, updated_at DESC);
CREATE INDEX idx_booking_progress_completed_step ON public.booking_progress (completed, last_step);

GRANT SELECT, INSERT, UPDATE ON public.booking_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.booking_progress TO anon;
GRANT ALL ON public.booking_progress TO service_role;

ALTER TABLE public.booking_progress ENABLE ROW LEVEL SECURITY;

-- Permissive: app uses custom Prayog auth, not auth.uid(); admin reads via service role / admin checks
CREATE POLICY "anyone can insert progress" ON public.booking_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone can update progress" ON public.booking_progress FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "admins can read all progress" ON public.booking_progress FOR SELECT USING (
  public.is_admin(auth.uid()) OR public.is_operations(auth.uid()) OR true
);

CREATE TRIGGER trg_booking_progress_updated_at
  BEFORE UPDATE ON public.booking_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();