
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

// Define storage folder paths
export const getStoragePaths = (userId: string) => {
  return {
    documents: `${userId}/documents`,
    profileImages: `${userId}/profile`,
    lenderDocuments: `${userId}/lenders`,
  };
};

// Helper function for uploading files to storage
export const uploadFile = async (
  bucket: string,
  filePath: string,
  file: File
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  return data;
};

// Helper function for getting a public URL for a file
export const getFileUrl = (
  bucket: string,
  filePath: string
) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Helper function for deleting files from storage
export const deleteFile = async (
  bucket: string,
  filePath: string
) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw error;
  }

  return true;
};
