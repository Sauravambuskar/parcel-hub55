-- Add KYC fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS doc_type text,
ADD COLUMN IF NOT EXISTS doc_number text,
ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS kyc_completed_at timestamp with time zone;

-- Add index for quick KYC status lookups
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);