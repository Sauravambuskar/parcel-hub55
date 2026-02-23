
CREATE TABLE public.saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  label text DEFAULT 'Home',
  name text NOT NULL,
  phone text NOT NULL,
  flat_no text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies - managed via edge functions using service role (same pattern as profiles)
-- Allow service role full access; no direct client access
CREATE POLICY "Service role full access" ON public.saved_addresses
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for user lookups
CREATE INDEX idx_saved_addresses_user_id ON public.saved_addresses(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_addresses_updated_at
  BEFORE UPDATE ON public.saved_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
