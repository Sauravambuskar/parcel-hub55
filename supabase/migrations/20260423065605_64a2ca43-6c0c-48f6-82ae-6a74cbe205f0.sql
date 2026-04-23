-- Create xpressbees_pincodes table mirroring shadowfax_pincodes pattern
CREATE TABLE public.xpressbees_pincodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pincode TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zone TEXT, -- 'intra' | 'metro' | 'roi' | 'special' | 'northeast' (free text for flexibility)
  is_cod BOOLEAN DEFAULT false,
  is_prepaid BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX xpressbees_pincodes_pincode_idx ON public.xpressbees_pincodes (pincode);

ALTER TABLE public.xpressbees_pincodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.xpressbees_pincodes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anon read access" ON public.xpressbees_pincodes
  FOR SELECT TO anon USING (true);

CREATE POLICY "Service role full access" ON public.xpressbees_pincodes
  FOR ALL TO service_role USING (true) WITH CHECK (true);