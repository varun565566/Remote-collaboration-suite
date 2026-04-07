-- Fix invite code exposure to non-owner members
-- PostgreSQL RLS doesn't support column-level security, so we need a different approach

-- Drop the existing SELECT policies
DROP POLICY IF EXISTS "Members can view workspace info" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can view invite codes" ON public.workspaces;

-- Create a single policy that only shows invite_code to owners
-- For non-owners, they won't be able to query the workspaces table directly
CREATE POLICY "Only owners can view full workspace details"
ON public.workspaces
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Create a view for workspace members that excludes invite_code
CREATE OR REPLACE VIEW public.workspace_member_view AS
SELECT 
  id,
  name,
  owner_id,
  created_at,
  updated_at,
  CASE 
    WHEN owner_id = auth.uid() THEN invite_code
    ELSE NULL
  END as invite_code
FROM public.workspaces
WHERE public.is_workspace_member(id, auth.uid());

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.workspace_member_view TO authenticated;

-- Create a policy on the view (though views inherit RLS from base tables)
-- This ensures the view respects workspace membership
COMMENT ON VIEW public.workspace_member_view IS 'Secure view that shows workspace info to members but hides invite codes from non-owners';