import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type Activity = Tables<'activities'> & {
  entity_name?: string;
  entity_details?: any;
};

export interface UseActivitiesOptions {
  entityType?: 'client' | 'lender' | 'opportunity' | 'loan' | 'person' | 'realtor';
  entityId?: string;
  personId?: string;
  limit?: number;
}

export const useActivities = (options: UseActivitiesOptions = {}) => {
  const { user } = useAuth();
  const { entityType, entityId, personId, limit = 50 } = options;

  return useQuery({
    queryKey: ['activities', user?.id, entityType, entityId, personId, limit],
    queryFn: async (): Promise<Activity[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      let query = supabase
        .from('activities')
        .select(`
          *,
          clients(id, people_id, people:people_id(first_name, last_name)),
          lenders(id, name, people:people_id(first_name, last_name)),
          opportunities(id, opportunity_type, people:people_id(first_name, last_name)),
          loans(id, loan_amount, loan_type, clients(people:people_id(first_name, last_name))),
          people(id, first_name, last_name),
          realtors(id, people:people_id(first_name, last_name))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Apply filters based on options
      if (entityType && entityId) {
        switch (entityType) {
          case 'client':
            query = query.eq('client_id', entityId);
            break;
          case 'lender':
            query = query.eq('lender_id', entityId);
            break;
          case 'opportunity':
            query = query.eq('opportunity_id', entityId);
            break;
          case 'loan':
            query = query.eq('loan_id', entityId);
            break;
          case 'person':
            query = query.eq('people_id', entityId);
            break;
          case 'realtor':
            query = query.eq('realtor_id', entityId);
            break;
        }
      }

      // Filter by person across all entity types
      if (personId) {
        // Use a simpler approach - filter by direct people_id only
        // The complex nested filtering was causing Supabase query parsing errors
        query = query.eq('people_id', personId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Activities query error:', error);
        throw error;
      }

      // Transform data to include entity names
      const transformedData: Activity[] = (data || []).map(activity => {
        let entity_name = 'Unknown';
        let entity_details = null;

        // Determine entity name based on what's populated
        if (activity.clients) {
          const client = activity.clients;
          entity_name = client.people ? `${client.people.first_name} ${client.people.last_name}` : `Client ${client.id.slice(0, 8)}`;
          entity_details = client;
        } else if (activity.lenders) {
          const lender = activity.lenders;
          entity_name = lender.name || (lender.people ? `${lender.people.first_name} ${lender.people.last_name}` : `Lender ${lender.id.slice(0, 8)}`);
          entity_details = lender;
        } else if (activity.opportunities) {
          const opportunity = activity.opportunities;
          entity_name = opportunity.people ? `${opportunity.people.first_name} ${opportunity.people.last_name} - ${opportunity.opportunity_type}` : `Opportunity ${opportunity.id.slice(0, 8)}`;
          entity_details = opportunity;
        } else if (activity.loans) {
          const loan = activity.loans;
          const clientName = loan.clients?.people ? `${loan.clients.people.first_name} ${loan.clients.people.last_name}` : 'Unknown Client';
          entity_name = `${clientName} - ${loan.loan_type} $${loan.loan_amount?.toLocaleString() || 'N/A'}`;
          entity_details = loan;
        } else if (activity.people) {
          const person = activity.people;
          entity_name = `${person.first_name} ${person.last_name}`;
          entity_details = person;
        } else if (activity.realtors) {
          const realtor = activity.realtors;
          entity_name = realtor.people ? `${realtor.people.first_name} ${realtor.people.last_name}` : `Realtor ${realtor.id.slice(0, 8)}`;
          entity_details = realtor;
        }

        return {
          ...activity,
          entity_name,
          entity_details,
        };
      });

      return transformedData;
    },
    enabled: !!user?.id,
  });
};

// Convenience hooks for specific entity types
export const useClientActivities = (clientId: string) => 
  useActivities({ entityType: 'client', entityId: clientId });

export const useLenderActivities = (lenderId: string) => 
  useActivities({ entityType: 'lender', entityId: lenderId });

export const useOpportunityActivities = (opportunityId: string) => 
  useActivities({ entityType: 'opportunity', entityId: opportunityId });

export const useLoanActivities = (loanId: string) => 
  useActivities({ entityType: 'loan', entityId: loanId });

export const usePersonActivities = (personId: string) => 
  useActivities({ personId });

export const useRealtorActivities = (realtorId: string) => 
  useActivities({ entityType: 'realtor', entityId: realtorId });