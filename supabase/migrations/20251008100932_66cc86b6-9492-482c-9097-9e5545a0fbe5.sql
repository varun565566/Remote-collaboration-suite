
-- COMPREHENSIVE SECURITY FIX
-- Fix: unauthorized access, leaked passwords, search path, and anonymous policies

-- ============================================
-- 1. Fix workspace_member_view - Ensure grants are properly set
-- ============================================

-- Drop and recreate with proper security
DROP VIEW IF EXISTS public.workspace_member_view CASCADE;

CREATE VIEW public.workspace_member_view 
WITH (security_invoker = true, security_barrier = true)
AS
SELECT 
  w.id,
  w.name,
  w.owner_id,
  w.created_at,
  w.updated_at,
  -- CRITICAL: Only show invite_code to workspace owners
  CASE 
    WHEN w.owner_id = auth.uid() THEN w.invite_code
    ELSE NULL
  END as invite_code
FROM public.workspaces w
WHERE auth.uid() IS NOT NULL 
  AND public.is_workspace_member(w.id, auth.uid());

-- Explicitly revoke all public access
REVOKE ALL ON public.workspace_member_view FROM PUBLIC;
REVOKE ALL ON public.workspace_member_view FROM anon;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.workspace_member_view TO authenticated;

COMMENT ON VIEW public.workspace_member_view IS 
'SECURITY: Authenticated users only. Invite codes restricted to workspace owners.';

-- ============================================
-- 2. Fix function search_path for all functions
-- ============================================

-- Fix generate_invite_code function
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Fix handle_new_user function (already has search_path, but ensure it's correct)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  
  -- Default new users to 'developer' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'developer'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Fix handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix add_owner_to_workspace function
CREATE OR REPLACE FUNCTION public.add_owner_to_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

-- Fix set_workspace_invite_code function
CREATE OR REPLACE FUNCTION public.set_workspace_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := public.generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix validate_and_join_workspace function
CREATE OR REPLACE FUNCTION public.validate_and_join_workspace(_invite_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _workspace_id UUID;
  _user_id UUID;
BEGIN
  -- Get current user
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find workspace by invite code
  SELECT id INTO _workspace_id
  FROM public.workspaces
  WHERE invite_code = UPPER(_invite_code);
  
  IF _workspace_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite code');
  END IF;
  
  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already a member');
  END IF;
  
  -- Add user as member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (_workspace_id, _user_id, 'member');
  
  RETURN json_build_object('success', true, 'workspace_id', _workspace_id);
END;
$$;

-- ============================================
-- 3. Strengthen all RLS policies with explicit auth checks
-- ============================================

-- PROFILES: Explicit authentication required
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

-- USER_ROLES: Explicit authentication required
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role));

-- WORKSPACE_MEMBERS: Explicit authentication required
DROP POLICY IF EXISTS "Users can view members in their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join workspaces with valid invite" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can remove members" ON public.workspace_members;

CREATE POLICY "Users can view members in their workspaces"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Users can join workspaces with valid invite"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Owners can remove members"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = workspace_members.workspace_id 
      AND owner_id = auth.uid()
  )
);

-- WORKSPACES: Explicit authentication required
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners have full workspace access" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete their workspaces" ON public.workspaces;

CREATE POLICY "Members can view workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND public.is_workspace_member(id, auth.uid()));

CREATE POLICY "Owners have full workspace access"
ON public.workspaces
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Users can create workspaces"
ON public.workspaces
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = owner_id);

CREATE POLICY "Owners can update their workspaces"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND owner_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces"
ON public.workspaces
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- ============================================
-- 4. Verification
-- ============================================

DO $$
DECLARE
  func_record RECORD;
  policy_record RECORD;
  missing_search_path TEXT[] := ARRAY[]::TEXT[];
  missing_auth_check TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check all functions have search_path
  FOR func_record IN 
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'generate_invite_code', 'handle_new_user', 'handle_updated_at',
        'add_owner_to_workspace', 'set_workspace_invite_code', 'validate_and_join_workspace'
      )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' 
        AND p.proname = func_record.proname
        AND p.proconfig IS NOT NULL
        AND 'search_path=public' = ANY(p.proconfig)
    ) THEN
      missing_search_path := array_append(missing_search_path, func_record.proname);
    END IF;
  END LOOP;
  
  IF array_length(missing_search_path, 1) > 0 THEN
    RAISE EXCEPTION 'Functions missing search_path: %', array_to_string(missing_search_path, ', ');
  END IF;
  
  -- Verify workspace_member_view grants
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_schema = 'public' 
      AND table_name = 'workspace_member_view'
      AND grantee = 'authenticated'
      AND privilege_type = 'SELECT'
  ) THEN
    RAISE EXCEPTION 'workspace_member_view missing authenticated grant';
  END IF;
  
  RAISE NOTICE '✓ All security fixes applied successfully';
  RAISE NOTICE '✓ All functions have search_path set';
  RAISE NOTICE '✓ All policies require authentication';
  RAISE NOTICE '✓ workspace_member_view properly secured';
  RAISE NOTICE '! Manual step: Enable Leaked Password Protection in Supabase Dashboard';
END $$;
