-- Drop the existing view
DROP VIEW IF EXISTS public.workspace_member_view;

-- Create a security definer function that returns workspace data
-- This approach allows proper access control without needing RLS on views
CREATE OR REPLACE FUNCTION public.get_user_workspaces()
RETURNS TABLE (
  id uuid,
  name text,
  invite_code text,
  owner_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    w.id,
    w.name,
    CASE 
      WHEN w.owner_id = auth.uid() THEN w.invite_code
      ELSE NULL
    END as invite_code,
    w.owner_id,
    w.created_at,
    w.updated_at
  FROM public.workspaces w
  INNER JOIN public.workspace_members wm ON w.id = wm.workspace_id
  WHERE wm.user_id = auth.uid()
    AND auth.uid() IS NOT NULL;
$$;

-- Grant execute permission only to authenticated users
REVOKE ALL ON FUNCTION public.get_user_workspaces() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_user_workspaces() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_workspaces() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.get_user_workspaces() IS 
'SECURITY: Returns workspaces for authenticated user only. Invite codes visible only to owners.';