import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from '@/components/ui/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { useOptimisticListMutation } from './useOptimisticMutation';
import { usePersonWithEntityCreation, PersonWithEntityCreationOptions } from './usePersonWithEntityCreation';

export type Lender = Tables<'lenders'> & {
  people?: Array<Tables<'people'> & { is_primary?: boolean; relationship_type?: string }>;
  primary_person?: Tables<'people'>;
};

export type LenderPerson = Tables<'lender_people'>;
export type NewLenderData = Omit<TablesInsert<'lenders'>, 'user_id' | 'id' | 'created_at' | 'updated_at'>;

const LENDERS_QUERY_KEY = ['lenders'] as const;

export function useImprovedLenders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logActivityAndNotify } = useActivityAndNotification();

  // Fetch lenders query with people relationships
  const lendersQuery = useQuery({
    queryKey: LENDERS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // First get lenders
      const { data: lendersData, error: lendersError } = await supabase
        .from('lenders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (lendersError) throw handleSupabaseError(lendersError);
      
      if (!lendersData || lendersData.length === 0) {
        return [];
      }
      
      // Then get lender-people relationships with people data
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('lender_people')
        .select(`
          lender_id,
          is_primary,
          relationship_type,
          people:person_id (
            id,
            first_name,
            last_name,
            email_primary,
            phone_primary,
            company_name,
            title_position
          )
        `)
        .eq('user_id', user.id)
        .in('lender_id', lendersData.map(l => l.id));
        
      if (relationshipsError) throw handleSupabaseError(relationshipsError);
      
      // Transform the data to include people array and primary_person
      const transformedData = lendersData.map(lender => {
        const lenderRelationships = relationshipsData?.filter(r => r.lender_id === lender.id) || [];
        
        const people = lenderRelationships.map(rel => ({
          ...rel.people,
          is_primary: rel.is_primary,
          relationship_type: rel.relationship_type
        })).filter(p => p && p.id) || [];
        
        const primary_person = people.find(p => p.is_primary);
        
        return {
          ...lender,
          people,
          primary_person
        };
      });
      
      return transformedData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Person-entity creation integration
  const { createPersonWithEntity, isCreating: isCreatingPersonWithEntity } = usePersonWithEntityCreation();

  // Add lender with person-entity creation
  const addLenderWithPersonMutation = useMutation({
    mutationFn: async (options: PersonWithEntityCreationOptions) => {
      const result = await createPersonWithEntity(options);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create lender with person');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LENDERS_QUERY_KEY });
    },
  });

  // Legacy add lender mutation with optimistic updates (for backward compatibility)
  const addLenderMutation = useOptimisticListMutation(
    async (lenderData: NewLenderData) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('[useImprovedLenders] Adding lender with data:', lenderData);
      
      const { data, error } = await supabase
        .from('lenders')
        .insert({
          ...lenderData,
          user_id: user.id,
        })
        .select('*')
        .single();
      
      if (error) {
        console.error('[useImprovedLenders] Error creating lender:', error);
        throw handleSupabaseError(error);
      }
      
      console.log('[useImprovedLenders] Lender created successfully:', data);
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'lender_added',
          lender_id: data.id,
          description: `Lender ${data.name} added`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'lender_added',
          entity_id: data.id,
          entity_type: 'lender',
          message: `A new lender (${data.name}) was added.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      return data;
    },
    LENDERS_QUERY_KEY,
    {
      addItem: (variables) => ({
        ...variables,
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: variables.status || 'Active',
      }),
      onSuccess: (data) => {
        toast({
          title: "Lender Added",
          description: `${data.name} has been added successfully.`,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error adding lender",
          description: error instanceof Error ? error.message : 'Failed to add lender.',
        });
      },
    }
  );

  // Update lender mutation
  const updateLenderMutation = useOptimisticListMutation(
    async ({ lenderId, updates }: { lenderId: string; updates: Partial<Lender> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('lenders')
        .update(updates as TablesUpdate<'lenders'>)
        .eq('id', lenderId)
        .eq('user_id', user.id)
        .select('*')
        .single();
      
      if (error) throw handleSupabaseError(error);
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'lender_updated',
          lender_id: lenderId,
          description: `Lender ${data.name} updated`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'lender_updated',
          entity_id: lenderId,
          entity_type: 'lender',
          message: `Lender ${data.name} was updated.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      return data;
    },
    LENDERS_QUERY_KEY,
    {
      updateItem: (oldItem, { updates }) => ({ ...oldItem, ...updates }),
      findItem: (item, { lenderId }) => item.id === lenderId,
      onSuccess: (data) => {
        toast({
          title: "Lender Updated",
          description: `${data.name} has been updated successfully.`,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error updating lender",
          description: error instanceof Error ? error.message : 'Failed to update lender.',
        });
      },
    }
  );

  // Delete lender mutation
  const deleteLenderMutation = useOptimisticListMutation(
    async ({ lenderId, lenderName }: { lenderId: string; lenderName?: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const nameToDelete = lenderName || `Lender ID ${lenderId}`;
      
      // Log activity BEFORE deletion to avoid foreign key constraint issues
      await logActivityAndNotify(
        {
          action_type: 'lender_deleted',
          lender_id: lenderId,
          description: `${nameToDelete} deleted`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'lender_deleted',
          entity_id: lenderId,
          entity_type: 'lender',
          message: `${nameToDelete} was deleted.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      // Delete lender after logging activity
      const { error } = await supabase
        .from('lenders')
        .delete()
        .eq('id', lenderId)
        .eq('user_id', user.id);
      
      if (error) throw handleSupabaseError(error);
      
      return { id: lenderId, name: lenderName } as Lender;
    },
    LENDERS_QUERY_KEY,
    {
      removeItem: ({ lenderId }) => true,
      onSuccess: (data) => {
        toast({
          title: "Lender Deleted",
          description: `${data.name || 'Lender'} has been deleted successfully.`,
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error deleting lender",
          description: error instanceof Error ? error.message : 'Failed to delete lender.',
        });
      },
    }
  );

  // Add person to lender mutation
  const addPersonToLenderMutation = useMutation({
    mutationFn: async ({ lenderId, personId, isPrimary = false, relationshipType = 'contact' }: {
      lenderId: string;
      personId: string;
      isPrimary?: boolean;
      relationshipType?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      // If setting as primary, first remove primary status from other people
      if (isPrimary) {
        await supabase
          .from('lender_people')
          .update({ is_primary: false })
          .eq('lender_id', lenderId)
          .eq('user_id', user.id);
      }
      
      const { data, error } = await supabase
        .from('lender_people')
        .insert({
          lender_id: lenderId,
          person_id: personId,
          is_primary: isPrimary,
          relationship_type: relationshipType,
          user_id: user.id,
        })
        .select('*')
        .single();
      
      if (error) throw handleSupabaseError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LENDERS_QUERY_KEY });
      toast({
        title: "Person Added",
        description: "Person has been linked to the lender successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error linking person",
        description: error instanceof Error ? error.message : 'Failed to link person to lender.',
      });
    },
  });

  // Remove person from lender mutation
  const removePersonFromLenderMutation = useMutation({
    mutationFn: async ({ lenderId, personId }: { lenderId: string; personId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('lender_people')
        .delete()
        .eq('lender_id', lenderId)
        .eq('person_id', personId)
        .eq('user_id', user.id);
      
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LENDERS_QUERY_KEY });
      toast({
        title: "Person Removed",
        description: "Person has been unlinked from the lender successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error unlinking person",
        description: error instanceof Error ? error.message : 'Failed to unlink person from lender.',
      });
    },
  });

  // Set primary person mutation
  const setPrimaryPersonMutation = useMutation({
    mutationFn: async ({ lenderId, personId }: { lenderId: string; personId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Remove primary status from all people for this lender
      await supabase
        .from('lender_people')
        .update({ is_primary: false })
        .eq('lender_id', lenderId)
        .eq('user_id', user.id);
      
      // Set the specified person as primary
      const { error } = await supabase
        .from('lender_people')
        .update({ is_primary: true })
        .eq('lender_id', lenderId)
        .eq('person_id', personId)
        .eq('user_id', user.id);
      
      if (error) throw handleSupabaseError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LENDERS_QUERY_KEY });
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
    lenders: lendersQuery.data || [],
    isLoading: lendersQuery.isLoading,
    error: lendersQuery.error,
    
    // Mutations
    addLender: addLenderMutation.mutate,
    addLenderWithPerson: addLenderWithPersonMutation.mutate,
    updateLender: updateLenderMutation.mutate,
    deleteLender: deleteLenderMutation.mutate,
    addPersonToLender: addPersonToLenderMutation.mutate,
    removePersonFromLender: removePersonFromLenderMutation.mutate,
    setPrimaryPerson: setPrimaryPersonMutation.mutate,
    
    // Mutation states
    isAdding: addLenderMutation.isPending,
    isAddingWithPerson: addLenderWithPersonMutation.isPending || isCreatingPersonWithEntity,
    isUpdating: updateLenderMutation.isPending,
    isDeleting: deleteLenderMutation.isPending,
    isAddingPerson: addPersonToLenderMutation.isPending,
    isRemovingPerson: removePersonFromLenderMutation.isPending,
    isSettingPrimary: setPrimaryPersonMutation.isPending,
    
    // Utility functions
    refetch: lendersQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: LENDERS_QUERY_KEY }),
    
    // Person-entity creation utilities
    createPersonWithEntity,
  };
}