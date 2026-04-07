-- Fix infinite recursion in workspace_members RLS policy
-- Create a security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = _workspace_id
      AND user_id = _user_id
  );
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view members in their workspaces" ON public.workspace_members;

-- Recreate it using the security definer function
CREATE POLICY "Users can view members in their workspaces"
ON public.workspace_members
FOR SELECT
TO public
USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Drop the problematic workspace policy as well
DROP POLICY IF EXISTS "Members can view workspace info" ON public.workspaces;

-- Recreate it using the security definer function
CREATE POLICY "Members can view workspace info"
ON public.workspaces
FOR SELECT
TO public
USING (public.is_workspace_member(id, auth.uid()));

-- Recreate the trigger to automatically add workspace owner to workspace_members
CREATE OR REPLACE FUNCTION public.add_owner_to_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS add_owner_to_workspace_trigger ON public.workspaces;

-- Create trigger
CREATE TRIGGER add_owner_to_workspace_trigger
AFTER INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.add_owner_to_workspace();

-- Also recreate the invite code trigger
CREATE OR REPLACE FUNCTION public.set_workspace_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_workspace_invite_code_trigger ON public.workspaces;

-- Create trigger for invite codes
CREATE TRIGGER set_workspace_invite_code_trigger
BEFORE INSERT ON public.workspaces
FOR EACH ROW
EXECUTE FUNCTION public.set_workspace_invite_code();