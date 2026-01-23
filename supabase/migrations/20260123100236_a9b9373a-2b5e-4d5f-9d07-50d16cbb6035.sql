-- Create partner_ratings table to cache AI-fetched ratings
CREATE TABLE public.partner_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code TEXT NOT NULL UNIQUE,
  partner_name TEXT NOT NULL,
  rating DECIMAL(2,1),
  review_count INTEGER DEFAULT 0,
  rating_source TEXT DEFAULT 'ai_aggregated',
  summary TEXT,
  pros TEXT[],
  cons TEXT[],
  badges TEXT[],
  last_fetched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS with public read access (ratings are public data)
ALTER TABLE public.partner_ratings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read partner ratings
CREATE POLICY "Allow public read access to partner ratings"
ON public.partner_ratings
FOR SELECT
TO public
USING (true);

-- Only service role can insert/update (via edge functions)
CREATE POLICY "Service role can insert partner ratings"
ON public.partner_ratings
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update partner ratings"
ON public.partner_ratings
FOR UPDATE
TO service_role
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_partner_ratings_updated_at
BEFORE UPDATE ON public.partner_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_partner_ratings_partner_code ON public.partner_ratings(partner_code);
CREATE INDEX idx_partner_ratings_last_fetched ON public.partner_ratings(last_fetched_at);