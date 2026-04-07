-- Add unique constraint on invite_code if it doesn't exist
-- This ensures each workspace has a unique invite code
ALTER TABLE public.workspaces 
DROP CONSTRAINT IF EXISTS workspaces_invite_code_key;

ALTER TABLE public.workspaces 
ADD CONSTRAINT workspaces_invite_code_key UNIQUE (invite_code);

-- Ensure the trigger fires BEFORE insert to set invite_code
DROP TRIGGER IF EXISTS set_workspace_invite_code_trigger ON public.workspaces;

CREATE TRIGGER set_workspace_invite_code_trigger
  BEFORE INSERT ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.set_workspace_invite_code();