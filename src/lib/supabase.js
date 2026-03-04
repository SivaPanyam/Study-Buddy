import { createClient } from '@supabase/supabase-js';

// Hardcoded values for Vercel deployment (env vars not loading properly)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ojmopruijduawhklhvcp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qbW9wcnVpamR1YXdoa2xodmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MzE1NDksImV4cCI6MjA4NzMwNzU0OX0.Z1ECA3Yh6R9fvgmOJrjmkKAh757dtQAuELmCrzeDGRM';
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
    console.warn("Supabase URL or Anon Key is missing. Check your .env file.");
}

export const isSupabaseConfigured = hasSupabaseConfig;

export const supabase = createClient(
    hasSupabaseConfig ? supabaseUrl : 'https://example.supabase.co',
    hasSupabaseConfig ? supabaseAnonKey : 'public-anon-key'
);
