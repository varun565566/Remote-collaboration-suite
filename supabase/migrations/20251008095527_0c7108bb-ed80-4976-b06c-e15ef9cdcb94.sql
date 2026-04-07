-- Views cannot have RLS directly in PostgreSQL - they inherit from base tables
-- However, we can add explicit security documentation and ensure proper grants

-- Revoke public access to the view (if any)
REVOKE ALL ON public.workspace_member_view FROM PUBLIC;
REVOKE ALL ON public.workspace_member_view FROM anon;

-- Only grant to authenticated users
GRANT SELECT ON public.workspace_member_view TO authenticated;

-- Add security barrier to the view to ensure RLS is enforced
DROP VIEW IF EXISTS public.workspace_member_view;

CREATE VIEW public.workspace_member_view 
WITH (security_invoker = true, security_barrier = true)
AS
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

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.workspace_member_view TO authenticated;

-- Add comprehensive security documentation
COMMENT ON VIEW public.workspace_member_view IS 
E'SECURITY: This view is protected by:\n'
'1. security_invoker = true: Uses querying user permissions\n'
'2. security_barrier = true: Prevents leaking data through query optimization\n'
'3. WHERE clause filters to workspace members only via is_workspace_member()\n'
'4. CASE statement filters invite_code to owners only\n'
'5. Base table (workspaces) has RLS enabled with member/owner policies\n'
'6. GRANT restricted to authenticated role only';

-- Verify the underlying table security
DO $$ 
BEGIN
  -- Ensure workspaces table has RLS enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = 'workspaces' 
      AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS must be enabled on workspaces table';
  END IF;
END $$;