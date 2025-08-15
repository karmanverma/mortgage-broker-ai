import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { usePersonWithEntityCreation, PersonWithEntityCreationOptions } from './usePersonWithEntityCreation';
import { useActivityAndNotification } from './useActivityAndNotification';
import { useOptimisticListMutation } from './useOptimisticMutation';

export type Realtor = Tables<'realtors'> & {
  people?: Array<Tables<'people'> & { is_primary?: boolean; relationship_type?: string }>;
  primary_person?: Tables<'people'>;
};

export type RealtorPerson = Tables<'realtor_people'>;
export type RealtorInsert = TablesInsert<'realtors'>;
export type RealtorUpdate = TablesUpdate<'realtors'>;
export type NewRealtorData = Omit<TablesInsert<'realtors'>, 'user_id' | 'id' | 'created_at' | 'updated_at'>;

const REALTORS_QUERY_KEY = ['realtors'] as const;

export const useImprovedRealtors = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivityAndNotify } = useActivityAndNotification();

  // Query for fetching realtors with people relationships
  const realtorsQuery = useQuery({
    queryKey: REALTORS_QUERY_KEY,
    queryFn: async (): Promise<Realtor[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      // First get realtors
      const { data: realtorsData, error: realtorsError } = await supabase
        .from('realtors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (realtorsError) throw realtorsError;
      
      if (!realtorsData || realtorsData.length === 0) {
        return [];
      }
      
      // Then get realtor-people relationships with people data
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('realtor_people')
        .select(`
          realtor_id,
          is_primary,
          relationship_type,
          people:person_id (
            id,
            first_name,
            last_name,
            email_primary,
            phone_primary,
            company_name,
            title_position,
            address_city,
            address_state,
            social_linkedin,
            preferred_communication_method,
            last_contact_date,
            relationship_strength_score,
            tags,
            notes
          )
        `)
        .eq('user_id', user.id)
        .in('realtor_id', realtorsData.map(r => r.id));
        
      if (relationshipsError) throw relationshipsError;
      
      // Transform the data to include people array and primary_person
      const transformedData = realtorsData.map(realtor => {
        const realtorRelationships = relationshipsData?.filter(r => r.realtor_id === realtor.id) || [];
        
        const people = realtorRelationships.map(rel => ({
          ...rel.people,
          is_primary: rel.is_primary,
          relationship_type: rel.relationship_type
        })).filter(p => p && p.id) || [];
        
        const primary_person = people.find(p => p.is_primary);
        
        return {
          ...realtor,
          people,
          primary_person
        };
      });
      
      return transformedData;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Person-entity creation integration
  const { createPersonWithEntity, isCreating: isCreatingPersonWithEntity } = usePersonWithEntityCreation();

  // Add realtor with person-entity creation
  const addRealtorWithPersonMutation = useMutation({
    mutationFn: async (options: PersonWithEntityCreationOptions) => {
      const result = await createPersonWithEntity(options);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create realtor with person');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REALTORS_QUERY_KEY });
    },
  });

  // Legacy add realtor mutation with optimistic updates (for backward compatibility)
  const addRealtorMutation = useOptimisticListMutation(
    async (realtorData: NewRealtorData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('realtors')
        .insert({
          ...realtorData,
          user_id: user.id,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'realtor_added',
          description: `Realtor added`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          lender_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'realtor_added',
          entity_id: data.id,
          entity_type: 'realtor',
          message: `A new realtor was added.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      return data;
    },
    REALTORS_QUERY_KEY,
    {
      addItem: (variables) => ({
        ...variables,
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active_status: variables.active_status ?? true,
        relationship_level: variables.relationship_level || 5,
        total_deals_closed: variables.total_deals_closed || 0,
        total_referrals_sent: variables.total_referrals_sent || 0,
        marketing_co_op_available: variables.marketing_co_op_available || false,
      }),
      onSuccess: () => {
        toast({
          title: "Realtor Added",
          description: "Realtor has been added successfully.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error adding realtor",
          description: error instanceof Error ? error.message : 'Failed to add realtor.',
        });
      },
    }
  );

  // Update realtor mutation
  const updateRealtorMutation = useOptimisticListMutation(
    async ({ realtorId, updates }: { realtorId: string; updates: Partial<Realtor> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('realtors')
        .update(updates as TablesUpdate<'realtors'>)
        .eq('id', realtorId)
        .eq('user_id', user.id)
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'realtor_updated',
          description: `Realtor updated`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          lender_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'realtor_updated',
          entity_id: realtorId,
          entity_type: 'realtor',
          message: `Realtor was updated.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      return data;
    },
    REALTORS_QUERY_KEY,
    {
      updateItem: (oldItem, { updates }) => ({ ...oldItem, ...updates }),
      findItem: (item, { realtorId }) => item.id === realtorId,
      onSuccess: () => {
        toast({
          title: "Realtor Updated",
          description: "Realtor has been updated successfully.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error updating realtor",
          description: error instanceof Error ? error.message : 'Failed to update realtor.',
        });
      },
    }
  );

  // Delete realtor mutation
  const deleteRealtorMutation = useOptimisticListMutation(
    async (realtorId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('realtors')
        .delete()
        .eq('id', realtorId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'realtor_deleted',
          description: `Realtor deleted`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          lender_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'realtor_deleted',
          entity_id: realtorId,
          entity_type: 'realtor',
          message: `A realtor was deleted.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      return { id: realtorId } as Realtor;
    },
    REALTORS_QUERY_KEY,
    {
      removeItem: (realtorId) => true,
      onSuccess: () => {
        toast({
          title: "Realtor Deleted",
          description: "Realtor has been deleted successfully.",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error deleting realtor",
          description: error instanceof Error ? error.message : 'Failed to delete realtor.',
        });
      },
    }
  );

  // Add person to realtor mutation
  const addPersonToRealtorMutation = useMutation({
    mutationFn: async ({ realtorId, personId, isPrimary = false, relationshipType = 'contact' }: {
      realtorId: string;
      personId: string;
      isPrimary?: boolean;
      relationshipType?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      // If setting as primary, first remove primary status from other people
      if (isPrimary) {
        await supabase
          .from('realtor_people')
          .update({ is_primary: false })
          .eq('realtor_id', realtorId)
          .eq('user_id', user.id);
      }
      
      const { data, error } = await supabase
        .from('realtor_people')
        .insert({
          realtor_id: realtorId,
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
      queryClient.invalidateQueries({ queryKey: REALTORS_QUERY_KEY });
      toast({
        title: "Person Added",
        description: "Person has been linked to the realtor successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error linking person",
        description: error instanceof Error ? error.message : 'Failed to link person to realtor.',
      });
    },
  });

  // Remove person from realtor mutation
  const removePersonFromRealtorMutation = useMutation({
    mutationFn: async ({ realtorId, personId }: { realtorId: string; personId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('realtor_people')
        .delete()
        .eq('realtor_id', realtorId)
        .eq('person_id', personId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REALTORS_QUERY_KEY });
      toast({
        title: "Person Removed",
        description: "Person has been unlinked from the realtor successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error unlinking person",
        description: error instanceof Error ? error.message : 'Failed to unlink person from realtor.',
      });
    },
  });

  // Set primary person mutation
  const setPrimaryPersonMutation = useMutation({
    mutationFn: async ({ realtorId, personId }: { realtorId: string; personId: string }) => {
      if (!user) throw new Error('User not authenticated');
      
      // Remove primary status from all people for this realtor
      await supabase
        .from('realtor_people')
        .update({ is_primary: false })
        .eq('realtor_id', realtorId)
        .eq('user_id', user.id);
      
      // Set the specified person as primary
      const { error } = await supabase
        .from('realtor_people')
        .update({ is_primary: true })
        .eq('realtor_id', realtorId)
        .eq('person_id', personId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REALTORS_QUERY_KEY });
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
    realtors: realtorsQuery.data || [],
    isLoading: realtorsQuery.isLoading,
    error: realtorsQuery.error,
    
    // Mutations
    addRealtor: addRealtorMutation.mutate,
    addRealtorWithPerson: addRealtorWithPersonMutation.mutate,
    updateRealtor: updateRealtorMutation.mutate,
    deleteRealtor: deleteRealtorMutation.mutate,
    addPersonToRealtor: addPersonToRealtorMutation.mutate,
    removePersonFromRealtor: removePersonFromRealtorMutation.mutate,
    setPrimaryPerson: setPrimaryPersonMutation.mutate,
    
    // Mutation states
    isAdding: addRealtorMutation.isPending,
    isAddingWithPerson: addRealtorWithPersonMutation.isPending || isCreatingPersonWithEntity,
    isUpdating: updateRealtorMutation.isPending,
    isDeleting: deleteRealtorMutation.isPending,
    isAddingPerson: addPersonToRealtorMutation.isPending,
    isRemovingPerson: removePersonFromRealtorMutation.isPending,
    isSettingPrimary: setPrimaryPersonMutation.isPending,
    
    // Utility functions
    refetch: realtorsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: REALTORS_QUERY_KEY }),
    
    // Person-entity creation utilities
    createPersonWithEntity,
  };
};