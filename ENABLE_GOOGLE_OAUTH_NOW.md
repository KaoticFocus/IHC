# Enable Google OAuth in Supabase - Step by Step

You're getting this error: `"Unsupported provider: provider is not enabled"`

This means Google OAuth is **not enabled** in your Supabase dashboard. Follow these steps:

## Step 1: Get Your Supabase Project URL

Your Supabase project URL is: `https://xppnphkaeczptxuhmpuv.supabase.co`

The callback URL you'll need: `https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback`

## Step 2: Create Google OAuth Credentials

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project:**
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
   - Give it a name (e.g., "IHC App")

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click on it and click "Enable"

4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (unless you have a Google Workspace)
   - Click "Create"
   - Fill in:
     - App name: "IHC App" (or your app name)
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - On "Scopes" page, click "Save and Continue"
   - On "Test users" page, click "Save and Continue"
   - On "Summary" page, click "Back to Dashboard"

5. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **"Web application"**
   - Name: "IHC App Web Client"
   - **Authorized redirect URIs** - Click "Add URI" and add:
     ```
     https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback
     ```
   - Also add your Netlify URL:
     ```
     https://your-site.netlify.app/auth/callback
     ```
     (Replace `your-site` with your actual Netlify site name)
   - Click "Create"
   - **IMPORTANT:** Copy the **Client ID** and **Client Secret** (you'll need these in Step 3)

## Step 3: Enable Google in Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv
   - Sign in if needed

2. **Navigate to Authentication Settings:**
   - In the left sidebar, click **"Authentication"**
   - Click **"Providers"** (or go to Settings → Authentication → Providers)

3. **Find Google Provider:**
   - Scroll down to find **"Google"** in the list of providers
   - You should see a toggle switch next to it

4. **Enable Google:**
   - **Toggle the switch to ON** (this is the critical step!)
   - The toggle should turn green/blue when enabled

5. **Enter Your Google Credentials:**
   - **Client ID (for Google OAuth):** Paste your Google Client ID
   - **Client Secret (for Google OAuth):** Paste your Google Client Secret
   - **Authorized Client IDs (optional):** Leave empty unless you have multiple clients

6. **Save:**
   - Click **"Save"** button at the bottom of the page
   - Wait for the success message

7. **Verify:**
   - The Google provider should now show as **"Enabled"** with a green checkmark
   - The toggle should be ON

## Step 4: Test It

1. Go back to your app
2. Click "Sign In" or "Sign Up"
3. Click "Continue with Google"
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app

## Troubleshooting

### Still getting "provider is not enabled" error?

1. **Double-check the toggle:**
   - Go back to Supabase → Authentication → Providers
   - Make sure Google toggle is **ON** (not OFF)
   - If it's OFF, toggle it ON and save again

2. **Check your credentials:**
   - Make sure you copied the Client ID and Client Secret correctly
   - No extra spaces or characters
   - They should be long strings

3. **Verify redirect URI:**
   - In Google Cloud Console, make sure the redirect URI is exactly:
     ```
     https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback
     ```
   - No trailing slashes
   - Must match exactly

4. **Wait a few minutes:**
   - Sometimes changes take a minute or two to propagate
   - Try again after 2-3 minutes

5. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for any error messages
   - Share them if you see anything

## Quick Checklist

- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth client ID created (Web application type)
- [ ] Redirect URI added: `https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback`
- [ ] Client ID and Client Secret copied
- [ ] Supabase dashboard → Authentication → Providers
- [ ] Google toggle switched to **ON**
- [ ] Client ID pasted in Supabase
- [ ] Client Secret pasted in Supabase
- [ ] Clicked "Save" in Supabase
- [ ] Verified Google shows as "Enabled"

## For Apple OAuth

Apple OAuth setup is more complex and requires:
- Apple Developer account ($99/year)
- Service ID creation
- Key file (.p8) generation
- Domain verification

If you need Apple OAuth, let me know and I can provide detailed instructions.

---

**Most Common Issue:** The Google toggle in Supabase is OFF. Make sure it's ON!

