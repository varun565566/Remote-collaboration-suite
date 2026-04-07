-- Fix 1: Grant SELECT permission on team_members view (CRITICAL - fixes Dashboard)
-- Views don't use RLS policies, they use GRANT permissions
GRANT SELECT ON public.team_members TO authenticated;

-- Fix 2: Remove legacy role column from profiles table (prevents privilege escalation)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Fix 3: Update handle_new_user function to not insert role into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role TEXT;
BEGIN
  -- Insert into profiles (without role column)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  
  -- Insert into user_roles
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'Developer');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN LOWER(_role) = 'admin' THEN 'admin'::public.app_role
      WHEN LOWER(_role) = 'moderator' THEN 'moderator'::public.app_role
      WHEN LOWER(_role) = 'designer' THEN 'designer'::public.app_role
      ELSE 'developer'::public.app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;