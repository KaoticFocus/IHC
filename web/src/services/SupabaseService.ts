import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
// These should be set via environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
export function initSupabase(url?: string, anonKey?: string): SupabaseClient {
  const finalUrl = url || supabaseUrl;
  const finalKey = anonKey || supabaseAnonKey;

  if (!finalUrl || !finalKey) {
    console.warn('Supabase URL or Anon Key not configured. Using local storage only.');
    return null as any;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(finalUrl, finalKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
}

/**
 * Get Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
    return initSupabase();
  }
  return supabaseClient;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

export default {
  init: initSupabase,
  getClient: getSupabaseClient,
  isConfigured: isSupabaseConfigured,
};

