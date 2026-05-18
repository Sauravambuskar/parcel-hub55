-- Enable realtime for admin-facing tables so dashboards stay in sync
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['bookings','profiles','admin_users','support_tickets','ticket_messages','cancellation_disputes'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END$$;