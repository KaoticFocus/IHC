import React from 'react';
import ReactDOM from 'react-dom/client';
import { SnackbarProvider } from 'notistack';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeModeProvider } from './context/ThemeContext';
import { CssBaseline } from '@mui/material';

// Register service worker for PWA (non-blocking, async)
if ('serviceWorker' in navigator) {
  // Use requestIdleCallback if available, otherwise setTimeout
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[Service Worker] Registration successful:', registration.scope);
        
        // Check for updates (non-blocking)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, but don't prompt immediately
                // Let user continue using the app, update will apply on next reload
                console.log('[Service Worker] New version available, will update on next reload');
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('[Service Worker] Registration failed:', error);
        // Don't block app if service worker fails
      });
  };

  // Register after page load, but don't block rendering
  if (document.readyState === 'complete') {
    // Page already loaded, register immediately
    setTimeout(registerSW, 100);
  } else {
    // Wait for page load, but with timeout
    window.addEventListener('load', () => {
      setTimeout(registerSW, 100);
    });
    
    // Fallback: register after 2 seconds even if load event hasn't fired
    setTimeout(registerSW, 2000);
  }
}

// Prevent default browser behaviors on mobile
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  // Prevent pull-to-refresh
  document.body.style.overscrollBehaviorY = 'none';
  
  // Prevent zoom on double tap
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);
  
  // Hide address bar on scroll (iOS)
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 0);
  });
  
  // Prevent bounce scrolling on iOS
  document.addEventListener('touchmove', (e) => {
    if (e.target === document.body || e.target === document.documentElement) {
      e.preventDefault();
    }
  }, { passive: false });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeModeProvider>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          preventDuplicate
        >
          <AuthProvider
            supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
            supabaseAnonKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
          >
            <App />
          </AuthProvider>
        </SnackbarProvider>
      </ThemeModeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

