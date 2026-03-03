
-- Support Tickets table
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON public.support_tickets FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets FOR UPDATE
  USING (is_admin(auth.uid()));

-- Ticket messages/replies
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages on their tickets"
  ON public.ticket_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can add messages to their tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all messages"
  ON public.ticket_messages FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can add messages to any ticket"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- System Settings table (key-value store)
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all settings"
  ON public.system_settings FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can insert settings"
  ON public.system_settings FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update settings"
  ON public.system_settings FOR UPDATE
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete settings"
  ON public.system_settings FOR DELETE
  USING (is_super_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('platform', '{"name": "ViaSetu", "support_email": "support@viasetu.com", "contact_phone": "+91-1800-123-4567", "maintenance_mode": false, "allow_registrations": true}'::jsonb, 'Platform configuration'),
  ('pricing', '{"platform_commission_percent": 10, "prayog_commission_percent": 5, "gst_percent": 18}'::jsonb, 'Pricing and commission structure'),
  ('operations', '{"max_delivery_radius_km": 5000, "real_time_tracking": true, "auto_assign_orders": true}'::jsonb, 'Operational settings');
