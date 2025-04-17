
import React, { createContext, useContext, useEffect } from 'react';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import { AuthContextType } from './AuthContext.types';

// Create the context with undefined as initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuthProvider();
  
  // Add debug logging to help trace auth state changes
  useEffect(() => {
    console.log('AuthProvider state updated:', { 
      isAuthenticated: !!auth.user, 
      isLoading: auth.isLoading,
      hasProfile: !!auth.profile 
    });
  }, [auth.user, auth.isLoading, auth.profile]);
  
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
