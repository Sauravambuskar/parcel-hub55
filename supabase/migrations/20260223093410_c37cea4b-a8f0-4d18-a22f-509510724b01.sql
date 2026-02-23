
-- Enable RLS on the profiles_safe view
ALTER VIEW public.profiles_safe SET (security_invoker = on);

-- Note: In PostgreSQL, RLS on views is enforced through the underlying table
-- when security_invoker is on. But we can also add explicit protection
-- by revoking direct access and only allowing through authenticated role.

-- Revoke all access from anon/public roles on profiles_safe
REVOKE ALL ON public.profiles_safe FROM anon;
REVOKE ALL ON public.profiles_safe FROM public;

-- Grant select only to authenticated users (RLS on profiles table will still filter rows)
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO service_role;
