
-- Re-apply: Convert ALL restrictive policies to PERMISSIVE
-- Must DROP and re-CREATE since you can't ALTER policy permissiveness

-- === BOOKINGS TABLE ===
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

CREATE POLICY "Users can create their own bookings" ON public.bookings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own bookings" ON public.bookings AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.bookings AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON public.bookings AS PERMISSIVE FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- === PROFILES TABLE ===
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- === ADMIN_USERS TABLE ===
DROP POLICY IF EXISTS "Super admins can create admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Users can view their own admin profile" ON public.admin_users;

CREATE POLICY "Super admins can create admin users" ON public.admin_users AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can delete admin users" ON public.admin_users AS PERMISSIVE FOR DELETE TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can update admin users" ON public.admin_users AS PERMISSIVE FOR UPDATE TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Super admins can view all admin users" ON public.admin_users AS PERMISSIVE FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));
CREATE POLICY "Users can view their own admin profile" ON public.admin_users AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === PARTNER_RATINGS TABLE ===
DROP POLICY IF EXISTS "Allow public read access to partner ratings" ON public.partner_ratings;
DROP POLICY IF EXISTS "Service role can insert partner ratings" ON public.partner_ratings;
DROP POLICY IF EXISTS "Service role can update partner ratings" ON public.partner_ratings;

CREATE POLICY "Allow public read access to partner ratings" ON public.partner_ratings AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can insert partner ratings" ON public.partner_ratings AS PERMISSIVE FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update partner ratings" ON public.partner_ratings AS PERMISSIVE FOR UPDATE TO service_role USING (true);

-- === SAVED_ADDRESSES TABLE ===
DROP POLICY IF EXISTS "Service role full access" ON public.saved_addresses;

CREATE POLICY "Service role full access" ON public.saved_addresses AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
