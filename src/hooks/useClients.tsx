
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client, mapDbClientToClient } from '@/features/clients/types';
import { toast } from '@/components/ui/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { TablesInsert } from '@/integrations/supabase/types';

export function useClients() {
  const { logActivityAndNotify } = useActivityAndNotification();
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

  // Add a new client
  const addClient = useCallback(async (clientData: Omit<Client, 'id'>) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('clients')
        .insert({ ...clientData, user_id: user.id })
        .select('*')
        .single();
      if (insertError) throw insertError;
      if (data) {
        setClients(prev => [...prev, mapDbClientToClient(data)]);
        // Log activity and notification
        await logActivityAndNotify(
          {
            action_type: 'client_added',
            client_id: data.id,
            description: `Client ${data.first_name} ${data.last_name} added`,
            user_id: user.id,
            created_at: new Date().toISOString(),
            lender_id: null,
            document_id: null,
            id: undefined,
          },
          {
            user_id: user.id,
            type: 'client_added',
            entity_id: data.id,
            entity_type: 'client',
            message: `A new client (${data.first_name} ${data.last_name}) was added.`,
            read: false,
            created_at: new Date().toISOString(),
            id: undefined,
          }
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      toast({
        variant: 'destructive',
        title: 'Error adding client',
        description: err instanceof Error ? err.message : 'Failed to add client.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, logActivityAndNotify]);

  // Update a client
  const updateClient = useCallback(async (clientId: string, updates: Partial<Client>) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: updateError } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select('*')
        .single();
      if (updateError) throw updateError;
      if (data) {
        setClients(prev => prev.map(c => c.id === clientId ? mapDbClientToClient(data) : c));
        await logActivityAndNotify(
          {
            action_type: 'client_updated',
            client_id: clientId,
            description: `Client ${data.first_name} ${data.last_name} updated`,
            user_id: user.id,
            created_at: new Date().toISOString(),
            lender_id: null,
            document_id: null,
            id: undefined,
          },
          {
            user_id: user.id,
            type: 'client_updated',
            entity_id: clientId,
            entity_type: 'client',
            message: `Client (${data.first_name} ${data.last_name}) was updated.`,
            read: false,
            created_at: new Date().toISOString(),
            id: undefined,
          }
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      toast({
        variant: 'destructive',
        title: 'Error updating client',
        description: err instanceof Error ? err.message : 'Failed to update client.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, logActivityAndNotify]);

  // Delete a client
  const deleteClient = useCallback(async (clientId: string) => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      if (deleteError) throw deleteError;
      setClients(prev => prev.filter(c => c.id !== clientId));
      await logActivityAndNotify(
        {
          action_type: 'client_deleted',
          client_id: clientId,
          description: `Client deleted`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          lender_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'client_deleted',
          entity_id: clientId,
          entity_type: 'client',
          message: `A client was deleted.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      toast({
        variant: 'destructive',
        title: 'Error deleting client',
        description: err instanceof Error ? err.message : 'Failed to delete client.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, logActivityAndNotify]);

  return {
    clients,
    isLoading,
    error,
    fetchClients,
    addClient,
    updateClient,
    deleteClient
  };
}
