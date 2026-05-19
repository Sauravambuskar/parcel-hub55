
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS admin_email_sent_at timestamptz;

INSERT INTO public.system_settings (key, value, description)
VALUES (
  'email_config',
  jsonb_build_object(
    'enabled', true,
    'admin_recipient', 'uday@viasetu.com',
    'cc_recipients', '',
    'sender_name', 'ViaSetu Orders',
    'sender_email', 'onboarding@resend.dev'
  ),
  'Admin order notification email configuration'
)
ON CONFLICT (key) DO NOTHING;
