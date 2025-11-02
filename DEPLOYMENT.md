# Deployment Guide

## Quick Deploy Options

### **Netlify (Recommended)**

1. **Via Netlify CLI:**
   ```bash
   cd web
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

2. **Via Netlify Dashboard:**
   - Connect GitHub repo
   - Build command: `cd web && npm install && npm run build`
   - Publish directory: `web/dist`
   - Environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

### **Vercel**

```bash
cd web
npm install -g vercel
vercel
```

### **GitHub Pages**

```bash
cd web
npm install --save-dev gh-pages
# Add to package.json scripts:
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"
npm run deploy
```

## Environment Variables

Set these in your hosting provider:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Note: These are public variables (safe to expose in client code per Supabase docs).

