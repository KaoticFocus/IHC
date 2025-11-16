# Profile Editing Setup Guide

## Overview

The app now supports full profile editing with:
- First Name & Last Name
- Phone Number
- Work Email (separate from login email, especially useful for Google OAuth users)
- Profile Image Upload

## Database Setup

### Step 1: Run Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/sql/new
2. Copy and paste the contents of `supabase/migrations/add_profile_fields.sql`
3. Click **"Run"** to execute the migration

This will add the new profile fields to your `users` table.

### Step 2: Create Avatars Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name:** `avatars`
   - **Public bucket:** ✅ **Yes** (check this box)
   - Click **"Create bucket"**

### Step 3: Set Up Storage Policies

The storage policies should be created automatically, but you can verify:

1. Go to **Storage** → **Policies** → Select `avatars` bucket
2. You should see policies for:
   - Users can upload own avatar
   - Anyone can view avatars
   - Users can update own avatar
   - Users can delete own avatar

If these don't exist, you can create them manually or run the SQL from the migration file.

## Using Profile Editing

### Accessing Profile Editor

1. **When signed in:** Click the account icon (👤) in the top-right toolbar
2. The profile editor modal will open

### Editing Profile

1. **Name Fields:**
   - Enter your **First Name** and **Last Name**
   - These will automatically combine into `full_name`

2. **Phone Number:**
   - Enter your phone number in any format
   - Example: `(555) 123-4567` or `555-123-4567`

3. **Work Email:**
   - Enter your work email address
   - This is separate from your login email
   - Especially useful if you sign in with Google but want to use a different email for work

4. **Profile Image:**
   - Click the camera icon on your avatar
   - Select an image file (max 5MB)
   - Supported formats: JPG, PNG, GIF, WebP
   - The image will be uploaded and displayed immediately

### For Google OAuth Users

- Your **Login Email** is managed by Google and cannot be changed
- You can set a different **Work Email** for business communications
- Your profile image can be different from your Google profile picture

## Features

- ✅ Real-time profile updates
- ✅ Automatic `full_name` generation from first/last name
- ✅ Image upload with validation (file type, size)
- ✅ Profile image displayed in header when set
- ✅ Separate work email for business use
- ✅ Works with both email/password and Google OAuth

## Troubleshooting

### Profile image not uploading?

1. Check that the `avatars` bucket exists and is public
2. Verify storage policies are set up correctly
3. Check browser console for errors
4. Ensure image is under 5MB

### Profile fields not saving?

1. Check that you ran the database migration
2. Verify you're signed in
3. Check browser console for errors
4. Ensure Supabase is properly configured

### Can't see profile editor?

1. Make sure you're signed in
2. Click the account icon in the top-right
3. If you see the sign-in modal instead, you need to sign in first

