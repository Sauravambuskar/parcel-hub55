
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.otp_verifications TO service_role;

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Block all client access to otp_verifications" ON public.otp_verifications;
CREATE POLICY "Block all client access to otp_verifications"
  ON public.otp_verifications
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS otp_verifications_phone_idx ON public.otp_verifications (phone);
CREATE INDEX IF NOT EXISTS otp_verifications_expires_at_idx ON public.otp_verifications (expires_at);
