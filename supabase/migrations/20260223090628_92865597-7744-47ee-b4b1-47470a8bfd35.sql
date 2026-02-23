
-- Create a function to mask sensitive document numbers (show only last 4 chars)
CREATE OR REPLACE FUNCTION public.mask_doc_number(doc text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN doc IS NULL THEN NULL
    WHEN length(doc) <= 4 THEN repeat('X', length(doc))
    ELSE repeat('X', length(doc) - 4) || right(doc, 4)
  END;
$$;

-- Create a secure view that masks sensitive fields for non-admin access
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  id,
  user_id,
  full_name,
  phone,
  email,
  preferred_language,
  theme_preference,
  sms_notifications,
  promo_notifications,
  status,
  doc_type,
  public.mask_doc_number(doc_number) as doc_number,
  kyc_status,
  kyc_completed_at,
  created_at,
  updated_at
FROM public.profiles;
