-- Update the handle_new_user function to work with phone authentication
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, phone)
  VALUES (new.id, new.phone)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;