// Authentication debugging utilities
import { supabase } from '@/lib/supabaseClient';

export const debugAuthState = async () => {
  console.log('=== AUTH DEBUG START ===');
  
  // Check current session
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Current session:', session);
  console.log('Session error:', error);
  
  // Check storage
  console.log('LocalStorage auth keys:');
  Object.keys(localStorage).forEach(key => {
    if (key.includes('auth') || key.includes('supabase') || key.includes('broker')) {
      console.log(`  ${key}:`, localStorage.getItem(key));
    }
  });
  
  console.log('SessionStorage auth keys:');
  Object.keys(sessionStorage).forEach(key => {
    if (key.includes('auth') || key.includes('supabase') || key.includes('broker')) {
      console.log(`  ${key}:`, sessionStorage.getItem(key));
    }
  });
  
  // Check stay signed in preference
  console.log('Stay signed in preference:', localStorage.getItem('broker_ai_stay_signed_in'));
  
  console.log('=== AUTH DEBUG END ===');
  
  return { session, error };
};

export const clearAllAuthData = () => {
  console.log('Clearing all authentication data...');
  
  // Clear all possible auth keys
  const authKeys = [
    'broker_ai_auth_v2',
    'broker_ai_auth',
    'mortgagepro_auth',
    'supabase.auth.token',
    'sb-thiizqylfotijbeturns-auth-token',
    'sb-localhost-3000-auth-token',
    'broker_ai_stay_signed_in'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Clear all localStorage items that start with 'sb-'
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('All authentication data cleared');
};

// Add to window for debugging (only in development)
if (import.meta.env.DEV) {
  (window as any).debugAuthState = debugAuthState;
  (window as any).clearAllAuthData = clearAllAuthData;
}