# Environment Variables Setup

This guide explains how to set up environment variables for the IHC Conversation Recorder web app.

## Creating the .env File

1. Navigate to the `web` directory
2. Create a new file named `.env` (no extension)
3. Add the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xppnphkaeczptxuhmpuv.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

## Getting Your API Keys

### Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/settings/api
2. Find the "Project API keys" section
3. Copy the **"anon" "public"** key (not the service_role key)
4. Replace `your-anon-key-here` in your `.env` file

### OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Click **"Create new secret key"**
4. Give it a name (e.g., "IHC App")
5. Copy the key immediately (you won't be able to see it again)
6. Replace `your-openai-api-key-here` in your `.env` file

## Important Notes

- **Never commit your `.env` file to version control** - it contains sensitive keys
- The `.env` file is already in `.gitignore` and won't be committed
- Environment variables prefixed with `VITE_` are exposed to the client-side code
- If you don't set `VITE_OPENAI_API_KEY` in `.env`, you can still configure it in the app Settings modal
- The app will check the environment variable first, then fall back to the Settings configuration

## After Setting Up

1. Restart your development server if it's running:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. The app will automatically use the environment variables

## Troubleshooting

- **OpenAI features not working?** Check that `VITE_OPENAI_API_KEY` is set correctly
- **Supabase not connecting?** Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- **Changes not taking effect?** Restart the development server after modifying `.env`

