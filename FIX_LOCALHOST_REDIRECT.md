# Fix: OAuth Redirecting to localhost Instead of Your App

## The Problem

After signing in with Google, Supabase is redirecting to `localhost:3000` instead of your actual app URL (Netlify URL).

## Root Cause

Supabase has a **Site URL** configured in project settings that's set to `localhost:3000`. This overrides the `redirectTo` option in the code.

## The Fix

### Step 1: Update Supabase Site URL

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/settings/general

2. **Find "Site URL" section:**
   - Scroll down to find the **"Site URL"** field
   - Currently it's probably set to: `http://localhost:3000`

3. **Update Site URL:**
   - Set it to your Netlify URL:
     ```
     https://your-site.netlify.app
     ```
     (Replace `your-site` with your actual Netlify site name)

4. **Add Redirect URLs:**
   - Scroll down to **"Redirect URLs"** section
   - Add your Netlify URL with wildcard (one per line):
     ```
     https://your-site.netlify.app/**
     ```
   - The `**` wildcard allows all paths under that domain
   - Replace `your-site` with your actual Netlify site name

5. **Click "Save"** at the bottom

### Step 2: Verify Your Netlify URL

If you don't know your Netlify URL:
1. Go to your Netlify dashboard
2. Select your site
3. Look at the site URL (e.g., `https://your-site-name.netlify.app`)

### Step 3: Test Again

1. Clear your browser cache
2. Try signing in with Google again
3. You should now be redirected to your Netlify URL

---

## Alternative: Update Code to Force Redirect

If you can't change Supabase settings, we can update the code to handle the redirect better. But updating Supabase settings is the recommended approach.

---

## Why This Happens

Supabase uses the **Site URL** as the default redirect target for OAuth flows. Even though the code specifies `redirectTo`, Supabase validates it against the Site URL and Redirect URLs list. If your app URL isn't in the allowed list, it falls back to the Site URL.

---

## Quick Checklist

- [ ] Go to Supabase Settings → General
- [ ] Update Site URL to your Netlify URL
- [ ] Add Redirect URLs (including wildcards)
- [ ] Save changes
- [ ] Test OAuth sign-in again

