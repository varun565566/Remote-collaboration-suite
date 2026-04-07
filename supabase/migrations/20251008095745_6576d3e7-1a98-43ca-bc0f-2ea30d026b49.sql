-- Fix anonymous access warnings by ensuring all policies use authenticated role only

-- Fix workspace_members policies
DROP POLICY IF EXISTS "Users can view members in their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can remove members" ON public.workspace_members;

CREATE POLICY "Users can view members in their workspaces"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Owners can remove members"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = workspace_members.workspace_id 
      AND owner_id = auth.uid()
  )
);

-- Fix user_roles policies  
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Note: workspace_member_view doesn't need RLS policies
-- It's a view that inherits security from the workspaces base table
-- and has additional security through:
-- 1. security_barrier = true
-- 2. security_invoker = true  
-- 3. GRANT restricted to authenticated only
-- 4. WHERE clause filtering to workspace members
-- This is the correct security model for PostgreSQL views