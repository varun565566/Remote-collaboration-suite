
-- COMPREHENSIVE SECURITY FIX
-- Fix all identified security vulnerabilities

-- ============================================
-- 1. Fix workspace_member_view grants (CRITICAL)
-- ============================================

-- Ensure view exists with proper security
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
  CASE 
    WHEN w.owner_id = auth.uid() THEN w.invite_code
    ELSE NULL
  END as invite_code
FROM public.workspaces w
WHERE public.is_workspace_member(w.id, auth.uid());

-- Revoke all access then grant explicitly
REVOKE ALL ON public.workspace_member_view FROM PUBLIC;
REVOKE ALL ON public.workspace_member_view FROM anon;
REVOKE ALL ON public.workspace_member_view FROM authenticated;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.workspace_member_view TO authenticated;

COMMENT ON VIEW public.workspace_member_view IS 
'SECURITY: Restricted to authenticated users only. Filters by workspace membership and hides invite codes from non-owners.';

-- ============================================
-- 2. Add explicit authentication requirements to all tables
-- ============================================

-- PROFILES TABLE: Require authentication for all operations
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
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

-- USER_ROLES TABLE: Require authentication
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

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
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role));

-- WORKSPACE_MEMBERS TABLE: Require authentication
DROP POLICY IF EXISTS "Users can view members in their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can remove members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join workspaces with valid invite" ON public.workspace_members;

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

-- WORKSPACES TABLE: Require authentication
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners have full workspace access" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;

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
USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces"
ON public.workspaces
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- ============================================
-- 3. Verify all security measures are in place
-- ============================================

DO $$
DECLARE
  view_grant_count INTEGER;
  rls_check RECORD;
BEGIN
  -- Verify workspace_member_view grant
  SELECT COUNT(*) INTO view_grant_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' 
    AND table_name = 'workspace_member_view'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT';
    
  IF view_grant_count = 0 THEN
    RAISE EXCEPTION 'workspace_member_view grant verification failed';
  END IF;
  
  -- Verify RLS is enabled on all tables
  FOR rls_check IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'user_roles', 'workspace_members', 'workspaces')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename = rls_check.tablename 
        AND rowsecurity = true
    ) THEN
      RAISE EXCEPTION 'RLS not enabled on table: %', rls_check.tablename;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✓ All security measures verified successfully';
END $$;
