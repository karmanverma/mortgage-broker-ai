import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Simple ProtectedRoute component that checks for session and initialized state
 * Based on the working Supabase example pattern
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, initialized } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is initializing
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  // If no session after initialization is complete, redirect to login
  if (!session) {
    console.log('No authenticated session, redirecting to login');
    toast({
      variant: "destructive",
      title: "Authentication Required",
      description: "Please sign in to access this page."
    });
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
