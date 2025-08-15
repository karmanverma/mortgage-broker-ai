import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type OpportunityActivity = Tables<'activities'> & {
  opportunity_id: string;
};

export const useOpportunityActivities = (opportunityId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['opportunity-activities', opportunityId, user?.id],
    queryFn: async (): Promise<OpportunityActivity[]> => {
      if (!user?.id || !opportunityId) return [];

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as OpportunityActivity[];
    },
    enabled: !!user?.id && !!opportunityId,
  });
};