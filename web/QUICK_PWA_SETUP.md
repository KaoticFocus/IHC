# Quick PWA Setup Guide

## ✅ What's Already Done

1. ✅ **PWA Configuration** - `vite.config.ts` configured with VitePWA plugin
2. ✅ **Web App Manifest** - `public/manifest.json` created
3. ✅ **Service Worker** - `public/sw.js` created (VitePWA will generate optimized version)
4. ✅ **Mobile Meta Tags** - `index.html` configured for native app experience
5. ✅ **Mobile Behaviors** - Pull-to-refresh, zoom, and browser UI disabled

## 📱 What You Need to Do

### Step 1: Generate App Icons

1. Create a **512x512px PNG** image with your app logo/icon
2. Use one of these tools to generate all sizes:
   - **Recommended**: https://realfavicongenerator.net/
   - Alternative: https://www.pwabuilder.com/imageGenerator
   - Alternative: https://www.appicon.co/

3. Download all generated icons and place them in:
   ```
   web/public/icons/
   ```
   
   Required files:
   - icon-16x16.png
   - icon-32x32.png
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

### Step 2: Generate Splash Screens (Optional but Recommended)

1. Use https://appsco.pe/developer/splash-screens
2. Upload your 512x512px icon
3. Set background color to: `#1976d2` (or your theme color)
4. Download all splash screens and place them in:
   ```
   web/public/splash/
   ```

### Step 3: Build and Test

```bash
cd web
npm run build
npm run preview
```

### Step 4: Test on Mobile

1. **Deploy to HTTPS** (required for PWA)
   - Deploy to Netlify (already configured)
   - Or use ngrok for local testing: `ngrok http 5173`

2. **Open on Mobile Device**
   - Navigate to your deployed URL
   - Look for "Add to Home Screen" prompt
   - Or manually: Menu → "Add to Home Screen" / "Install App"

3. **Verify Native App Experience**
   - ✅ No browser address bar
   - ✅ No browser UI elements
   - ✅ Full-screen experience
   - ✅ Custom app icon on home screen
   - ✅ Splash screen on launch (iOS)

## 🎯 Features Enabled

- ✅ **Standalone Mode** - Runs without browser UI
- ✅ **Offline Support** - Basic caching enabled
- ✅ **Install Prompt** - Users can install as native app
- ✅ **No Address Bar** - Full-screen on mobile
- ✅ **No Pull-to-Refresh** - Prevents accidental refresh
- ✅ **No Zoom** - Prevents double-tap zoom
- ✅ **Custom Icons** - App icon on home screen
- ✅ **Splash Screens** - Native-like startup (iOS)

## 🔍 Testing Checklist

- [ ] Icons display correctly on home screen
- [ ] App opens in standalone mode (no browser UI)
- [ ] Splash screen shows on iOS launch
- [ ] No address bar visible
- [ ] Pull-to-refresh disabled
- [ ] Double-tap zoom disabled
- [ ] App works offline (basic functionality)
- [ ] Service worker registers successfully

## 🐛 Troubleshooting

### Icons Not Showing
- Ensure icons are in `web/public/icons/` directory
- Clear browser cache
- Uninstall and reinstall PWA

### Browser UI Still Showing
- **Must use HTTPS** (or localhost for development)
- Check that manifest.json is accessible at `/manifest.json`
- Verify meta tags in index.html

### Service Worker Not Working
- Check browser console for errors
- Ensure HTTPS (required for service workers)
- Verify VitePWA plugin is installed: `npm list vite-plugin-pwa`

### Updates Not Working
- Clear browser cache
- Uninstall and reinstall PWA
- Check service worker in DevTools → Application → Service Workers

## 📝 Notes

- **HTTPS Required**: PWAs require HTTPS (except localhost)
- **Icons Required**: App won't install without proper icons
- **Browser Support**: Best on Chrome/Edge (Android) and Safari (iOS)
- **Netlify**: Already configured for deployment

Once you add the icons, the app will be fully functional as a native-like PWA!

