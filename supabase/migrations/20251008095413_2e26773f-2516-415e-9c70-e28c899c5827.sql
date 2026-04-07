-- Fix workspace_member_view RLS configuration
-- The issue is that the base table policy is too restrictive for the view to work

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Only owners can view full workspace details" ON public.workspaces;

-- Add back a policy that allows workspace members to SELECT
-- but the view will handle filtering invite codes
CREATE POLICY "Members can view workspaces"
ON public.workspaces
FOR SELECT
TO authenticated
USING (
  public.is_workspace_member(id, auth.uid())
);

-- Add a separate policy for owners to ensure they have full access
CREATE POLICY "Owners have full workspace access"
ON public.workspaces
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Add comment explaining security model
COMMENT ON VIEW public.workspace_member_view IS 
'Secure view for workspace access. Members can view basic info, but invite_code is only visible to owners via CASE statement. RLS on base table ensures only workspace members can query.';

-- Verify RLS is enabled on workspaces table
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;