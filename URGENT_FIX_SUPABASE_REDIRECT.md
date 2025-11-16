# URGENT: Fix Supabase Redirecting to localhost

## Why This Is Happening

Even though the code is correct and uses your Netlify URL, **Supabase is overriding it** because:

1. **Supabase Site URL** is set to `localhost:3000` in your project settings
2. **Supabase validates** all redirect URLs against the Site URL and Redirect URLs whitelist
3. **If your Netlify URL isn't allowed**, Supabase falls back to the Site URL (`localhost:3000`)

## The Fix (Do This Now)

### Step 1: Update Supabase Site URL

1. **Go to Supabase Dashboard:**
   - **Direct link:** https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/settings/general
   - Or navigate: Dashboard → Your Project → Settings → General

2. **Find "Site URL" field:**
   - Scroll down to the **"Site URL"** section
   - Currently it says: `http://localhost:3000`

3. **Change it to your Netlify URL:**
   - Replace `http://localhost:3000` with:
     ```
     https://consultflow-pro.netlify.app
     ```

### Step 2: Add Redirect URLs

1. **Still on the same page**, scroll down to **"Redirect URLs"** section

2. **Add your Netlify URL:**
   - Click **"Add URL"** or the **"+"** button
   - Add:
     ```
     https://consultflow-pro.netlify.app**
     ```
   - The `**` wildcard allows all paths (like `/auth/callback`)
   - **Important:** Use your REAL Netlify site name

3. **Remove localhost URLs** (if they exist):
   - Delete any entries like:
     - `http://localhost:3000/**`
     - `http://localhost:5173/**`
   - You don't need these since you're not using localhost

### Step 3: Save Changes

1. Click **"Save"** button at the bottom of the page
2. Wait for the success message
3. **Wait 1-2 minutes** for changes to propagate

### Step 4: Verify

1. Go back to: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/settings/general
2. Verify:
   - ✅ Site URL shows your Netlify URL (not localhost)
   - ✅ Redirect URLs includes your Netlify URL with `/**`

## How to Find Your Netlify URL

If you don't know your Netlify site URL:

1. Go to: https://app.netlify.com/
2. Click on your site
3. Look at the top - it shows your site URL
4. Example: `https://consultflow-pro.netlify.app`

## Why Code Changes Didn't Fix It

The code is correct:
```typescript
redirectTo: `${window.location.origin}/auth/callback`
```

This will use your Netlify URL when running on Netlify. **BUT** Supabase validates redirects server-side and rejects URLs that aren't in the allowed list. Since your Netlify URL isn't allowed, Supabase uses the Site URL (`localhost:3000`) instead.

## After Fixing

Once you update Supabase settings:
1. Clear your browser cache
2. Try signing in with Google again
3. You should be redirected to your Netlify URL (not localhost)

---

## Quick Checklist

- [ ] Go to Supabase Settings → General
- [ ] Change Site URL from `localhost:3000` to your Netlify URL
- [ ] Add Netlify URL to Redirect URLs (with `/**` wildcard)
- [ ] Remove any localhost entries from Redirect URLs
- [ ] Click Save
- [ ] Wait 1-2 minutes
- [ ] Test OAuth sign-in again

**The code is fine - this is a Supabase configuration issue that must be fixed in the dashboard!**

