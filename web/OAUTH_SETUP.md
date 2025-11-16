# OAuth Setup Guide

This app supports Google sign-in via Supabase OAuth. Follow these steps to enable the Google OAuth provider:

## Google OAuth Setup

1. **Create Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs (add ALL of these):
     - `https://xppnphkaeczptxuhmpuv.supabase.co/auth/v1/callback` (REQUIRED - Supabase callback)
     - `http://localhost:5173/auth/callback` (for local development)
     - `http://localhost:3000/auth/callback` (alternative local port)
     - Your Netlify URL: `https://your-site.netlify.app/auth/callback` (replace with your actual Netlify URL)
   - Copy the Client ID and Client Secret

2. **Configure in Supabase:**
   - Go to your Supabase dashboard: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv
   - Navigate to **Settings** > **Authentication** > **Providers**
   - Find **"Google"** in the list of providers
   - **Toggle the switch to enable Google** (this is the most important step!)
   - Paste your Google **Client ID** in the "Client ID" field
   - Paste your Google **Client Secret** in the "Client Secret" field
   - Click **"Save"** at the bottom of the page
   - **Verify**: The Google provider should show as "Enabled" with a green checkmark

## Testing OAuth

1. **Local Development:**
   - Make sure your `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Run `npm run dev`
   - Click "Continue with Google" in the auth modal
   - You'll be redirected to the provider's login page
   - After authentication, you'll be redirected back to the app

2. **Production (Netlify):**
   - Make sure your Netlify site has the environment variables set
   - Add your Netlify URL to the OAuth provider's authorized redirect URIs
   - Test the OAuth flow on your deployed site

## Troubleshooting

- **"Redirect URI mismatch"**: Make sure the redirect URI in your OAuth provider matches exactly what Supabase expects
- **"Provider not enabled"**: Check that the provider is enabled in Supabase dashboard
- **"Invalid credentials"**: Verify your Client ID and Client Secret are correct

For more details, see the [Supabase OAuth documentation](https://supabase.com/docs/guides/auth/social-login/auth-google).

