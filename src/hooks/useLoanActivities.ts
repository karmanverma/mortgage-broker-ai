import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useLoanActivities(loanId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loan-activities', loanId],
    queryFn: async () => {
      if (!user || !loanId) return [];
      
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .or(`client_id.eq.${loanId},lender_id.eq.${loanId},document_id.eq.${loanId}`)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!loanId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}