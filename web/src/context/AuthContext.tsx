import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, initSupabase, isSupabaseConfigured } from '../services/SupabaseService';
import { NotificationService } from '../services/NotificationService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithOAuth: (provider: 'google') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { full_name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export function AuthProvider({ children, supabaseUrl, supabaseAnonKey }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    let client: SupabaseClient | null = null;
    
    // Initialize Supabase
    if (supabaseUrl && supabaseAnonKey) {
      client = initSupabase(supabaseUrl, supabaseAnonKey);
      setSupabase(client);
    } else if (isSupabaseConfigured()) {
      client = getSupabaseClient();
      setSupabase(client);
    }

    if (!client) {
      setLoading(false);
      return;
    }

    // Get initial session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseUrl, supabaseAnonKey]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setSession(data.session);
    setUser(data.user);
    NotificationService.success('Signed in successfully');
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName,
      });
    }

    NotificationService.success('Account created! Please check your email to verify your account.');
  };

  const signInWithOAuth = async (provider: 'google') => {
    console.log(`[AuthContext] Starting OAuth sign-in with ${provider}...`);
    
    if (!supabase) {
      const errorMsg = 'Supabase not configured. Please check your environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).';
      console.error(`[AuthContext] ${errorMsg}`);
      console.error(`[AuthContext] Supabase URL: ${import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}`);
      console.error(`[AuthContext] Supabase Key exists: ${!!import.meta.env.VITE_SUPABASE_ANON_KEY}`);
      throw new Error(errorMsg);
    }

    console.log(`[AuthContext] Supabase client initialized`);
    
    // Determine the correct redirect URL
    // Use current origin, but fallback to Netlify URL if available
    const currentOrigin = window.location.origin;
    const redirectUrl = `${currentOrigin}/auth/callback`;
    
    console.log(`[AuthContext] Current origin: ${currentOrigin}`);
    console.log(`[AuthContext] Redirect URL: ${redirectUrl}`);
    console.log(`[AuthContext] Note: Make sure this URL is added to Supabase Redirect URLs in project settings`);

    try {
      console.log(`[AuthContext] Calling signInWithOAuth for ${provider}...`);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            // Ensure we redirect to the correct origin
            redirect_to: redirectUrl,
          },
        },
      });

      console.log(`[AuthContext] OAuth response received`, { error });

      if (error) {
        console.error(`[AuthContext] OAuth error:`, error);
        console.error(`[AuthContext] Error code: ${error.code || 'N/A'}`);
        console.error(`[AuthContext] Error message: ${error.message || 'N/A'}`);
        console.error(`[AuthContext] Full error object:`, JSON.stringify(error, null, 2));

        // Provide more helpful error messages
        if (error.message?.includes('not enabled') || 
            error.message?.includes('Unsupported provider') ||
            error.code === 'validation_failed') {
          const detailedError = new Error(
            `${provider.charAt(0).toUpperCase() + provider.slice(1)} OAuth is not enabled in your Supabase dashboard. ` +
            `Please go to: https://supabase.com/dashboard/project/xppnphkaeczptxuhmpuv/auth/providers ` +
            `and enable the ${provider} provider by toggling it ON, then add your Client ID and Client Secret.`
          );
          console.error(`[AuthContext] Throwing detailed error:`, detailedError.message);
          throw detailedError;
        }
        throw error;
      }

      console.log(`[AuthContext] OAuth sign-in successful, redirecting...`);
      // OAuth will redirect, so no need to update state here
    } catch (err: any) {
      console.error(`[AuthContext] OAuth sign-in exception:`, err);
      console.error(`[AuthContext] Exception type:`, err.constructor.name);
      console.error(`[AuthContext] Exception message:`, err.message);
      console.error(`[AuthContext] Exception stack:`, err.stack);
      throw err;
    }
  };

  const signOut = async () => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setSession(null);
    setUser(null);
    NotificationService.success('Signed out successfully');
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    NotificationService.success('Password reset email sent!');
  };

  const updateProfile = async (updates: { full_name?: string }) => {
    if (!supabase || !user) {
      throw new Error('Supabase not configured or user not authenticated');
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    // Update auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: updates,
    });

    if (authError) throw authError;

    NotificationService.success('Profile updated successfully');
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

