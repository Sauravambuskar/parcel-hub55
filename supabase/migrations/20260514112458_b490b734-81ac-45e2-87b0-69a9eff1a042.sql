-- Helper: can manage CMS (super_admin or cms_editor)
CREATE OR REPLACE FUNCTION public.can_manage_cms(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id
      AND is_active = true
      AND role IN ('super_admin'::admin_role, 'cms_editor'::admin_role)
  )
$$;

-- Helper: operations access (super_admin or operations)
CREATE OR REPLACE FUNCTION public.is_operations(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id
      AND is_active = true
      AND role IN ('super_admin'::admin_role, 'operations'::admin_role, 'support'::admin_role)
  )
$$;

-- ===== CMS tables: replace super-admin-only policies with cms-editor inclusive =====
DROP POLICY IF EXISTS "Super admins manage content" ON public.cms_content;
DROP POLICY IF EXISTS "Super admins view all content" ON public.cms_content;
CREATE POLICY "CMS managers view all content" ON public.cms_content
  FOR SELECT USING (public.can_manage_cms(auth.uid()));
CREATE POLICY "CMS managers manage content" ON public.cms_content
  FOR ALL USING (public.can_manage_cms(auth.uid()))
  WITH CHECK (public.can_manage_cms(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage categories" ON public.cms_categories;
CREATE POLICY "CMS managers manage categories" ON public.cms_categories
  FOR ALL USING (public.can_manage_cms(auth.uid()))
  WITH CHECK (public.can_manage_cms(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage authors" ON public.cms_authors;
CREATE POLICY "CMS managers manage authors" ON public.cms_authors
  FOR ALL USING (public.can_manage_cms(auth.uid()))
  WITH CHECK (public.can_manage_cms(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage media" ON public.cms_media;
CREATE POLICY "CMS managers manage media" ON public.cms_media
  FOR ALL USING (public.can_manage_cms(auth.uid()))
  WITH CHECK (public.can_manage_cms(auth.uid()));

-- ===== Operations: read access for relevant tables (admins already covered by is_admin) =====
-- is_admin() already returns true for any active admin including operations role,
-- so existing "Admins can view all bookings/tickets/profiles" policies cover operations.
-- No additional policies needed.