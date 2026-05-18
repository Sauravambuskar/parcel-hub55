
CREATE TABLE public.cancellation_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  partner_error text,
  partner_status_at_attempt text,
  previous_booking_status text,
  status text NOT NULL DEFAULT 'open',
  admin_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  assigned_admin uuid,
  resolved_at timestamptz,
  refund_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_cancellation_disputes_status ON public.cancellation_disputes(status);
CREATE INDEX idx_cancellation_disputes_user ON public.cancellation_disputes(user_id);
CREATE INDEX idx_cancellation_disputes_booking ON public.cancellation_disputes(booking_id);

ALTER TABLE public.cancellation_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own disputes"
  ON public.cancellation_disputes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create their own disputes"
  ON public.cancellation_disputes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all disputes"
  ON public.cancellation_disputes FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins update all disputes"
  ON public.cancellation_disputes FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE TRIGGER trg_cancellation_disputes_updated_at
  BEFORE UPDATE ON public.cancellation_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.cancellation_disputes;
ALTER TABLE public.cancellation_disputes REPLICA IDENTITY FULL;
