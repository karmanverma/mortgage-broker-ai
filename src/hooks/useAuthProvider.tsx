
import { useState, useEffect, useCallback } from 'react';
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
  const fetchProfile = useCallback(async (userId: string) => {
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
  }, []);

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

  // Set up session management
  useEffect(() => {
    console.log('Auth provider initializing');
    setIsLoading(true);
    
    // First check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Initial session check:', currentSession ? 'Session found' : 'No session');
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event, newSession ? 'Session exists' : 'No session');
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          if (newSession?.user) {
            // Use setTimeout to prevent Supabase auth deadlock
            setTimeout(async () => {
              const profileData = await fetchProfile(newSession.user.id);
              setProfile(profileData);
              navigate('/app');
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          navigate('/login');
        } else if (event === 'USER_UPDATED' && newSession?.user) {
          // Use setTimeout to prevent Supabase auth deadlock
          setTimeout(async () => {
            const profileData = await fetchProfile(newSession.user.id);
            setProfile(profileData);
          }, 0);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, fetchProfile]);

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
      console.log('Signing in with:', email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data.session ? 'Session created' : 'No session');
    } catch (error: any) {
      console.error('Sign in error caught:', error);
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
