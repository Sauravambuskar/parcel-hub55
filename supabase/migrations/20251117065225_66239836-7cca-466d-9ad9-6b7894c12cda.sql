-- Create enum for admin roles
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'support');

-- Create admin_users table to store admin user information
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role admin_role NOT NULL DEFAULT 'support',
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- Create security definer function to check super admin role
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = _user_id
      AND role = 'super_admin'
      AND is_active = true
  )
$$;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.admin_users
  WHERE user_id = _user_id
    AND is_active = true
  LIMIT 1
$$;

-- RLS Policies for admin_users table
-- Super admins can view all admin users
CREATE POLICY "Super admins can view all admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Users can view their own admin profile
CREATE POLICY "Users can view their own admin profile"
ON public.admin_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only super admins can insert new admin users
CREATE POLICY "Super admins can create admin users"
ON public.admin_users
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- Only super admins can update admin users
CREATE POLICY "Super admins can update admin users"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Only super admins can delete admin users
CREATE POLICY "Super admins can delete admin users"
ON public.admin_users
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX idx_admin_users_email ON public.admin_users(email);
CREATE INDEX idx_admin_users_role ON public.admin_users(role);

-- Add comment
COMMENT ON TABLE public.admin_users IS 'Admin users with role-based access control. Only @viasetu.com domain emails allowed.';