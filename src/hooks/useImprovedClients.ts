import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client, mapDbClientToClient, mapClientToDbClient } from '@/features/clients/types';
import { toast } from '@/components/ui/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useOptimisticListMutation } from './useOptimisticMutation';

const CLIENTS_QUERY_KEY = ['clients'] as const;

export function useImprovedClients() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logActivityAndNotify } = useActivityAndNotification();

  // Fetch clients query
  const clientsQuery = useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data?.map(client => mapDbClientToClient(client)) || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Add client mutation with optimistic updates
  const addClientMutation = useOptimisticListMutation(
    async (clientData: Omit<Client, 'id' | 'dateAdded'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const dbClient = mapClientToDbClient(clientData, user.id);
      const { data, error } = await supabase
        .from('clients')
        .insert(dbClient)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Log activity
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
      
      return mapDbClientToClient(data);
    },
    CLIENTS_QUERY_KEY,
    {
      addItem: (variables) => ({
        ...variables,
        id: `temp-${Date.now()}`,
        dateAdded: new Date(),
        status: 'active',
      }),
      onSuccess: () => {
        toast({
          title: "Client Added",
          description: "Client has been added successfully.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error adding client",
          description: error instanceof Error ? error.message : 'Failed to add client.',
        });
      },
    }
  );

  // Update client mutation
  const updateClientMutation = useOptimisticListMutation(
    async ({ clientId, updates }: { clientId: string; updates: Partial<Client> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('clients')
        .update(updates as TablesUpdate<'clients'>)
        .eq('id', clientId)
        .eq('user_id', user.id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Log activity
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
      
      return mapDbClientToClient(data);
    },
    CLIENTS_QUERY_KEY,
    {
      updateItem: (oldItem, { updates }) => ({ ...oldItem, ...updates }),
      findItem: (item, { clientId }) => item.id === clientId,
      onSuccess: () => {
        toast({
          title: "Client Updated",
          description: "Client has been updated successfully.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error updating client",
          description: error instanceof Error ? error.message : 'Failed to update client.',
        });
      },
    }
  );

  // Delete client mutation
  const deleteClientMutation = useOptimisticListMutation(
    async (clientId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Log activity
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
      
      return { id: clientId } as Client;
    },
    CLIENTS_QUERY_KEY,
    {
      removeItem: (clientId) => true,
      onSuccess: () => {
        toast({
          title: "Client Deleted",
          description: "Client has been deleted successfully.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error deleting client",
          description: error instanceof Error ? error.message : 'Failed to delete client.',
        });
      },
    }
  );

  return {
    // Query data
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    
    // Mutations
    addClient: addClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
    deleteClient: deleteClientMutation.mutate,
    
    // Mutation states
    isAdding: addClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending,
    
    // Utility functions
    refetch: clientsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY }),
  };
}