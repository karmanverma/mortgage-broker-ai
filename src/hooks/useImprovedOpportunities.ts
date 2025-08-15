import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useActivityAndNotification } from './useActivityAndNotification';

export type Opportunity = Tables<'opportunities'> & {
  people?: {
    id: string;
    first_name: string;
    last_name: string;
    email_primary: string;
    phone_primary: string | null;
    company_name: string | null;
  };
  clients?: Tables<'clients'> & {
    people?: Array<Tables<'people'> & { is_primary?: boolean; relationship_type?: string }>;
    primary_person?: Tables<'people'>;
  };
  // All associated people through various relationships
  associated_people?: Array<Tables<'people'> & { 
    relationship_source: 'direct' | 'client' | 'referral';
    relationship_type?: string;
    is_primary?: boolean;
  }>;
};

export type OpportunityInsert = TablesInsert<'opportunities'>;
export type OpportunityUpdate = TablesUpdate<'opportunities'>;

export const useImprovedOpportunities = (filters?: {
  personId?: string;
  clientId?: string;
  peopleIds?: string[];
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logOpportunityActivity } = useActivityAndNotification();

  // Query for fetching opportunities with people filtering
  const {
    data: opportunities = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['opportunities', user?.id, filters],
    queryFn: async (): Promise<Opportunity[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      let query = supabase
        .from('opportunities')
        .select(`
          *,
          people!opportunities_people_id_fkey (
            id,
            first_name,
            last_name,
            email_primary,
            phone_primary,
            company_name,
            contact_type,
            preferred_communication_method,
            last_contact_date,
            relationship_strength_score
          ),
          clients (
            id,
            client_number,
            client_type,
            client_people!inner (
              is_primary,
              relationship_type,
              people:person_id (
                id,
                first_name,
                last_name,
                email_primary,
                phone_primary,
                company_name,
                contact_type,
                preferred_communication_method,
                last_contact_date,
                relationship_strength_score
              )
            )
          )
        `)
        .eq('user_id', user.id);
      
      // Apply people-based filters
      if (filters?.personId) {
        query = query.eq('people_id', filters.personId);
      }
      
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      
      if (filters?.peopleIds && filters.peopleIds.length > 0) {
        query = query.in('people_id', filters.peopleIds);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include associated_people from all relationships
      const transformedData = data?.map(opportunity => {
        const associated_people: Array<Tables<'people'> & { 
          relationship_source: 'direct' | 'client' | 'referral';
          relationship_type?: string;
          is_primary?: boolean;
        }> = [];
        
        // Add direct person relationship
        if (opportunity.people) {
          associated_people.push({
            ...opportunity.people,
            relationship_source: 'direct',
            relationship_type: 'primary_contact',
            is_primary: true
          });
        }
        
        // Add client-related people
        if (opportunity.clients?.client_people) {
          opportunity.clients.client_people.forEach(cp => {
            if (cp.people) {
              associated_people.push({
                ...cp.people,
                relationship_source: 'client',
                relationship_type: cp.relationship_type,
                is_primary: cp.is_primary
              });
            }
          });
        }
        
        // Transform client data for backward compatibility
        const clientWithPeople = opportunity.clients ? {
          ...opportunity.clients,
          people: opportunity.clients.client_people?.map(cp => ({
            ...cp.people,
            is_primary: cp.is_primary,
            relationship_type: cp.relationship_type
          })).filter(p => p && p.id) || [],
          primary_person: opportunity.clients.client_people?.find(cp => cp.is_primary)?.people
        } : undefined;
        
        return {
          ...opportunity,
          clients: clientWithPeople,
          associated_people
        };
      }) || [];
      
      return transformedData;
    },
    enabled: !!user?.id,
  });

  // Add opportunity mutation
  const addMutation = useMutation({
    mutationFn: async (newOpportunity: OpportunityInsert): Promise<Opportunity> => {
      if (!user?.id) throw new Error('User not authenticated');

      const opportunityData = {
        ...newOpportunity,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('opportunities')
        .insert(opportunityData)
        .select(`
          *,
          people!opportunities_people_id_fkey (
            id,
            first_name,
            last_name,
            email_primary,
            phone_primary,
            company_name
          )
        `)
        .single();

      if (error) throw error;

      // Log activity
      await logOpportunityActivity({
        action_type: 'opportunity_created',
        description: `Created new ${data.opportunity_type?.replace('_', ' ')} opportunity for ${data.people?.first_name} ${data.people?.last_name}`,
        user_id: user.id,
        opportunity_id: data.id,
        client_id: data.client_id,
        people_id: data.people_id,
        showNotification: true,
      });

      return data;
    },
    onMutate: async (newOpportunity) => {
      const queryKey = ['opportunities', user?.id, filters];
      await queryClient.cancelQueries({ queryKey });
      
      const previousOpportunities = queryClient.getQueryData<Opportunity[]>(queryKey);
      
      const optimisticOpportunity: Opportunity = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        stage: 'inquiry',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        date_created: new Date().toISOString(),
        date_modified: new Date().toISOString(),
        assigned_loan_officer: null,
        client_id: null,
        estimated_loan_amount: null,
        expected_close_date: null,
        last_activity_date: null,
        lead_score: null,
        lead_source: null,
        marketing_campaign_id: null,
        notes: null,
        probability_percentage: null,
        property_address: null,
        property_type: null,
        referral_fee_expected: null,
        urgency_level: null,
        ...newOpportunity,
      };

      queryClient.setQueryData<Opportunity[]>(
        queryKey,
        (old = []) => [optimisticOpportunity, ...old]
      );

      return { previousOpportunities, queryKey };
    },
    onError: (error, newOpportunity, context) => {
      if (context?.previousOpportunities && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousOpportunities);
      }
      toast({
        variant: "destructive",
        title: "Error adding opportunity",
        description: error instanceof Error ? error.message : "Failed to add opportunity",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Opportunity added",
        description: "The opportunity has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ['opportunities', user?.id] });
    },
  });

  // Update opportunity mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: OpportunityUpdate }): Promise<Opportunity> => {
      // Get current opportunity for comparison
      const { data: currentOpportunity } = await supabase
        .from('opportunities')
        .select('*, people!opportunities_people_id_fkey(first_name, last_name)')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          people!opportunities_people_id_fkey (
            id,
            first_name,
            last_name,
            email_primary,
            phone_primary,
            company_name
          )
        `)
        .single();

      if (error) throw error;

      // Log activity based on what was updated
      let activityDescription = `Updated opportunity for ${data.people?.first_name} ${data.people?.last_name}`;
      let actionType = 'opportunity_updated';

      // Check for stage changes
      if (updates.stage && currentOpportunity?.stage !== updates.stage) {
        actionType = 'opportunity_stage_changed';
        activityDescription = `Changed opportunity stage from "${currentOpportunity.stage}" to "${updates.stage}" for ${data.people?.first_name} ${data.people?.last_name}`;
      }

      await logOpportunityActivity({
        action_type: actionType as any,
        description: activityDescription,
        user_id: user?.id || '',
        opportunity_id: data.id,
        client_id: data.client_id,
        people_id: data.people_id,
        showNotification: true,
      });

      return data;
    },
    onMutate: async ({ id, updates }) => {
      const queryKey = ['opportunities', user?.id, filters];
      await queryClient.cancelQueries({ queryKey });
      
      const previousOpportunities = queryClient.getQueryData<Opportunity[]>(queryKey);
      
      queryClient.setQueryData<Opportunity[]>(
        queryKey,
        (old = []) => old.map(opportunity => 
          opportunity.id === id 
            ? { ...opportunity, ...updates, updated_at: new Date().toISOString() }
            : opportunity
        )
      );

      return { previousOpportunities, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousOpportunities && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousOpportunities);
      }
      toast({
        variant: "destructive",
        title: "Error updating opportunity",
        description: error instanceof Error ? error.message : "Failed to update opportunity",
      });
    },
    onSuccess: () => {
      toast({
        title: "Opportunity updated",
        description: "The opportunity has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['opportunities', user?.id] });
    },
  });

  // Delete opportunity mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Get opportunity details before deletion for activity log
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select('*, people!opportunities_people_id_fkey(first_name, last_name)')
        .eq('id', id)
        .single();

      // Log activity BEFORE deletion to avoid foreign key constraint issues
      if (opportunity) {
        await logOpportunityActivity({
          action_type: 'opportunity_updated', // Use valid action type
          description: `Deleted ${opportunity.opportunity_type?.replace('_', ' ')} opportunity for ${opportunity.people?.first_name} ${opportunity.people?.last_name}`,
          user_id: user?.id || '',
          opportunity_id: id,
          client_id: opportunity.client_id,
          people_id: opportunity.people_id,
          showNotification: true,
        });
      }

      // Delete opportunity after logging activity
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      const queryKey = ['opportunities', user?.id, filters];
      await queryClient.cancelQueries({ queryKey });
      
      const previousOpportunities = queryClient.getQueryData<Opportunity[]>(queryKey);
      
      queryClient.setQueryData<Opportunity[]>(
        queryKey,
        (old = []) => old.filter(opportunity => opportunity.id !== id)
      );

      return { previousOpportunities, queryKey };
    },
    onError: (error, id, context) => {
      if (context?.previousOpportunities && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousOpportunities);
      }
      toast({
        variant: "destructive",
        title: "Error deleting opportunity",
        description: error instanceof Error ? error.message : "Failed to delete opportunity",
      });
    },
    onSuccess: () => {
      toast({
        title: "Opportunity deleted",
        description: "The opportunity has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['opportunities', user?.id] });
    },
  });

  // Convert opportunity to loan
  const convertToLoanMutation = useMutation({
    mutationFn: async ({ opportunityId, loanData }: { 
      opportunityId: string; 
      loanData: Omit<TablesInsert<'loans'>, 'user_id' | 'opportunity_id'> 
    }): Promise<void> => {
      if (!user?.id) throw new Error('User not authenticated');

      // First update opportunity stage to 'converted'
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({ stage: 'converted' })
        .eq('id', opportunityId);

      if (updateError) throw updateError;

      // Then create the loan
      const { error: insertError } = await supabase
        .from('loans')
        .insert({
          ...loanData,
          user_id: user.id,
          opportunity_id: opportunityId,
        });

      if (insertError) throw insertError;

      // Log conversion activity
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select('*, people!opportunities_people_id_fkey(first_name, last_name)')
        .eq('id', opportunityId)
        .single();

      if (opportunity) {
        await logOpportunityActivity({
          action_type: 'opportunity_updated', // Use valid action type
          description: `Converted opportunity to loan for ${opportunity.people?.first_name} ${opportunity.people?.last_name}`,
          user_id: user.id,
          opportunity_id: opportunityId,
          client_id: opportunity.client_id,
          people_id: opportunity.people_id,
          showNotification: true,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Opportunity converted",
        description: "The opportunity has been successfully converted to a loan.",
      });
      queryClient.invalidateQueries({ queryKey: ['opportunities', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['loans', user?.id] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error converting opportunity",
        description: error instanceof Error ? error.message : "Failed to convert opportunity",
      });
    },
  });

  // Utility functions for people-based operations
  const getOpportunitiesByPerson = (personId: string) => {
    return opportunities.filter(opp => 
      opp.associated_people?.some(person => person.id === personId)
    );
  };
  
  const getOpportunitiesByPeople = (peopleIds: string[]) => {
    return opportunities.filter(opp => 
      opp.associated_people?.some(person => peopleIds.includes(person.id))
    );
  };
  
  const searchOpportunitiesByPersonName = (searchTerm: string) => {
    const lowerSearch = searchTerm.toLowerCase();
    return opportunities.filter(opp => 
      opp.associated_people?.some(person => 
        `${person.first_name} ${person.last_name}`.toLowerCase().includes(lowerSearch) ||
        person.email_primary?.toLowerCase().includes(lowerSearch) ||
        person.company_name?.toLowerCase().includes(lowerSearch)
      )
    );
  };

  return {
    opportunities,
    isLoading,
    error,
    refetch,
    addOpportunity: addMutation.mutate,
    updateOpportunity: updateMutation.mutate,
    deleteOpportunity: deleteMutation.mutate,
    convertToLoan: convertToLoanMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isConverting: convertToLoanMutation.isPending,
    
    // People-based utilities
    getOpportunitiesByPerson,
    getOpportunitiesByPeople,
    searchOpportunitiesByPersonName,
  };
};