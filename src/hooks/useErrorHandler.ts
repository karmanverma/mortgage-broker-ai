import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  toastDescription?: string;
  logError?: boolean;
  onError?: (error: Error) => void;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    showToast = true,
    toastTitle = 'Error',
    toastDescription,
    logError = true,
    onError,
  } = options;

  const handleError = useCallback((error: unknown, context?: string) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    if (logError) {
      console.error(`Error${context ? ` in ${context}` : ''}:`, errorObj);
    }

    if (showToast) {
      toast({
        variant: 'destructive',
        title: toastTitle,
        description: toastDescription || errorObj.message || 'An unexpected error occurred',
      });
    }

    onError?.(errorObj);
  }, [showToast, toastTitle, toastDescription, logError, onError]);

  return handleError;
}

// Specific error handlers for common scenarios
export function useAuthErrorHandler() {
  return useErrorHandler({
    toastTitle: 'Authentication Error',
    toastDescription: 'Please check your credentials and try again.',
  });
}

export function useNetworkErrorHandler() {
  return useErrorHandler({
    toastTitle: 'Network Error',
    toastDescription: 'Please check your internet connection and try again.',
  });
}

export function useValidationErrorHandler() {
  return useErrorHandler({
    toastTitle: 'Validation Error',
    showToast: false, // Usually handled by form validation
  });
}