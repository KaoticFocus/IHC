import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, initSupabase, isSupabaseConfigured } from '../services/SupabaseService';
import { NotificationService } from '../services/NotificationService';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  work_email?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithOAuth: (provider: 'google') => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadUserProfile = async (client: SupabaseClient, userId: string) => {
    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 = no rows returned, which is OK for new users
        // 42P01 = relation does not exist (table missing)
        // PGRST301 = schema cache miss (table not found in schema cache)
        if (error.code === 'PGRST116') {
          // No profile exists yet, which is fine
          return;
        }
        if (error.code === '42P01' || error.code === 'PGRST301' || error.message?.includes('schema cache')) {
          console.warn('Users table does not exist in database. Please run the schema migration.');
          // Don't show error to user, just return empty profile
          return;
        }
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          work_email: data.work_email,
          avatar_url: data.avatar_url,
        });
      } else {
        // Create profile if it doesn't exist (all fields optional)
        const { data: userData } = await client.auth.getUser();
        if (userData?.user) {
          const { error: insertError } = await client.from('users').insert({
            id: userId,
            email: userData.user.email,
            full_name: userData.user.user_metadata?.full_name || null,
          });
          if (insertError) {
            // Handle missing table error gracefully
            if (insertError.code === '42P01' || insertError.code === 'PGRST301' || insertError.message?.includes('schema cache')) {
              console.warn('Users table does not exist. Profile creation skipped.');
              return;
            }
            console.error('Error creating profile:', insertError);
          } else {
            await loadUserProfile(client, userId);
          }
        }
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

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

    // Get initial session and profile with timeout
    const sessionTimeout = setTimeout(() => {
      console.warn('[AuthContext] Session check timed out, proceeding without session');
      setLoading(false);
    }, 5000); // 5 second timeout

    client.auth.getSession()
      .then(async ({ data: { session } }) => {
        clearTimeout(sessionTimeout);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Load profile with timeout
          const profileTimeout = setTimeout(() => {
            console.warn('[AuthContext] Profile load timed out');
            setLoading(false);
          }, 3000);
          
          try {
            await loadUserProfile(client!, session.user.id);
          } catch (err) {
            console.error('[AuthContext] Error loading profile:', err);
          } finally {
            clearTimeout(profileTimeout);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        clearTimeout(sessionTimeout);
        console.error('[AuthContext] Error getting session:', error);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserProfile(client!, session.user.id);
      } else {
        setProfile(null);
      }
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

    // Create user profile (all fields optional since profile is separate from login)
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName || null,
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
    
    // Always use current origin for redirect (will be Netlify URL in production)
    const redirectUrl = `${window.location.origin}/auth/callback`;
    
    console.log(`[AuthContext] Redirect URL: ${redirectUrl}`);

    try {
      console.log(`[AuthContext] Calling signInWithOAuth for ${provider}...`);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
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

  const refreshProfile = async () => {
    if (!supabase || !user) {
      return;
    }
    await loadUserProfile(supabase, user.id);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase || !user) {
      throw new Error('Supabase not configured or user not authenticated');
    }

    // Prepare update data (exclude id from updates)
    const { id, ...updateData } = updates;
    
    // Convert empty strings to null for optional fields (all profile fields are optional)
    const cleanUpdateData: Record<string, any> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value === '' || value === null || value === undefined) {
        cleanUpdateData[key] = null;
      } else {
        cleanUpdateData[key] = value;
      }
    }
    
    // Update full_name if first_name or last_name changed
    // Allow full_name to be empty/null if both names are empty
    if ('first_name' in cleanUpdateData || 'last_name' in cleanUpdateData) {
      const firstName = cleanUpdateData.first_name ?? profile?.first_name ?? '';
      const lastName = cleanUpdateData.last_name ?? profile?.last_name ?? '';
      const combinedName = `${firstName} ${lastName}`.trim();
      cleanUpdateData.full_name = combinedName || null;
    }

    const { error } = await supabase
      .from('users')
      .update(cleanUpdateData)
      .eq('id', user.id);

    if (error) {
      // Handle missing table error gracefully
      if (error.code === '42P01' || error.code === 'PGRST301' || error.message?.includes('schema cache')) {
        throw new Error('Database table not found. Please contact support or run the database migration.');
      }
      throw error;
    }

    // Update auth metadata (only full_name, if it exists)
    // Note: full_name can be null/empty since profile is separate from login
    if (cleanUpdateData.full_name !== undefined) {
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: cleanUpdateData.full_name || null },
      });
      if (authError) console.warn('Failed to update auth metadata:', authError);
    }

    // Reload profile
    await loadUserProfile(supabase, user.id);

    NotificationService.success('Profile updated successfully');
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    profile,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

