import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Only create client if credentials are available
export const supabase: SupabaseClient | null =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null;

if (!supabase) {
    console.warn('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

// Storage bucket name
export const STORAGE_BUCKET = 'infographic';

/**
 * Get public URL for an infographic image from Supabase Storage
 * @param path - Relative path within the bucket (e.g., 'element/Hydrogen.jpeg')
 * @returns Full public URL
 */
export function getInfographicUrl(path: string): string {
    if (!supabaseUrl) {
        return '';
    }
    // Supabase Storage public URL format
    return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
    return Boolean(supabaseUrl && supabaseAnonKey);
}
