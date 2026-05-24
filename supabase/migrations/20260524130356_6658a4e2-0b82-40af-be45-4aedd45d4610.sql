
-- 1) CMS media storage: allow cms_editor role too
DROP POLICY IF EXISTS "Super admins upload cms-media" ON storage.objects;
DROP POLICY IF EXISTS "Super admins update cms-media" ON storage.objects;
DROP POLICY IF EXISTS "Super admins delete cms-media" ON storage.objects;

CREATE POLICY "CMS managers upload cms-media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'cms-media' AND public.can_manage_cms(auth.uid()));

CREATE POLICY "CMS managers update cms-media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'cms-media' AND public.can_manage_cms(auth.uid()))
WITH CHECK (bucket_id = 'cms-media' AND public.can_manage_cms(auth.uid()));

CREATE POLICY "CMS managers delete cms-media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'cms-media' AND public.can_manage_cms(auth.uid()));

-- 2) shipment_history: drop misleading SELECT policy (never matches; edge functions use service_role)
DROP POLICY IF EXISTS "Users can view their own shipment history" ON public.shipment_history;

-- 3) Realtime channel authorization: restrict subscriptions to admins only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins only realtime read" ON realtime.messages;
DROP POLICY IF EXISTS "Admins only realtime write" ON realtime.messages;

CREATE POLICY "Admins only realtime read"
ON realtime.messages FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR public.is_operations(auth.uid()));

CREATE POLICY "Admins only realtime write"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (public.is_admin(auth.uid()) OR public.is_operations(auth.uid()));
