-- Migration: Add project_id to consultations table
-- This ensures all consultations (and their photos) are associated with a project and client

-- Add project_id column to consultations table
ALTER TABLE public.consultations 
ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_consultations_project_id ON public.consultations(project_id);

-- Update existing consultations to link to projects if client_name matches
-- This is a one-time migration for existing data
-- Note: This assumes consultations with matching client names belong to the same project
UPDATE public.consultations c
SET project_id = (
  SELECT p.id 
  FROM public.projects p 
  WHERE p.client_name = c.client_name 
    AND p.user_id = c.user_id 
  LIMIT 1
)
WHERE c.project_id IS NULL 
  AND c.client_name IS NOT NULL;

