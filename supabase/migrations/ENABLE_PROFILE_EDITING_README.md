# Enable Profile Editing Migration

## Overview

This migration ensures that users can fully edit their profile data in the database. It adds the necessary Row Level Security (RLS) policies and triggers to enable profile editing functionality.

## What This Migration Does

1. **Adds INSERT Policy**: Allows users to create their own profile when they sign up
2. **Ensures UPDATE Policy**: Confirms users can update their own profile data
3. **Adds Updated Timestamp Trigger**: Automatically updates the `updated_at` field when profile data changes
4. **Verifies All Profile Fields**: Ensures all profile fields (email, full_name, first_name, last_name, phone, work_email, avatar_url) exist and are editable

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Copy and paste the contents of `enable_profile_editing.sql`
5. Click **"Run"** to execute the migration

### Option 2: Supabase CLI

If you're using Supabase CLI:

```bash
supabase db push
```

Or manually:

```bash
psql -h <your-db-host> -U postgres -d postgres -f supabase/migrations/enable_profile_editing.sql
```

## What Gets Changed

### RLS Policies

- **INSERT Policy**: `"Users can insert own profile"` - Users can create their own profile record
- **UPDATE Policy**: `"Users can update own profile"` - Users can update their own profile data

### Database Triggers

- **update_users_updated_at**: Automatically sets `updated_at = NOW()` whenever a user profile is updated

### Table Structure

The migration ensures these columns exist in `public.users`:
- `id` (UUID, Primary Key)
- `email` (TEXT)
- `full_name` (TEXT)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `phone` (TEXT)
- `work_email` (TEXT)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## Verification

After running the migration, you can verify it worked by:

1. **Check Policies**:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'users' AND schemaname = 'public';
   ```
   You should see both INSERT and UPDATE policies.

2. **Check Trigger**:
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname = 'update_users_updated_at';
   ```
   The trigger should exist.

3. **Test Profile Update**:
   - Sign in to your app
   - Try editing your profile
   - Verify the `updated_at` timestamp changes

## Troubleshooting

### Error: "relation does not exist"
- Make sure you've run the main `schema.sql` first
- The `users` table must exist before running this migration

### Error: "permission denied"
- Ensure you're running the migration as a database superuser (postgres role)
- Check that RLS is enabled on the users table: `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;`

### Policy Already Exists
- The migration uses `DROP POLICY IF EXISTS` and `CREATE POLICY`, so it's safe to run multiple times
- If you get an error about policies existing, the migration will recreate them correctly

## Related Files

- `supabase/schema.sql` - Main database schema
- `supabase/migrations/add_profile_fields.sql` - Adds profile fields
- `web/src/context/AuthContext.tsx` - Frontend profile update logic
- `web/src/components/ProfileEditModal.tsx` - Profile editing UI

## Notes

- This migration is **idempotent** - it's safe to run multiple times
- All changes are backward compatible
- Existing user data will not be affected
- The migration only adds policies and triggers; it doesn't modify existing data

