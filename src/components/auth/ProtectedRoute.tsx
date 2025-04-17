
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, session } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute state:', { 
    isAuthenticated: !!user, 
    isLoading,
    hasSession: !!session,
    path: location.pathname
  });

  useEffect(() => {
    if (!isLoading && (!user || !session)) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to access this page."
      });
    }
  }, [isLoading, user, session]);

  // Show loading spinner only for a short period to prevent getting stuck
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // If no authenticated user after loading is complete, redirect to login
  if (!user || !session) {
    console.log('No authenticated user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
