# QUICK FIX: Enable Google OAuth in Supabase

## The Problem
You're getting: `"Unsupported provider: provider is not enabled"`

This means **Google OAuth is OFF** in your Supabase dashboard.

## The Solution (2 minutes)

### Step 1: Open Supabase Dashboard
Click this link: **https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers**

### Step 2: Enable Google
1. Scroll down to find **"Google"** in the provider list
2. Look for a **toggle switch** next to "Google"
3. **Click the toggle to turn it ON** (it should turn green/blue)
4. If you see fields for "Client ID" and "Client Secret", fill them in:
   - **Client ID:** Your Google OAuth Client ID (from Google Cloud Console)
   - **Client Secret:** Your Google OAuth Client Secret (from Google Cloud Console)
5. Click **"Save"** button at the bottom

### Step 3: Verify
- The Google provider should now show **"Enabled"** with a green checkmark
- The toggle should be **ON**

### Step 4: Test
Go back to your app and try signing in with Google again.

---

## If You Don't Have Google OAuth Credentials Yet

You need to create them in Google Cloud Console first:

### Quick Setup:
1. Go to: https://console.cloud.google.com/
2. Create a project (or select existing)
3. Go to: APIs & Services → Credentials
4. Click "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add redirect URI: `https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback`
7. Copy the Client ID and Client Secret
8. Go back to Supabase and paste them in (Step 2 above)

---

## Still Not Working?

1. **Refresh the Supabase page** - Sometimes changes need a refresh
2. **Wait 1-2 minutes** - Changes can take a moment to propagate
3. **Check the toggle again** - Make absolutely sure it's ON (not OFF)
4. **Check browser console** - Press F12, look for errors

---

## Direct Links

- **Supabase Providers Page:** https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers
- **Google Cloud Console:** https://console.cloud.google.com/

---

**The toggle must be ON. That's the #1 issue!**

