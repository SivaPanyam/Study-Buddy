import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
    console.warn("Supabase URL or Anon Key is missing. Check your .env file.");
}

export const isSupabaseConfigured = hasSupabaseConfig;

export const supabase = createClient(
    hasSupabaseConfig ? supabaseUrl : 'https://example.supabase.co',
    hasSupabaseConfig ? supabaseAnonKey : 'public-anon-key'
);
