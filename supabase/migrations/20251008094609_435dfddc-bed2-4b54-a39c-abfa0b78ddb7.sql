-- Remove legacy role column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Update handle_new_user function to only use user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles (no role column)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  
  -- Always default new users to 'developer' role
  -- Admins can change roles later through proper authorization
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'developer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;