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

  // Set up session management with improved error handling
  useEffect(() => {
    console.log('Auth provider initializing');
    setIsLoading(true);

    // First set up auth state listener to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state changed:', event, newSession ? 'Session exists' : 'No session');
        
        // Immediately update session and user state (synchronously)
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // For events requiring additional data fetching, use setTimeout
        if (event === 'SIGNED_IN' && newSession?.user) {
          setTimeout(() => {
            fetchProfile(newSession.user.id)
              .then(profileData => {
                setProfile(profileData);
                navigate('/app');
              })
              .catch(err => {
                console.error('Error fetching profile after sign in:', err);
              });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          navigate('/login');
        } else if (event === 'USER_UPDATED' && newSession?.user) {
          setTimeout(() => {
            fetchProfile(newSession.user.id)
              .then(profileData => {
                setProfile(profileData);
              })
              .catch(err => {
                console.error('Error fetching profile after user update:', err);
              });
          }, 0);
        }
      }
    );
    
    // After setting up listener, check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        console.log('Initial session check:', currentSession ? 'Session found' : 'No session');
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          return fetchProfile(currentSession.user.id);
        }
        return null;
      })
      .then(profileData => {
        if (profileData) {
          setProfile(profileData);
        }
      })
      .catch(error => {
        console.error('Error during auth initialization:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });

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
      
      // Simplified sign-in without persisting session
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }
      
      console.log('Sign in successful:', data.session ? 'Session created' : 'No session');
      return data;
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
