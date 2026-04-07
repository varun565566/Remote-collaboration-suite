-- Drop the insecure team_members view that bypasses RLS
DROP VIEW IF EXISTS public.team_members;

-- The view is no longer needed as we'll query workspace_members
-- with proper RLS policies that are already in place