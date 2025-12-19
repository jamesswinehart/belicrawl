import { createClient } from '@supabase/supabase-js';

// TODO: Add your Supabase URL and anon key to .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side Supabase client
// Note: This will only throw when API routes try to use it (not at build time)
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that will throw on use
    // This prevents build-time errors but ensures runtime errors are clear
    return createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
})();

