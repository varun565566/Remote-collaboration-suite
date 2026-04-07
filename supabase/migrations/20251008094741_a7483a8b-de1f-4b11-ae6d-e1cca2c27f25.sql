-- CRITICAL: Enable Row Level Security on workspaces table
-- This activates all the existing RLS policies to protect workspace data
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;