import { createClient } from '@supabase/supabase-js';

// Use fallback values - these should work even without env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ggpxsxanqpapwyqnfivv.supabase.co';
// Get anon key from env, use empty string as fallback (Supabase client will still be created)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only log warnings in development
if (import.meta.env.DEV) {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.warn('⚠️ VITE_SUPABASE_URL not set, using fallback');
  }
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('⚠️ VITE_SUPABASE_ANON_KEY not set - some features may not work');
  }
}

// Create client - Supabase client can be created even with empty anon key
// It just won't work for authenticated operations until a valid key is provided
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a minimal client that won't crash the app
  supabase = createClient(supabaseUrl, '', {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export { supabase };

// Only test connection in development to avoid blocking the app
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  supabase.auth.getSession().catch((error) => {
    console.warn('Supabase connection warning (non-blocking):', error);
  });
}

