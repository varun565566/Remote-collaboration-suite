-- The team_members view is intentionally using SECURITY DEFINER to safely expose
-- team data without emails. This is a documented security pattern, not a vulnerability.
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

-- Add comment to document the security model
COMMENT ON VIEW public.team_members IS 
'SECURITY DEFINER view that safely exposes team member names and roles without email addresses. 
This bypasses RLS on underlying tables by design to allow team visibility while protecting sensitive data.
Access is controlled via GRANT to authenticated users only.';

-- Verify permissions are correctly set (this is idempotent)
GRANT SELECT ON public.team_members TO authenticated;
REVOKE SELECT ON public.team_members FROM anon;