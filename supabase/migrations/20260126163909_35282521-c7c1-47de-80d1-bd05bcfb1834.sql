-- Remove the foreign key constraint since we're using Prayog auth, not Supabase auth
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;