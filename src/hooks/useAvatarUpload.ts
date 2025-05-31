import { useState } from "react";
import { supabase, getStoragePaths, uploadFile, getFileUrl } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Custom hook for handling avatar upload and update.
 * Handles file validation, upload to Supabase Storage, and profile update.
 */
export function useAvatarUpload() {
  const { profile, updateProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // File selection handler
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;
    // Validate type
    if (!selected.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    // Validate size (max 2MB)
    if (selected.size > 2 * 1024 * 1024) {
      setError("Image size must be under 2MB.");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  // Upload and update avatar
  const uploadAvatar = async () => {
    setError(null);
    if (!file || !profile?.id) {
      setError("No file selected or user not found.");
      return false;
    }
    setUploading(true);
    try {
      const { profileImages } = getStoragePaths(profile.id);
      const fileExt = file.name.split('.').pop();
      const filePath = `${profileImages}/avatar.${fileExt}`;
      await uploadFile("profile", filePath, file);
      const publicUrl = getFileUrl("profile", filePath);
      await updateProfile({ avatar_url: publicUrl });
      setUploading(false);
      return publicUrl;
    } catch (err: any) {
      setError(err.message || "Failed to upload avatar.");
      setUploading(false);
      return false;
    }
  };

  // Reset state
  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return {
    uploading,
    error,
    preview,
    file,
    onFileChange,
    uploadAvatar,
    reset,
  };
}
