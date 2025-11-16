# Supabase Database Setup Guide

This guide will walk you through setting up your Supabase database with all the required tables, policies, and storage buckets.

## Prerequisites

- A Supabase account (https://supabase.com)
- Your Supabase project URL: `https://xppnphkaeczptxuhmpuv.supabase.co`
- Access to your Supabase dashboard

## Step 1: Run the Database Schema

1. **Open your Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv
   - Navigate to **SQL Editor** (in the left sidebar)

2. **Copy and paste the entire schema:**
   - Open the file `supabase/schema.sql` in your project
   - Copy **ALL** the contents (from line 1 to the end)
   - Paste it into the SQL Editor in Supabase

3. **Run the SQL:**
   - Click the **"Run"** button (or press Ctrl+Enter / Cmd+Enter)
   - Wait for it to complete (should take a few seconds)
   - You should see "Success. No rows returned" or similar success message

## Step 2: Create Storage Buckets

1. **Navigate to Storage:**
   - In your Supabase dashboard, go to **Storage** (left sidebar)

2. **Create the following buckets (one at a time):**

   **Bucket 1: `recordings`**
   - Click **"New bucket"**
   - Name: `recordings`
   - **Public**: OFF (Private)
   - Click **"Create bucket"**

   **Bucket 2: `documents`**
   - Click **"New bucket"**
   - Name: `documents`
   - **Public**: OFF (Private)
   - Click **"Create bucket"**

   **Bucket 3: `consultation-photos`**
   - Click **"New bucket"**
   - Name: `consultation-photos`
   - **Public**: OFF (Private)
   - Click **"Create bucket"**

   **Bucket 4: `project-files`**
   - Click **"New bucket"**
   - Name: `project-files`
   - **Public**: OFF (Private)
   - Click **"Create bucket"**

## Step 3: Set Up Storage Policies

1. **Go back to SQL Editor** in Supabase

2. **Run this SQL to create storage policies:**

```sql
-- Storage Policies for recordings bucket
CREATE POLICY "Users can upload own recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own recordings"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for documents bucket
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for consultation-photos bucket
CREATE POLICY "Users can upload own consultation photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'consultation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own consultation photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'consultation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own consultation photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'consultation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for project-files bucket
CREATE POLICY "Users can upload own project files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own project files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own project files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

3. **Click "Run"** to execute the storage policies

## Step 4: Verify Setup

### Check Tables Were Created:

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - ✅ `users`
   - ✅ `leads`
   - ✅ `transcripts`
   - ✅ `recordings`
   - ✅ `documents`
   - ✅ `scope_of_work`
   - ✅ `user_settings`
   - ✅ `consultations`
   - ✅ `consultation_photos`
   - ✅ `projects`
   - ✅ `project_documents`

### Check Storage Buckets:

1. Go to **Storage** in Supabase dashboard
2. You should see these buckets:
   - ✅ `recordings`
   - ✅ `documents`
   - ✅ `consultation-photos`
   - ✅ `project-files`

### Check RLS Policies:

1. Go to **Authentication** → **Policies** in Supabase dashboard
2. You should see policies for all tables listed above

## Step 5: Enable Google OAuth (Optional but Recommended)

See `web/OAUTH_SETUP.md` for detailed instructions on enabling Google sign-in.

## Troubleshooting

### "Table already exists" errors
- This is OK! The schema uses `CREATE TABLE IF NOT EXISTS`, so existing tables won't be affected
- You can safely run the schema multiple times

### "Policy already exists" errors
- This is OK! Policies are idempotent
- You can safely run the storage policies multiple times

### "Bucket already exists" errors
- If a bucket already exists, you can skip creating it
- Just make sure all 4 buckets exist

### "Permission denied" errors
- Make sure you're running the SQL as a database administrator
- Check that RLS policies were created correctly
- Verify storage policies are set up

## What Was Created?

### Database Tables:
- **users** - User profiles
- **leads** - Customer leads
- **transcripts** - Conversation transcripts
- **recordings** - Audio recording metadata
- **documents** - General documents
- **scope_of_work** - Generated scope documents
- **user_settings** - User preferences
- **consultations** - Consultation records
- **consultation_photos** - Photos attached to consultations
- **projects** - Project management
- **project_documents** - Documents/photos attached to projects

### Security:
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Policies ensure users can only access their own data
- ✅ Storage policies ensure users can only access their own files

### Performance:
- ✅ Indexes created on frequently queried columns
- ✅ Triggers for automatic `updated_at` timestamps

## Next Steps

1. ✅ Database schema is set up
2. ✅ Storage buckets are created
3. ✅ Storage policies are configured
4. ⏭️ Enable Google OAuth (see `web/OAUTH_SETUP.md`)
5. ⏭️ Test the application by signing in and creating a project

Your Supabase database is now ready to use! 🎉

