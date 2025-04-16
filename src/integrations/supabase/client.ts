
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://thiizqylfotijbeturns.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoaWl6cXlsZm90aWpiZXR1cm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4Mjg4ODYsImV4cCI6MjA2MDQwNDg4Nn0.E047Ceqcf_DH3DWeY8KP0tST10quBWsIyBCO_F7omyc";

// Create Supabase client with auth configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storageKey: 'mortgagepro_auth',
    persistSession: true,
    autoRefreshToken: true,
  }
});
