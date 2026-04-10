
-- Courier reliability scores
CREATE TABLE IF NOT EXISTS public.courier_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id TEXT NOT NULL UNIQUE,
  courier_name TEXT NOT NULL,
  reliability_score INTEGER DEFAULT 80 CHECK (reliability_score BETWEEN 0 AND 100),
  avg_delay_days DECIMAL(3,1) DEFAULT 0.5,
  total_ratings INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courier_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for courier scores"
  ON public.courier_scores FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role full access for courier scores"
  ON public.courier_scores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Shipment history for future ML
CREATE TABLE IF NOT EXISTS public.shipment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  courier_id TEXT NOT NULL,
  origin_pincode TEXT NOT NULL,
  destination_pincode TEXT NOT NULL,
  weight_kg DECIMAL(5,2),
  predicted_days INTEGER,
  actual_days INTEGER,
  predicted_confidence INTEGER,
  booking_date DATE,
  delivered_date DATE,
  price_paid DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.shipment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access for shipment history"
  ON public.shipment_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add columns to saved_addresses
ALTER TABLE public.saved_addresses
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 1;

-- Seed courier scores
INSERT INTO public.courier_scores (courier_id, courier_name, reliability_score, avg_delay_days)
VALUES
  ('delhivery',  'Delhivery',   88, 0.3),
  ('bluedart',   'Blue Dart',   93, 0.1),
  ('dtdc',       'DTDC',        79, 0.6),
  ('fedex',      'FedEx',       91, 0.2),
  ('xpressbees', 'XpressBees',  84, 0.4),
  ('indiapost',  'India Post',  71, 1.2),
  ('shadowfax',  'Shadowfax',   80, 0.5),
  ('ekart',      'Ekart',       82, 0.5),
  ('aramex',     'Aramex',      87, 0.3),
  ('porter',     'Porter',      83, 0.4)
ON CONFLICT (courier_id) DO NOTHING;
