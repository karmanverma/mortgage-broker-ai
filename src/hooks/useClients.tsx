
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client, mapDbClientToClient } from '@/features/clients/types';
import { toast } from '@/components/ui/use-toast';

export function useClients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id);
        
      if (fetchError) throw fetchError;
      
      const mappedClients = data?.map(client => mapDbClientToClient(client)) || [];
      setClients(mappedClients);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      toast({
        variant: "destructive",
        title: "Error loading clients",
        description: "Failed to load your client list. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    clients,
    isLoading,
    error,
    fetchClients
  };
}
