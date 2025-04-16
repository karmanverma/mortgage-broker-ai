
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase, getStoragePaths } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user profile data
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  };

  // Upload profile image
  const uploadProfileImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('User must be logged in to upload profile image');
    
    try {
      const paths = getStoragePaths(user.id);
      const fileExt = file.name.split('.').pop();
      const filePath = `${paths.profileImages}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('lender_documents')
        .upload(filePath, file, {
          upsert: true,
          cacheControl: '3600',
        });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('lender_documents')
        .getPublicUrl(filePath);
      
      // Update profile with new avatar URL
      await updateProfile({ avatar_url: urlData.publicUrl });
      
      return urlData.publicUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error uploading profile image",
        description: error.message,
      });
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<Tables<'profiles'>>) => {
    if (!user) throw new Error('User must be logged in to update profile');
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refetch profile to get updated data
      const updatedProfile = await fetchProfile(user.id);
      if (updatedProfile) setProfile(updatedProfile);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch profile when auth state changes and user exists
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      
      if (event === 'SIGNED_IN') {
        navigate('/app');
      } else if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Fetch profile for existing session
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signUp = async (email: string, password: string, metadata: { first_name: string; last_name: string; company_name?: string }) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;
      
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating account",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error resetting password",
        description: error.message,
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    session,
    profile,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    uploadProfileImage,
  };
}
