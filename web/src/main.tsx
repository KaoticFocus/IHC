import React from 'react';
import ReactDOM from 'react-dom/client';
import { SnackbarProvider } from 'notistack';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { ThemeModeProvider } from './context/ThemeContext';
import { CssBaseline } from '@mui/material';

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

