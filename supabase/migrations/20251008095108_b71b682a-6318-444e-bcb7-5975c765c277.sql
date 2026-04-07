-- Fix workspaces table public exposure
-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Members can view workspace info" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can view invite codes" ON public.workspaces;

-- Recreate policies to only allow authenticated users
CREATE POLICY "Members can view workspace info"
ON public.workspaces
FOR SELECT
TO authenticated
USING (public.is_workspace_member(id, auth.uid()));

CREATE POLICY "Owners can view invite codes"
ON public.workspaces
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());