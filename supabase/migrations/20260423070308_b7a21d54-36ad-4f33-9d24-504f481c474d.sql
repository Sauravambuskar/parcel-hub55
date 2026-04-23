
-- Replace the unused 'zone' column with 'is_pickup' to match the XpressBees CSV (zones are derived dynamically from origin/destination state pairs at quote time)
ALTER TABLE public.xpressbees_pincodes DROP COLUMN IF EXISTS zone;
ALTER TABLE public.xpressbees_pincodes ADD COLUMN IF NOT EXISTS is_pickup BOOLEAN DEFAULT false;
