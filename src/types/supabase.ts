// Minimal Supabase types placeholder.
// Replace with generated types via `supabase gen types typescript` for full coverage.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          first_name: string | null;
          last_name: string | null;
          company_name: string | null;
          avatar_url: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      // Add other tables here as needed
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
