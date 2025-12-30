import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get these from: Supabase Dashboard → Project Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_URL.startsWith('https://')
);

// Create a dummy client if not configured to prevent crashes
const createSafeClient = (): SupabaseClient => {
    if (isSupabaseConfigured) {
        return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    // Return a placeholder client that won't crash the app
    // Using a valid but non-existent URL to prevent initialization errors
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
};

export const supabase = createSafeClient();
