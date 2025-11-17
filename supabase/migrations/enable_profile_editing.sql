-- Migration: Enable Profile Editing
-- This migration ensures users can insert, update, and edit their profile data
-- Run this in your Supabase SQL Editor

-- 1. Add INSERT policy for users (allows users to create their own profile)
-- Check if policy exists, drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Ensure UPDATE policy exists (should already exist, but recreate to be sure)
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2. Add trigger to automatically update updated_at timestamp on users table
-- First, ensure the function exists (should already exist from schema.sql)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Ensure all profile fields are editable (they should be by default, but verify)
-- The following fields should already exist from schema.sql and add_profile_fields.sql:
-- - email (TEXT)
-- - full_name (TEXT)
-- - first_name (TEXT)
-- - last_name (TEXT)
-- - phone (TEXT)
-- - work_email (TEXT)
-- - avatar_url (TEXT)

-- Add any missing columns if they don't exist
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS work_email TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Grant necessary permissions (should already be handled by RLS, but ensure)
-- RLS policies handle access control, but we can verify the table is accessible
-- No explicit GRANT statements needed as RLS handles this

-- 5. Create index on user_id for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- Verification queries (optional - run these to verify the setup)
-- SELECT * FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
-- SELECT * FROM pg_trigger WHERE tgname = 'update_users_updated_at';
-- \d public.users

