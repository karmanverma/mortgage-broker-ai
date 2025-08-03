import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

// Environment variables with fallbacks for development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://thiizqylfotijbeturns.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWl6cXlsZm90aWpiZXR1cm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4Mjg4ODYsImV4cCI6MjA2MDQwNDg4Nn0.E047Ceqcf_DH3DWeY8KP0tST10quBWsIyBCO_F7omyc";

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Create Supabase client with default configuration (simplified)
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): Error {
  if (error?.code === 'PGRST116') {
    return new Error('No data found');
  }
  if (error?.code === '23505') {
    return new Error('This record already exists');
  }
  if (error?.code === '23503') {
    return new Error('Cannot delete this record as it is referenced by other data');
  }
  if (error?.code === '42501') {
    return new Error('You do not have permission to perform this action');
  }
  
  return new Error(error?.message || 'An unexpected database error occurred');
}

// Add to window for debugging (only in development)
if (import.meta.env.DEV) {
  (window as any).supabase = supabase;
}
