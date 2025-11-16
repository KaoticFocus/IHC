# PWA Setup Guide

This guide explains how to set up the Progressive Web App (PWA) to make it look and function like a native app on mobile devices.

## What's Been Configured

### 1. Web App Manifest (`public/manifest.json`)
- Defines app metadata (name, icons, theme colors)
- Enables "Add to Home Screen" functionality
- Sets display mode to "standalone" (hides browser UI)

### 2. Service Worker (`public/sw.js`)
- Enables offline functionality
- Caches app assets for faster loading
- Handles background updates

### 3. Mobile Meta Tags (`index.html`)
- Prevents browser UI from showing
- Configures iOS Safari behavior
- Sets up Android Chrome behavior
- Disables phone number detection
- Prevents zoom and pull-to-refresh

### 4. Vite PWA Plugin (`vite.config.ts`)
- Automatically generates service worker
- Handles manifest generation
- Manages cache strategies

## Required Assets

### Icons (`public/icons/`)
You need to create the following icon sizes:
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

**Recommended:** Start with a 512x512px PNG image and use a tool like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator
- https://www.appicon.co/

### Splash Screens (`public/splash/`)
For iOS devices, create splash screens:
- iphone-se.png (640x1136)
- iphone-8.png (750x1334)
- iphone-8-plus.png (1242x2208)
- iphone-x.png (1125x2436)
- iphone-11-pro.png (1170x2532)
- iphone-11-pro-max.png (1242x2688)
- iphone-12-mini.png (1080x2340)
- iphone-12-pro.png (1170x2532)
- iphone-12-pro-max.png (1284x2778)
- ipad.png (1536x2048)
- ipad-pro.png (2048x2732)

**Recommended:** Use https://appsco.pe/developer/splash-screens or create them manually with your app's theme color (#1976d2) as background.

## Installation Steps

### 1. Install Dependencies
```bash
cd web
npm install vite-plugin-pwa --save-dev
```

### 2. Generate Icons
1. Create a 512x512px PNG logo/image
2. Use an online tool to generate all required sizes
3. Place all icons in `web/public/icons/`

### 3. Generate Splash Screens (Optional)
1. Create splash screens for iOS devices
2. Place them in `web/public/splash/`

### 4. Build and Test
```bash
npm run build
npm run preview
```

### 5. Test on Mobile
1. Deploy to a server (HTTPS required for PWA)
2. Open on mobile device
3. Look for "Add to Home Screen" prompt
4. Install and test

## Features Enabled

✅ **Standalone Mode** - App runs without browser UI  
✅ **Offline Support** - Basic caching for offline access  
✅ **Install Prompt** - Users can install as native app  
✅ **No Address Bar** - Full-screen experience  
✅ **No Pull-to-Refresh** - Prevents accidental refresh  
✅ **No Zoom** - Prevents double-tap zoom  
✅ **Custom Splash Screens** - Native-like startup  
✅ **App Icons** - Custom icons on home screen  

## Testing Checklist

- [ ] Icons display correctly on home screen
- [ ] App opens in standalone mode (no browser UI)
- [ ] Splash screen shows on iOS
- [ ] No address bar visible
- [ ] Pull-to-refresh disabled
- [ ] Double-tap zoom disabled
- [ ] App works offline (basic functionality)
- [ ] Service worker registers successfully
- [ ] Updates prompt user to reload

## Troubleshooting

### Icons Not Showing
- Ensure icons are in `public/icons/` directory
- Check that manifest.json references correct paths
- Clear browser cache and reinstall

### Browser UI Still Showing
- Ensure HTTPS is enabled (required for PWA)
- Check that manifest.json is accessible
- Verify meta tags in index.html

### Service Worker Not Registering
- Check browser console for errors
- Ensure HTTPS (or localhost for development)
- Verify sw.js is in public directory

### Updates Not Working
- Clear browser cache
- Uninstall and reinstall PWA
- Check service worker registration in DevTools

## Browser Support

- ✅ Chrome/Edge (Android) - Full support
- ✅ Safari (iOS) - Full support
- ✅ Firefox (Android) - Partial support
- ⚠️ Samsung Internet - Partial support

## Next Steps

1. Generate and add all required icons
2. Create splash screens for iOS
3. Test on real devices
4. Deploy to production with HTTPS
5. Monitor service worker updates

