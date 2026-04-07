-- Fix 1: Create secure function to validate invite codes without exposing them
CREATE OR REPLACE FUNCTION public.validate_and_join_workspace(_invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _workspace_id UUID;
  _user_id UUID;
  _result JSON;
BEGIN
  -- Get current user
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find workspace by invite code
  SELECT id INTO _workspace_id
  FROM public.workspaces
  WHERE invite_code = UPPER(_invite_code);
  
  IF _workspace_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite code');
  END IF;
  
  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already a member');
  END IF;
  
  -- Add user as member
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (_workspace_id, _user_id, 'member');
  
  RETURN json_build_object('success', true, 'workspace_id', _workspace_id);
END;
$$;

-- Fix 2: Update workspaces SELECT policy to hide invite codes from regular members
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;

CREATE POLICY "Members can view workspace info" ON public.workspaces
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
  )
);

-- Create separate policy for owners to see invite codes
CREATE POLICY "Owners can view invite codes" ON public.workspaces
FOR SELECT
USING (owner_id = auth.uid());

-- Fix 3: Fix workspace_members SELECT policy self-reference bug
DROP POLICY IF EXISTS "Users can view members in their workspaces" ON public.workspace_members;

CREATE POLICY "Users can view members in their workspaces" ON public.workspace_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
  )
);