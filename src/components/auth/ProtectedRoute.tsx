
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, profile, session } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check if user exists but profile is missing
    if (user && !profile && !isLoading) {
      console.log('User exists but profile is missing');
      toast({
        variant: "destructive",
        title: "Profile Error",
        description: "Your user profile is missing. Please contact support.",
      });
    }
  }, [user, profile, isLoading]);

  console.log('ProtectedRoute state:', { 
    isAuthenticated: !!user, 
    isLoading, 
    hasProfile: !!profile,
    hasSession: !!session,
    path: location.pathname
  });

  if (isLoading) {
    // Return a loading state while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!user || !session) {
    console.log('No authenticated user, redirecting to login');
    // Redirect to the login page if the user is not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
