# Supabase Setup for Project Management

This document explains how to set up Supabase for project data management, including document and image storage.

## Prerequisites

- A Supabase account (https://supabase.com)
- Your Supabase project URL and anon key

## Database Schema Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  address TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  budget DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('document', 'image', 'pdf', 'other')),
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for project_documents
CREATE POLICY "Users can view documents of their own projects"
  ON project_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_documents.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for their own projects"
  ON project_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_documents.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents of their own projects"
  ON project_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_documents.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents of their own projects"
  ON project_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_documents.project_id
      AND projects.user_id = auth.uid()
    )
  );
```

## Storage Bucket Setup

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `project-files`
3. Set it to **Public** (or Private with proper policies)
4. Configure the following policies:

### Storage Policies

```sql
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view files in their own folder
CREATE POLICY "Users can view files in their own folder"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete files in their own folder
CREATE POLICY "Users can delete files in their own folder"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Environment Variables

Make sure your `.env` file contains:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Testing

After setup, you should be able to:

1. Sign in to the application
2. Navigate to "Projects" in the menu
3. Create a new project
4. Upload documents and images
5. View and manage your projects

## Troubleshooting

### "Project management requires Supabase authentication"
- Make sure you're signed in
- Check that your Supabase URL and anon key are configured correctly

### "Failed to upload file"
- Verify the `project-files` bucket exists
- Check that storage policies are set correctly
- Ensure the file size is within Supabase limits (default: 50MB)

### "Permission denied"
- Check that RLS policies are enabled and configured correctly
- Verify you're authenticated with the correct user account
