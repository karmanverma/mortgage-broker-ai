import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client, mapDbClientToClient, mapClientToDbClient } from '@/features/clients/types';
import { toast } from '@/components/ui/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { TablesInsert, TablesUpdate, Tables } from '@/integrations/supabase/types';
import { useOptimisticListMutation } from './useOptimisticMutation';
import { usePersonWithEntityCreation, PersonWithEntityCreationOptions } from './usePersonWithEntityCreation';

export type ClientWithPeople = Client & {
  people?: Array<Tables<'people'> & { is_primary?: boolean; relationship_type?: string }>;
  primary_person?: Tables<'people'>;
};

export type ClientPerson = Tables<'client_people'>;

const CLIENTS_QUERY_KEY = ['clients'] as const;

export function useImprovedClients() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logActivityAndNotify } = useActivityAndNotification();

  // Fetch clients query with people relationships
  const clientsQuery = useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_people!inner (
            is_primary,
            relationship_type,
            people:person_id (
              id,
              first_name,
              last_name,
              email_primary,
              phone_primary,
              address_street,
              address_city,
              address_state,
              address_zip
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Transform the data to include people array and primary_person
      const transformedData = data?.map(client => {
        const people = client.client_people?.map(cp => ({
          ...cp.people,
          is_primary: cp.is_primary,
          relationship_type: cp.relationship_type
        })) || [];
        
        const primary_person = people.find(p => p.is_primary);
        
        // Use the primary person for backward compatibility
        const clientWithPeople = mapDbClientToClient(client, primary_person);
        
        return {
          ...clientWithPeople,
          people,
          primary_person,
        };
      }) || [];
      
      return transformedData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Person-entity creation integration
  const { createPersonWithEntity, isCreating: isCreatingPersonWithEntity } = usePersonWithEntityCreation();

  // Add client with person-entity creation
  const addClientWithPersonMutation = useMutation({
    mutationFn: async (options: PersonWithEntityCreationOptions) => {
      const result = await createPersonWithEntity(options);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create client with person');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });

  // Legacy add client mutation with optimistic updates (for backward compatibility)
  const addClientMutation = useOptimisticListMutation(
    async (clientData: Omit<Client, 'id' | 'dateAdded'> & { people_id: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const dbClient = mapClientToDbClient(clientData, user.id, clientData.people_id);
      const { data, error } = await supabase
        .from('clients')
        .insert(dbClient)
        .select(`
          *,
          people:people_id (
            id,
            first_name,
            last_name,
            email_primary,
            phone_primary,
            address_street,
            address_city,
            address_state,
            address_zip
          )
        `)
        .single();
      
      if (error) throw error;
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'client_added',
          client_id: data.id,
          description: `Client ${data.people?.first_name} ${data.people?.last_name} added`,
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
          message: `A new client (${data.people?.first_name} ${data.people?.last_name}) was added.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      return mapDbClientToClient(data, data.people);
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
      
      // Log activity BEFORE deletion to avoid foreign key constraint issues
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
      
      // Delete client after logging activity
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
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

  // Add person to client mutation
  const addPersonToClientMutation = useMutation({
    mutationFn: async ({ clientId, personId, isPrimary = false, relationshipType = 'client' }: {
      clientId: string;
      personId: string;
      isPrimary?: boolean;
      relationshipType?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      // If setting as primary, first remove primary status from other people
      if (isPrimary) {
        await supabase
          .from('client_people')
          .update({ is_primary: false })
          .eq('client_id', clientId)
          .eq('user_id', user.id);
      }
      
      const { data, error } = await supabase
        .from('client_people')
        .insert({
          client_id: clientId,
          person_id: personId,
          is_primary: isPrimary,
          relationship_type: relationshipType,
          user_id: user.id,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      toast({
        title: "Person Added",
        description: "Person has been linked to the client successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error linking person",
        description: error instanceof Error ? error.message : 'Failed to link person to client.',
      });
    },
  });

  // Remove person from client mutation
  const removePersonFromClientMutation = useMutation({
    mutationFn: async ({ clientId, personId }: { clientId: string; personId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('client_people')
        .delete()
        .eq('client_id', clientId)
        .eq('person_id', personId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      toast({
        title: "Person Removed",
        description: "Person has been unlinked from the client successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error unlinking person",
        description: error instanceof Error ? error.message : 'Failed to unlink person from client.',
      });
    },
  });

  // Set primary person mutation
  const setPrimaryPersonMutation = useMutation({
    mutationFn: async ({ clientId, personId }: { clientId: string; personId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Remove primary status from all people for this client
      await supabase
        .from('client_people')
        .update({ is_primary: false })
        .eq('client_id', clientId)
        .eq('user_id', user.id);
      
      // Set the specified person as primary
      const { error } = await supabase
        .from('client_people')
        .update({ is_primary: true })
        .eq('client_id', clientId)
        .eq('person_id', personId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      toast({
        title: "Primary Contact Updated",
        description: "Primary contact has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating primary contact",
        description: error instanceof Error ? error.message : 'Failed to update primary contact.',
      });
    },
  });

  return {
    // Query data
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    
    // Mutations
    addClient: addClientMutation.mutate,
    addClientWithPerson: addClientWithPersonMutation.mutate,
    updateClient: updateClientMutation.mutate,
    deleteClient: deleteClientMutation.mutate,
    addPersonToClient: addPersonToClientMutation.mutate,
    removePersonFromClient: removePersonFromClientMutation.mutate,
    setPrimaryPerson: setPrimaryPersonMutation.mutate,
    
    // Mutation states
    isAdding: addClientMutation.isPending,
    isAddingWithPerson: addClientWithPersonMutation.isPending || isCreatingPersonWithEntity,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending,
    isAddingPerson: addPersonToClientMutation.isPending,
    isRemovingPerson: removePersonFromClientMutation.isPending,
    isSettingPrimary: setPrimaryPersonMutation.isPending,
    
    // Utility functions
    refetch: clientsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY }),
    
    // Person-entity creation utilities
    createPersonWithEntity,
  };
}