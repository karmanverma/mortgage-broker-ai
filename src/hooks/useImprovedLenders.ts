import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, handleSupabaseError } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from '@/components/ui/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { useOptimisticListMutation } from './useOptimisticMutation';

export type Lender = Tables<'lenders'>;
export type NewLenderData = Omit<TablesInsert<'lenders'>, 'user_id' | 'id' | 'created_at' | 'updated_at'>;

const LENDERS_QUERY_KEY = ['lenders'] as const;

export function useImprovedLenders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logActivityAndNotify } = useActivityAndNotification();

  // Fetch lenders query
  const lendersQuery = useQuery({
    queryKey: LENDERS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('lenders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw handleSupabaseError(error);
      
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Add lender mutation with optimistic updates
  const addLenderMutation = useOptimisticListMutation(
    async (lenderData: NewLenderData) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('lenders')
        .insert({
          ...lenderData,
          user_id: user.id,
        })
        .select('*')
        .single();
      
      if (error) throw handleSupabaseError(error);
      
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
      
      const { error } = await supabase
        .from('lenders')
        .delete()
        .eq('id', lenderId)
        .eq('user_id', user.id);
      
      if (error) throw handleSupabaseError(error);
      
      const nameToDelete = lenderName || `Lender ID ${lenderId}`;
      
      // Log activity
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

  return {
    // Query data
    lenders: lendersQuery.data || [],
    isLoading: lendersQuery.isLoading,
    error: lendersQuery.error,
    
    // Mutations
    addLender: addLenderMutation.mutate,
    updateLender: updateLenderMutation.mutate,
    deleteLender: deleteLenderMutation.mutate,
    
    // Mutation states
    isAdding: addLenderMutation.isPending,
    isUpdating: updateLenderMutation.isPending,
    isDeleting: deleteLenderMutation.isPending,
    
    // Utility functions
    refetch: lendersQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: LENDERS_QUERY_KEY }),
  };
}