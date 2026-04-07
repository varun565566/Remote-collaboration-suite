-- Fix security definer view warning by recreating view without security definer
DROP VIEW IF EXISTS public.workspace_member_view;

-- Recreate view as a regular view (not security definer)
CREATE VIEW public.workspace_member_view 
WITH (security_invoker = true)
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

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.workspace_member_view TO authenticated;