// IMPORTANT: Re-exporting the single Supabase client instance from our new location
// This ensures all existing imports continue to work while preventing duplicate clients
import { supabase } from '@/lib/supabaseClient';
export { supabase };

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
