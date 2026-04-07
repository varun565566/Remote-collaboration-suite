-- Make invite_code nullable so trigger can set it automatically
ALTER TABLE public.workspaces 
ALTER COLUMN invite_code DROP NOT NULL;