# How to Diagnose OAuth Issues

## 🔍 Quick Diagnostic Test

### Option 1: Browser Console (Easiest)

1. **Open your app** in the browser
2. **Open Developer Tools** (Press `F12` or Right-click → Inspect)
3. **Go to Console tab**
4. **Type this command** and press Enter:
   ```javascript
   window.diagnoseSupabase()
   ```
5. **Review the results** - it will show you:
   - ✅ What's working
   - ❌ What's broken
   - ⚠️ What needs attention
   - 🔧 How to fix issues

### Option 2: Check Browser Console Logs

When you try to sign in with Google, the console will now show detailed logs:

1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Try signing in with Google**
4. **Look for logs starting with `[AuthContext]`**
5. **Check for error messages** - they'll tell you exactly what's wrong

Example logs you'll see:
```
[AuthContext] Starting OAuth sign-in with google...
[AuthContext] Supabase client initialized
[AuthContext] Redirect URL: http://localhost:5173/auth/callback
[AuthContext] Calling signInWithOAuth for google...
[AuthContext] OAuth response received { error: {...} }
[AuthContext] OAuth error: { code: 'validation_failed', message: '...' }
```

---

## 📋 What the Diagnostic Checks

The diagnostic script (`window.diagnoseSupabase()`) checks:

1. ✅ **Environment Variables** - Are Supabase URL and key set?
2. ✅ **Supabase Client** - Can we create a Supabase client?
3. ✅ **Database Connection** - Can we connect to Supabase database?
4. ✅ **Auth Configuration** - Is authentication configured?
5. ✅ **Google OAuth Provider** - Is Google OAuth enabled in Supabase?

---

## 🎯 Common Issues and Solutions

### Issue: "Provider is not enabled"

**Diagnostic will show:**
```
❌ Google OAuth Provider: Google OAuth provider is NOT enabled in Supabase dashboard
   Fix: Go to: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers and enable Google
```

**Solution:**
1. Go to: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers
2. Find "Google" provider
3. Toggle switch to **ON**
4. Add Client ID and Secret
5. Click **Save**

### Issue: "Supabase not configured"

**Diagnostic will show:**
```
❌ Environment Variables: VITE_SUPABASE_URL is not set
```

**Solution:**
1. Check your `.env` file in `web/` directory
2. Make sure it has:
   ```env
   VITE_SUPABASE_URL=https://xppnphkaeczptxuhmpuv.supabase.co
   VITE_SUPABASE_ANON_KEY=your-key-here
   ```
3. Restart your dev server

### Issue: "Redirect URI mismatch"

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add this exact URI:
   ```
   https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback
   ```

---

## 📖 Visual Guide

For step-by-step visual instructions, see: **`VISUAL_GOOGLE_OAUTH_SETUP.md`**

---

## 🆘 Still Need Help?

1. **Run the diagnostic:** `window.diagnoseSupabase()` in browser console
2. **Check console logs** when trying to sign in
3. **Take a screenshot** of:
   - Supabase Providers page (showing Google settings)
   - Browser console errors
4. **Share the diagnostic output** - it will show exactly what's wrong

---

## 💡 Pro Tips

- **Always check browser console first** - it has the most detailed error messages
- **Run diagnostic before and after** making changes to verify fixes
- **Wait 2-3 minutes** after enabling OAuth in Supabase - changes can take time to propagate
- **Clear browser cache** if you're still seeing old errors

