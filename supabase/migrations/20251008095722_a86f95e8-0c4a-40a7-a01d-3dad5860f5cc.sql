-- Fix missing grants on workspace_member_view
-- The view was created but grants weren't properly applied

-- First, ensure the view exists with proper security settings
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

-- Explicitly revoke all default grants
REVOKE ALL ON public.workspace_member_view FROM PUBLIC;
REVOKE ALL ON public.workspace_member_view FROM anon;
REVOKE ALL ON public.workspace_member_view FROM authenticated;

-- Grant SELECT specifically to authenticated role
GRANT SELECT ON public.workspace_member_view TO authenticated;

-- Verify the grant was applied
DO $$
DECLARE
  grant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO grant_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' 
    AND table_name = 'workspace_member_view'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT';
    
  IF grant_count = 0 THEN
    RAISE EXCEPTION 'Failed to grant SELECT on workspace_member_view to authenticated';
  END IF;
  
  RAISE NOTICE 'Successfully granted SELECT on workspace_member_view to authenticated';
END $$;

-- Add security documentation
COMMENT ON VIEW public.workspace_member_view IS 
'SECURITY MODEL:
- security_invoker: View executes with permissions of querying user
- security_barrier: Prevents info leakage through query optimization  
- Base table RLS: workspaces table has RLS enabled with member policies
- Membership filter: WHERE clause restricts to workspace members via is_workspace_member()
- Invite code protection: CASE filters invite_code to owners only
- Access control: GRANT limited to authenticated role only
- Anonymous users: Completely blocked via REVOKE';
