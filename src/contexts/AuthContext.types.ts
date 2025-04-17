
import { User, Session, WeakPassword } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Tables<'profiles'> | null;
  isLoading: boolean;
  signUp: (email: string, password: string, metadata: { first_name: string; last_name: string; company_name?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{
    user: User | null;
    session: Session | null;
    weakPassword?: WeakPassword | null;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Tables<'profiles'>>) => Promise<void>;
  uploadProfileImage: (file: File) => Promise<string>;
}
