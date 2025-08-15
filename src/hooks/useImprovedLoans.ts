import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';

export type Loan = Tables<'loans'> & {
  clients?: Tables<'clients'> & {
    people?: Array<Tables<'people'> & { is_primary?: boolean; relationship_type?: string }>;
    primary_person?: Tables<'people'>;
  };
  lenders?: Tables<'lenders'> & {
    people?: Array<Tables<'people'> & { is_primary?: boolean; relationship_type?: string }>;
    primary_person?: Tables<'people'>;
  };
  realtors?: Tables<'realtors'> & {
    people?: Array<Tables<'people'> & { is_primary?: boolean; relationship_type?: string }>;
    primary_person?: Tables<'people'>;
  };
  opportunities?: Tables<'opportunities'> & {
    people?: Tables<'people'>;
  };
  // All associated people through various relationships
  associated_people?: Array<Tables<'people'> & { 
    relationship_source: 'client' | 'lender' | 'realtor' | 'opportunity';
    relationship_type?: string;
    is_primary?: boolean;
  }>;
};

export type LoanInsert = TablesInsert<'loans'>;
export type LoanUpdate = TablesUpdate<'loans'>;

export const useImprovedLoans = (filters?: {
  personId?: string;
  clientId?: string;
  lenderId?: string;
  realtorId?: string;
  peopleIds?: string[];
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logLoanActivity } = useActivityAndNotification();

  // Query for fetching loans with people filtering
  const {
    data: loans = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['loans', user?.id, filters],
    queryFn: async (): Promise<Loan[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Fetching loans for user:', user.id);

      let query = supabase
        .from('loans')
        .select(`
          *,
          clients (
            id,
            client_number,
            client_type,
            people:people_id (
              id,
              first_name,
              last_name,
              email_primary,
              phone_primary,
              company_name,
              contact_type
            )
          ),
          lenders (
            id,
            name,
            type,
            status
          ),
          realtors (
            id,
            license_number,
            brokerage_name
          ),
          opportunities (
            id,
            opportunity_type,
            stage,
            people:people_id (
              id,
              first_name,
              last_name,
              email_primary,
              phone_primary,
              company_name
            )
          )
        `)
        .eq('user_id', user.id);
      
      // Apply people-based filters (simplified)
      if (filters?.personId) {
        // Filter by client or opportunity person
        query = query.or(`clients.people_id.eq.${filters.personId},opportunities.people_id.eq.${filters.personId}`);
      }
      
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      
      if (filters?.lenderId) {
        query = query.eq('lender_id', filters.lenderId);
      }
      
      if (filters?.realtorId) {
        query = query.eq('realtor_id', filters.realtorId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      console.log('Loans query result:', { data, error });

      if (error) throw error;
      
      // Transform data to include associated_people from all relationships
      const transformedData = data?.map(loan => {
        const associated_people: Array<Tables<'people'> & { 
          relationship_source: 'client' | 'lender' | 'realtor' | 'opportunity';
          relationship_type?: string;
          is_primary?: boolean;
        }> = [];
        
        // Add client-related people (simplified)
        if (loan.clients?.people) {
          associated_people.push({
            ...loan.clients.people,
            relationship_source: 'client',
            relationship_type: 'primary_client',
            is_primary: true
          });
        }
        
        // Add opportunity-related people
        if (loan.opportunities?.people) {
          associated_people.push({
            ...loan.opportunities.people,
            relationship_source: 'opportunity',
            relationship_type: 'primary_contact',
            is_primary: true
          });
        }
        
        return {
          ...loan,
          associated_people
        };
      }) || [];
      
      return transformedData;
    },
    enabled: !!user?.id,
  });

  // Add loan mutation
  const addMutation = useMutation({
    mutationFn: async (newLoan: LoanInsert): Promise<Loan> => {
      if (!user?.id) throw new Error('User not authenticated');

      const loanData = {
        ...newLoan,
        user_id: user.id,
      };
      
      console.log('[useImprovedLoans] Inserting loan data:', loanData);

      const { data, error } = await supabase
        .from('loans')
        .insert(loanData)
        .select(`
          *,
          clients (
            id,
            client_number,
            client_type,
            people:people_id (
              id,
              first_name,
              last_name,
              email_primary,
              phone_primary,
              company_name
            )
          ),
          lenders (
            id,
            name,
            type
          ),
          opportunities (
            id,
            opportunity_type,
            stage
          )
        `)
        .single();

      console.log('[useImprovedLoans] Insert result:', { data, error });
      console.log('[useImprovedLoans] Error object:', error);
      
      if (error) {
        console.error('[useImprovedLoans] Database error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }
      return data;
    },
    onMutate: async (newLoan) => {
      const queryKey = ['loans', user?.id, filters];
      await queryClient.cancelQueries({ queryKey });
      
      const previousLoans = queryClient.getQueryData<Loan[]>(queryKey);
      
      const optimisticLoan: Loan = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        loan_status: 'application',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        application_date: null,
        approval_date: null,
        client_id: null,
        closing_date: null,
        commission_amount: null,
        compliance_status: null,
        conditions_outstanding: null,
        debt_to_income_ratio: null,
        down_payment: null,
        estimated_closing_date: null,
        funding_date: null,
        interest_rate: null,
        lender_id: null,
        loan_amount: null,
        loan_number: null,
        loan_officer_assigned: null,
        loan_term: null,
        loan_to_value_ratio: null,
        monthly_payment: null,
        notes: null,
        opportunity_id: null,
        priority_level: 'medium',
        processor_assigned: null,
        profit_margin: null,
        property_address: null,
        property_value: null,
        rate_lock_date: null,
        rate_lock_expiration: null,
        realtor_id: null,
        underwriter_assigned: null,
        ...newLoan,
      };

      queryClient.setQueryData<Loan[]>(
        queryKey,
        (old = []) => [optimisticLoan, ...old]
      );

      return { previousLoans, queryKey };
    },
    onError: (error, newLoan, context) => {
      console.error('[useImprovedLoans] Loan creation failed:', error);
      console.error('[useImprovedLoans] Failed loan data:', newLoan);
      
      if (context?.previousLoans && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousLoans);
      }
      toast({
        variant: "destructive",
        title: "Error adding loan",
        description: error instanceof Error ? error.message : "Failed to add loan",
      });
    },
    onSuccess: async (data) => {
      console.log('[useImprovedLoans] Loan added successfully:', data);
      
      // Log activity
      await logLoanActivity({
        action_type: 'loan_created',
        description: `New loan created: ${data.loan_number || 'Loan'}`,
        user_id: user!.id,
        loan_id: data.id,
        client_id: data.client_id,
        lender_id: data.lender_id,
        opportunity_id: data.opportunity_id,
        showNotification: true,
      });
      
      toast({
        title: "Loan added",
        description: "The loan has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ['loans', user?.id] });
    },
  });

  // Update loan mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LoanUpdate }): Promise<Loan> => {
      console.log('[useImprovedLoans] Updating loan:', { id, updates });
      
      const { data, error } = await supabase
        .from('loans')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          clients (
            id,
            client_number,
            client_type,
            people:people_id (
              id,
              first_name,
              last_name,
              email_primary,
              phone_primary,
              company_name
            )
          ),
          lenders (
            id,
            name,
            type
          ),
          opportunities (
            id,
            opportunity_type,
            stage
          )
        `)
        .single();

      console.log('[useImprovedLoans] Update result:', { data, error });
      
      if (error) {
        console.error('[useImprovedLoans] Update error:', error);
        throw error;
      }
      return data;
    },
    onMutate: async ({ id, updates }) => {
      const queryKey = ['loans', user?.id, filters];
      await queryClient.cancelQueries({ queryKey });
      
      const previousLoans = queryClient.getQueryData<Loan[]>(queryKey);
      
      queryClient.setQueryData<Loan[]>(
        queryKey,
        (old = []) => old.map(loan => 
          loan.id === id 
            ? { ...loan, ...updates, updated_at: new Date().toISOString() }
            : loan
        )
      );

      return { previousLoans, queryKey };
    },
    onError: (error, variables, context) => {
      if (context?.previousLoans && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousLoans);
      }
      toast({
        variant: "destructive",
        title: "Error updating loan",
        description: error instanceof Error ? error.message : "Failed to update loan",
      });
    },
    onSuccess: async (data) => {
      // Log activity
      await logLoanActivity({
        action_type: 'loan_updated',
        description: `Loan ${data.loan_number || 'details'} updated`,
        user_id: user!.id,
        loan_id: data.id,
        client_id: data.client_id,
        lender_id: data.lender_id,
        opportunity_id: data.opportunity_id,
        showNotification: true,
      });
      
      toast({
        title: "Loan updated",
        description: "The loan has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['loans', user?.id] });
    },
  });

  // Delete loan mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Get loan data before deletion for activity logging
      const { data: existingLoan } = await supabase
        .from('loans')
        .select('client_id, lender_id, loan_number')
        .eq('id', id)
        .single();
      
      // Log activity BEFORE deletion to avoid foreign key constraint issues
      await logLoanActivity({
        action_type: 'loan_deleted',
        description: `Loan ${existingLoan?.loan_number || 'deleted'}`,
        user_id: user!.id,
        loan_id: id,
        client_id: existingLoan?.client_id || null,
        lender_id: existingLoan?.lender_id || null,
        showNotification: true,
      });
      
      // Delete loan after logging activity
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      const queryKey = ['loans', user?.id, filters];
      await queryClient.cancelQueries({ queryKey });
      
      const previousLoans = queryClient.getQueryData<Loan[]>(queryKey);
      
      queryClient.setQueryData<Loan[]>(
        queryKey,
        (old = []) => old.filter(loan => loan.id !== id)
      );

      return { previousLoans, queryKey };
    },
    onError: (error, id, context) => {
      if (context?.previousLoans && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousLoans);
      }
      toast({
        variant: "destructive",
        title: "Error deleting loan",
        description: error instanceof Error ? error.message : "Failed to delete loan",
      });
    },
    onSuccess: () => {
      toast({
        title: "Loan deleted",
        description: "The loan has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['loans', user?.id] });
    },
  });

  // Utility functions for people-based operations
  const getLoansByPerson = (personId: string) => {
    return loans.filter(loan => 
      loan.associated_people?.some(person => person.id === personId)
    );
  };
  
  const getLoansByPeople = (peopleIds: string[]) => {
    return loans.filter(loan => 
      loan.associated_people?.some(person => peopleIds.includes(person.id))
    );
  };
  
  const searchLoansByPersonName = (searchTerm: string) => {
    const lowerSearch = searchTerm.toLowerCase();
    return loans.filter(loan => 
      loan.associated_people?.some(person => 
        `${person.first_name} ${person.last_name}`.toLowerCase().includes(lowerSearch) ||
        person.email_primary?.toLowerCase().includes(lowerSearch) ||
        person.company_name?.toLowerCase().includes(lowerSearch)
      )
    );
  };
  
  const getLoansByRelationshipSource = (source: 'client' | 'lender' | 'realtor' | 'opportunity') => {
    return loans.filter(loan => 
      loan.associated_people?.some(person => person.relationship_source === source)
    );
  };
  
  const getPrimaryContactsForLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    return loan?.associated_people?.filter(person => person.is_primary) || [];
  };

  return {
    loans,
    isLoading,
    error,
    refetch,
    addLoan: addMutation.mutate,
    updateLoan: updateMutation.mutate,
    deleteLoan: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // People-based utilities
    getLoansByPerson,
    getLoansByPeople,
    searchLoansByPersonName,
    getLoansByRelationshipSource,
    getPrimaryContactsForLoan,
  };
};