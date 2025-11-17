-- Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add status column to profiles for user management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive'));

-- Add email column to profiles (optional, if needed)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;