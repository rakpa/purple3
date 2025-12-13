import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ggpxsxanqpapwyqnfivv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('❌ VITE_SUPABASE_URL is not set or invalid');
  console.error('Please set VITE_SUPABASE_URL in your environment variables');
}

if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key') {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not set or invalid');
  console.error('Please set VITE_SUPABASE_ANON_KEY in your environment variables');
  console.error('See ENV_SETUP.md for instructions');
}

// Create client - ensure we have valid values
const finalSupabaseUrl = supabaseUrl || 'https://ggpxsxanqpapwyqnfivv.supabase.co';
const finalSupabaseAnonKey = supabaseAnonKey || '';

// Create client
export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Test connection on initialization
if (typeof window !== 'undefined') {
  supabase.auth.getSession().catch((error) => {
    console.error('Supabase connection error:', error);
    if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
      console.error('⚠️ Supabase project not found. Please check:');
      console.error('1. VITE_SUPABASE_URL is correct');
      console.error('2. Supabase project is active');
      console.error('3. CORS is enabled in Supabase settings');
    }
  });
}

