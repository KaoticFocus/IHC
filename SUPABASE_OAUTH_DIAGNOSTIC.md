# Supabase OAuth Diagnostic Checklist

Use this checklist to verify your Supabase OAuth setup is correct.

## ✅ Step 1: Verify Environment Variables

Check that your environment variables are set correctly:

### For Local Development:
1. Check `web/.env` file exists and contains:
```env
VITE_SUPABASE_URL=https://xppnphkaeczptxuhmpuv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwcG5waGthZWN6cHR4dWhtcHV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjI5NjcsImV4cCI6MjA3NzU5ODk2N30.kpDnIY0XgJWO2BX2uzXipt9JXXyFnz3_LVailKg_ySg
```

### For Netlify:
1. Go to: Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. Verify these are set:
   - `VITE_SUPABASE_URL` = `https://xppnphkaeczptxuhmpuv.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (your anon key)

## ✅ Step 2: Verify Supabase Project Access

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv
   - Make sure you can access it and see your project

2. **Check Project Status:**
   - Project should show as "Active" or "Running"
   - No error messages visible

## ✅ Step 3: Check Google OAuth Provider Status

1. **Navigate to Providers Page:**
   - Direct link: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers
   - Or: Authentication → Providers

2. **Find Google Provider:**
   - Scroll down to find "Google" in the list
   - Look for these indicators:

   **✅ CORRECT SETUP:**
   - Toggle switch is **ON** (green/blue)
   - Status shows "Enabled" with checkmark
   - Client ID field has a value (your Google Client ID)
   - Client Secret field has dots/hidden value

   **❌ INCORRECT SETUP:**
   - Toggle switch is **OFF** (gray)
   - Status shows "Disabled"
   - Client ID or Client Secret fields are empty

3. **If Google is Disabled:**
   - Click the toggle to turn it **ON**
   - Enter your Google Client ID
   - Enter your Google Client Secret
   - Click **"Save"** button
   - Wait for success message
   - Verify toggle is still ON

## ✅ Step 4: Verify Google Cloud Console Setup

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com/

2. **Check OAuth Client:**
   - APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID
   - Click on it to view details

3. **Verify Authorized Redirect URIs:**
   - Should include: `https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback`
   - Must match exactly (no trailing slashes)

4. **Check OAuth Consent Screen:**
   - APIs & Services → OAuth consent screen
   - Should be configured (not in "Testing" mode if you want public access)

## ✅ Step 5: Test the Connection

1. **In Browser Console (F12):**
   - Open your app
   - Open DevTools → Console tab
   - Try signing in with Google
   - Look for any error messages

2. **Check Network Tab:**
   - DevTools → Network tab
   - Filter by "auth" or "oauth"
   - Try signing in with Google
   - Look at the request to Supabase
   - Check the response - does it show the error?

## ✅ Step 6: Common Issues and Fixes

### Issue: "Provider is not enabled"
**Fix:** Go to Supabase → Authentication → Providers → Toggle Google ON → Save

### Issue: "Redirect URI mismatch"
**Fix:** Add exact URI to Google Cloud Console: `https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback`

### Issue: "Invalid credentials"
**Fix:** 
- Double-check Client ID and Client Secret in Supabase
- Make sure they match Google Cloud Console
- No extra spaces or characters

### Issue: OAuth works locally but not on Netlify
**Fix:**
- Add Netlify URL to Google Cloud Console redirect URIs
- Format: `https://your-site.netlify.app/auth/callback`

## 🔍 Quick Diagnostic Test

Run this in your browser console (on your app page):

```javascript
// Check if Supabase is configured
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// Try to access Supabase (if you have it in window)
// This will help verify the connection
```

## 📋 Final Checklist

- [ ] Environment variables are set (local and Netlify)
- [ ] Can access Supabase dashboard
- [ ] Google provider toggle is **ON** in Supabase
- [ ] Google Client ID is entered in Supabase
- [ ] Google Client Secret is entered in Supabase
- [ ] Saved changes in Supabase
- [ ] Google OAuth client exists in Google Cloud Console
- [ ] Redirect URI is added in Google Cloud Console
- [ ] OAuth consent screen is configured

## 🆘 Still Not Working?

If you've checked everything above and it's still not working:

1. **Take a screenshot** of your Supabase Providers page (showing Google settings)
2. **Check browser console** for any additional error messages
3. **Verify** you're using the correct Supabase project (not a different one)
4. **Try** disabling and re-enabling Google provider in Supabase
5. **Wait** 2-3 minutes after making changes (sometimes takes time to propagate)

---

**Most Common Issue:** The Google toggle in Supabase is OFF. Make absolutely sure it's ON!

