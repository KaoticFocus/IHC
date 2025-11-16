# Visual Guide: Enable Google OAuth in Supabase

## 🎯 Goal
Enable Google OAuth provider in your Supabase dashboard so users can sign in with Google.

---

## Step 1: Open Supabase Dashboard

### Option A: Direct Link (Easiest)
**Click this link:** https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers

### Option B: Manual Navigation
1. Go to: https://supabase.com/dashboard
2. Sign in if needed
3. Click on your project: **xppnphkaeczptxuhmpuv**
4. In the left sidebar, click **"Authentication"**
5. Click the **"Providers"** tab

---

## Step 2: Find Google Provider

You should see a page with a list of authentication providers. Look for:

```
┌─────────────────────────────────────────┐
│  Authentication Providers              │
├─────────────────────────────────────────┤
│  Email                                  │
│  [Toggle: ON]                           │
├─────────────────────────────────────────┤
│  Google                                 │  ← FIND THIS ONE
│  [Toggle: OFF]  ← THIS NEEDS TO BE ON  │
│  Client ID: [empty or has value]        │
│  Client Secret: [empty or has value]    │
├─────────────────────────────────────────┤
├─────────────────────────────────────────┤
│  ... (other providers)                  │
└─────────────────────────────────────────┘
```

**What to look for:**
- Provider name: **"Google"**
- Toggle switch: Should be **ON** (green/blue), but currently might be **OFF** (gray)
- Status: Should say **"Enabled"** when ON

---

## Step 3: Enable Google Provider

### If Toggle is OFF (Gray):

1. **Click the toggle switch** next to "Google"
   - It should turn **green/blue** when ON
   - The status should change to **"Enabled"**

2. **Fill in the credentials** (if fields appear):
   - **Client ID (for Google OAuth):** Paste your Google Client ID
   - **Client Secret (for Google OAuth):** Paste your Google Client Secret
   - If you don't have these yet, see Step 4 below

3. **Click "Save"** button at the bottom of the page

4. **Verify:**
   - Toggle is still **ON** (green/blue)
   - Status shows **"Enabled"** with a checkmark ✅
   - No error messages

### If Toggle is Already ON:

1. Check if Client ID and Client Secret are filled in
2. If empty, add them (see Step 4)
3. Click **"Save"** to ensure changes are saved

---

## Step 4: Get Google OAuth Credentials (If Needed)

If you don't have Google Client ID and Secret yet:

### 4.1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### 4.2: Create or Select Project

1. Click the project dropdown at the top (next to "Google Cloud")
2. Either:
   - Click **"New Project"** → Enter name (e.g., "IHC App") → Click **"Create"**
   - OR select an existing project

### 4.3: Enable Google+ API

1. Go to: **APIs & Services** → **Library**
2. Search for: **"Google+ API"** or **"Google Identity"**
3. Click on it
4. Click **"Enable"** button

### 4.4: Configure OAuth Consent Screen

1. Go to: **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in:
   - **App name:** "IHC App" (or your app name)
   - **User support email:** Your email
   - **Developer contact:** Your email
5. Click **"Save and Continue"**
6. On **"Scopes"** page: Click **"Save and Continue"**
7. On **"Test users"** page: Click **"Save and Continue"**
8. On **"Summary"** page: Click **"Back to Dashboard"**

### 4.5: Create OAuth Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, choose **"Web application"**
4. Fill in:
   - **Name:** "IHC App Web Client"
   - **Authorized redirect URIs:** Click **"Add URI"** and add:
     ```
     https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback
     ```
   - Also add (for local testing):
     ```
     http://localhost:5173/auth/callback
     ```
5. Click **"Create"**
6. **IMPORTANT:** Copy both:
   - **Client ID** (long string)
   - **Client Secret** (long string)
   - ⚠️ You won't be able to see the secret again, so copy it now!

### 4.6: Add Credentials to Supabase

1. Go back to Supabase: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers
2. Find **"Google"** provider
3. Make sure toggle is **ON**
4. Paste:
   - **Client ID** → into "Client ID (for Google OAuth)" field
   - **Client Secret** → into "Client Secret (for Google OAuth)" field
5. Click **"Save"**

---

## Step 5: Verify Setup

After enabling Google OAuth, verify:

### In Supabase Dashboard:
- ✅ Google toggle is **ON** (green/blue)
- ✅ Status shows **"Enabled"** with checkmark
- ✅ Client ID field has a value
- ✅ Client Secret field shows dots (hidden)
- ✅ No error messages

### Test in Your App:
1. Open your app
2. Click **"Sign In"** or **"Sign Up"**
3. Click **"Continue with Google"**
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app

---

## 🐛 Troubleshooting

### Error: "Provider is not enabled"
**Fix:** The toggle is OFF. Go back to Step 3 and turn it ON.

### Error: "Redirect URI mismatch"
**Fix:** 
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Make sure this exact URI is added:
   ```
   https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback
   ```
4. No trailing slashes, exact match

### Error: "Invalid credentials"
**Fix:**
1. Double-check Client ID and Client Secret in Supabase
2. Make sure they match Google Cloud Console
3. No extra spaces or characters
4. Try copying and pasting again

### Toggle Won't Stay ON
**Fix:**
1. Make sure you clicked **"Save"** button
2. Wait a few seconds
3. Refresh the page
4. Check if toggle is still ON

### Still Not Working?
1. **Wait 2-3 minutes** - Changes can take time to propagate
2. **Clear browser cache** and try again
3. **Check browser console** (F12) for errors
4. **Verify** you're using the correct Supabase project

---

## 📋 Quick Checklist

- [ ] Opened Supabase dashboard
- [ ] Navigated to Authentication → Providers
- [ ] Found "Google" provider
- [ ] Toggle is **ON** (green/blue)
- [ ] Client ID is entered
- [ ] Client Secret is entered
- [ ] Clicked **"Save"**
- [ ] Verified status shows "Enabled"
- [ ] Tested sign-in with Google

---

## 🎉 Success!

Once Google OAuth is enabled and working:
- Users can sign in with their Google account
- No need to create separate passwords
- Faster onboarding for users

---

**Need Help?** If you're still having issues, check the browser console (F12) for detailed error messages, or run the diagnostic script in your app's browser console: `window.diagnoseSupabase()`

