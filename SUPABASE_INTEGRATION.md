# Supabase Integration Guide

## Overview

Supabase has been integrated into the IHC Conversation Recorder application to enable cloud sync, backup, and cross-device access. The integration uses a **hybrid storage approach** - data is stored locally first (for offline capability) and automatically synced to Supabase when available.

---

## Setup Instructions

### 1. **Get Your Supabase Credentials**

1. Go to your Supabase dashboard: https://supabase.com/dashboard/org/jsizauqoyprxwqaziodq
2. Select or create a project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key, not the `service_role` key)

### 2. **Configure Environment Variables**

Create a `.env.local` file in the `web/` directory:

```bash
cd web
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. **Set Up Database Schema**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** to execute the SQL

This will create:
- Tables: `users`, `leads`, `transcripts`, `recordings`, `documents`, `scope_of_work`, `user_settings`
- Row Level Security (RLS) policies
- Indexes for performance
- Storage buckets for files

### 4. **Create Storage Buckets**

1. Go to **Storage** in your Supabase dashboard
2. Create two buckets:
   - **`recordings`** (Private)
   - **`documents`** (Private)

3. Set up storage policies (these are included in the schema.sql file):
   - Users can upload their own files
   - Users can view their own files
   - Users can delete their own files

---

## Features Enabled by Supabase

### ✅ **Cloud Sync**
- All leads automatically sync to cloud
- Transcripts backed up to cloud
- Recordings stored in Supabase Storage
- Documents uploaded to cloud storage

### ✅ **User Authentication**
- Sign up with email/password
- Sign in to access cloud data
- Password reset functionality
- User profiles

### ✅ **Cross-Device Access**
- Access your data from any device
- Automatic sync on login
- Offline-first approach (works without internet)

### ✅ **Data Backup**
- Automatic backup of all data
- Recovery if device is lost
- Version history (via Supabase)

### ✅ **Security**
- Row Level Security (RLS) - users can only access their own data
- Encrypted storage
- Secure API keys

---

## How It Works

### **Hybrid Storage Architecture**

```
┌─────────────────────────────────────────┐
│         User Action (Save Lead)         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     1. Save to Local Storage (IndexedDB) │  ← Always happens first
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────┴────────┐
         │ Supabase        │
         │ Configured?     │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
    YES  │                 │  NO
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│ 2. Sync to      │  │ Use Local    │
│    Supabase     │  │ Storage Only │
│    (Cloud)      │  │              │
└─────────────────┘  └──────────────┘
```

### **Automatic Sync**

- **On App Load**: If user is authenticated, sync from cloud to local
- **On Save**: Save locally first, then sync to cloud in background
- **On Login**: Pull all cloud data to local storage
- **Manual Sync**: User can trigger sync from Settings

---

## Usage

### **1. Configure Supabase (First Time)**

1. Open **Settings** (gear icon)
2. Scroll to **Cloud Sync (Supabase)** section
3. Enter your Supabase URL and Anon Key
4. Click **Save**

### **2. Sign Up / Sign In**

1. Click the **Account** icon in the top bar
2. Choose **Sign Up** to create an account, or **Sign In** if you have one
3. Enter your email and password
4. After sign up, check your email to verify your account

### **3. Cloud Sync**

Once authenticated:
- All new leads automatically sync to cloud
- Transcripts are backed up
- Recordings uploaded to cloud storage
- Access your data from any device by signing in

### **4. Manual Sync**

In Settings, click **"Sync to Cloud"** to manually sync all local data to Supabase.

---

## Database Schema

### **Tables Created**

1. **`users`** - User profiles (extends Supabase auth.users)
2. **`leads`** - Customer leads with full details
3. **`transcripts`** - Conversation transcripts with AI analysis
4. **`recordings`** - Audio recording metadata
5. **`documents`** - Project documents and files
6. **`scope_of_work`** - Generated scope documents
7. **`user_settings`** - User preferences and settings

### **Storage Buckets**

1. **`recordings`** - Audio files (private, user-scoped)
2. **`documents`** - Document files (private, user-scoped)

---

## Security

### **Row Level Security (RLS)**

All tables have RLS enabled. Users can only:
- View their own data
- Create data associated with their user_id
- Update/delete their own data

### **Storage Policies**

Storage buckets have policies that ensure:
- Users can only upload to their own folder (`{user_id}/`)
- Users can only view/download their own files
- Users can only delete their own files

---

## API Reference

### **HybridStorageService**

```typescript
// Save lead (syncs to cloud if available)
await HybridStorageService.saveLead(lead);

// Delete lead (syncs to cloud)
await HybridStorageService.deleteLead(id);

// Upload recording to cloud
await HybridStorageService.uploadRecording(id, blob, transcriptId);

// Sync local data to cloud
await HybridStorageService.syncToCloud();

// Sync cloud data to local
await HybridStorageService.syncFromCloud();

// Check if cloud is enabled
const isEnabled = HybridStorageService.isCloudEnabled();
```

### **Auth Context**

```typescript
import { useAuth } from '../context/AuthContext';

const { user, session, signIn, signUp, signOut } = useAuth();

// Sign in
await signIn(email, password);

// Sign up
await signUp(email, password, fullName);

// Sign out
await signOut();
```

---

## Troubleshooting

### **"Supabase not configured"**
- Make sure `.env.local` file exists with correct credentials
- Or configure via Settings modal

### **"Authentication failed"**
- Check your Supabase URL and Anon Key
- Ensure email verification is completed (check spam folder)
- Verify RLS policies are set up correctly

### **"Sync failed"**
- Check internet connection
- Verify Supabase project is active
- Check browser console for specific error messages

### **"Storage upload failed"**
- Ensure storage buckets (`recordings`, `documents`) are created
- Verify storage policies are set up
- Check file size limits (Supabase has limits)

---

## Benefits

### **For Users**
- ✅ Access data from any device
- ✅ Automatic backup
- ✅ Never lose data
- ✅ Faster setup on new devices

### **For Developers**
- ✅ Scalable backend
- ✅ Built-in authentication
- ✅ Real-time capabilities (can be added)
- ✅ Analytics and monitoring

---

## Next Steps

### **Optional Enhancements**
1. **Real-time Sync**: Use Supabase Realtime for live updates
2. **Team Collaboration**: Share leads/transcripts with team members
3. **Advanced Analytics**: Query Supabase for business insights
4. **Webhooks**: Trigger actions on data changes
5. **Backup Automation**: Scheduled backups

---

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)

---

**Status**: ✅ Supabase Integration Complete

The application now supports both local-only and cloud-synced modes, giving users flexibility while providing enterprise-grade backup and sync capabilities.

