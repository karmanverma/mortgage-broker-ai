import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { useOptimisticListMutation } from './useOptimisticMutation';
import { 
  Person, 
  NewPersonData, 
  PersonUpdateData, 
  PersonFilters,
  ContactType 
} from '@/features/people/types';

const PEOPLE_QUERY_KEY = ['people'] as const;

export function useImprovedPeople(filters?: PersonFilters, options?: {
  onPersonCreated?: (person: Person) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logActivityAndNotify } = useActivityAndNotification();

  // Fetch people query with optional filtering
  const peopleQuery = useQuery({
    queryKey: [...PEOPLE_QUERY_KEY, filters],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      let query = supabase
        .from('people')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.contact_type) {
        query = query.eq('contact_type', filters.contact_type);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email_primary.ilike.${searchTerm},company_name.ilike.${searchTerm}`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
        
      const { data, error } = await query;
      
      if (error) throw handleSupabaseError(error);
      
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Add person mutation with optimistic updates
  const addPersonMutation = useOptimisticListMutation(
    async (personData: NewPersonData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('people')
        .insert({
          ...personData,
          user_id: user.id,
        })
        .select('*')
        .single();
      
      if (error) throw handleSupabaseError(error);
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'person_added',
          description: `Person ${data.first_name} ${data.last_name} added`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          lender_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'person_added',
          entity_id: data.id,
          entity_type: 'person',
          message: `A new person (${data.first_name} ${data.last_name}) was added.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      return data;
    },
    [...PEOPLE_QUERY_KEY, filters],
    {
      addItem: (variables) => ({
        ...variables,
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: variables.status || 'active',
        relationship_strength_score: variables.relationship_strength_score || 5,
        tags: variables.tags || [],
      }),
      onSuccess: (data) => {
        toast({
          title: "Person Added",
          description: `${data.first_name} ${data.last_name} has been added successfully.`,
        });
        
        // Call the callback if provided
        if (options?.onPersonCreated) {
          options.onPersonCreated(data);
        }
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error adding person",
          description: error instanceof Error ? error.message : 'Failed to add person.',
        });
      },
    }
  );

  // Update person mutation
  const updatePersonMutation = useOptimisticListMutation(
    async ({ personId, updates }: { personId: string; updates: PersonUpdateData }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('people')
        .update(updates)
        .eq('id', personId)
        .eq('user_id', user.id)
        .select('*')
        .single();
      
      if (error) throw handleSupabaseError(error);
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'person_updated',
          description: `Person ${data.first_name} ${data.last_name} updated`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          lender_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'person_updated',
          entity_id: personId,
          entity_type: 'person',
          message: `Person ${data.first_name} ${data.last_name} was updated.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      return data;
    },
    [...PEOPLE_QUERY_KEY, filters],
    {
      updateItem: (oldItem, { updates }) => ({ ...oldItem, ...updates }),
      findItem: (item, { personId }) => item.id === personId,
      onSuccess: (data) => {
        toast({
          title: "Person Updated",
          description: `${data.first_name} ${data.last_name} has been updated successfully.`,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error updating person",
          description: error instanceof Error ? error.message : 'Failed to update person.',
        });
      },
    }
  );

  // Delete person mutation
  const deletePersonMutation = useOptimisticListMutation(
    async ({ personId, personName }: { personId: string; personName?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', personId)
        .eq('user_id', user.id);
      
      if (error) throw handleSupabaseError(error);
      
      const nameToDelete = personName || `Person ID ${personId}`;
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'person_deleted',
          description: `${nameToDelete} deleted`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          lender_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'person_deleted',
          entity_id: personId,
          entity_type: 'person',
          message: `${nameToDelete} was deleted.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      return { id: personId, first_name: personName?.split(' ')[0], last_name: personName?.split(' ')[1] } as Person;
    },
    [...PEOPLE_QUERY_KEY, filters],
    {
      removeItem: ({ personId }) => true,
      onSuccess: (data) => {
        toast({
          title: "Person Deleted",
          description: `${data.first_name || 'Person'} has been deleted successfully.`,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error deleting person",
          description: error instanceof Error ? error.message : 'Failed to delete person.',
        });
      },
    }
  );

  // Helper function to filter people by contact type
  const filterByType = (type: ContactType): Person[] => {
    return (peopleQuery.data || []).filter(person => person.contact_type === type);
  };

  // Helper function to get people for selection dropdowns
  const getPeopleForSelection = (excludeTypes?: ContactType[]): Person[] => {
    return (peopleQuery.data || []).filter(person => 
      !excludeTypes || !excludeTypes.includes(person.contact_type as ContactType)
    );
  };

  return {
    // Query data
    people: peopleQuery.data || [],
    isLoading: peopleQuery.isLoading,
    error: peopleQuery.error,
    
    // Mutations
    addPerson: addPersonMutation.mutate,
    updatePerson: updatePersonMutation.mutate,
    deletePerson: deletePersonMutation.mutate,
    
    // Mutation states
    isAdding: addPersonMutation.isPending,
    isUpdating: updatePersonMutation.isPending,
    isDeleting: deletePersonMutation.isPending,
    
    // Helper functions
    filterByType,
    getPeopleForSelection,
    refetch: peopleQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY }),
  };
}