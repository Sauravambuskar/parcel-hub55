CREATE TABLE public.shadowfax_pincodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode text NOT NULL,
  hub text,
  city text,
  state text,
  region text,
  pod text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_sfx_pincode ON public.shadowfax_pincodes(pincode);
ALTER TABLE public.shadowfax_pincodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.shadowfax_pincodes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON public.shadowfax_pincodes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Anon read access" ON public.shadowfax_pincodes
  FOR SELECT TO anon USING (true);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_source text DEFAULT 'prayog';