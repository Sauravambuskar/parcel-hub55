UPDATE public.system_settings 
SET value = jsonb_set(value, '{admin_recipient}', '"saurav@thesalesbridge.com"')
WHERE key = 'email_config';