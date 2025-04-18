// src/hooks/useLenders.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Import the configured client
import { Lender } from '@/integrations/supabase/types';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';

export interface NewLenderData {
  name: string;
  type: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: string;
  notes?: string;
}

export function useLenders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLenders = useCallback(async () => {
    // ... (fetchLenders implementation remains the same)
    if (!user) {
      console.log("useLenders: No user found, skipping fetch.");
      return;
    }

    console.log("useLenders: Fetching lenders for user:", user.id);
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase // Use the imported supabase client
        .from('lenders')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      console.log("useLenders: Fetched lenders data:", data);
      setLenders(data || []);
    } catch (err: any) {
      console.error("useLenders: Error fetching lenders:", err);
      setError(err.message || 'Failed to fetch lenders');
      toast({
        title: "Error",
        description: "Could not fetch lenders.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchLenders();
  }, [fetchLenders]);

  const addLender = async (newLender: NewLenderData) => {
    // ... (addLender implementation remains the same)
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add a lender.",
        variant: "destructive",
      });
      return;
    }
    console.log(`useLenders: Adding new lender: ${newLender.name}`);
    try {
      const { data, error } = await supabase // Use the imported supabase client
        .from('lenders')
        .insert({
          name: newLender.name,
          type: newLender.type,
          contact_name: newLender.contactName,
          contact_email: newLender.contactEmail,
          contact_phone: newLender.contactPhone,
          status: newLender.status,
          notes: newLender.notes,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Lender Added",
        description: `${newLender.name} has been added successfully.`,
      });

      await fetchLenders();

    } catch (err: any) {
      console.error("useLenders: Error adding lender:", err);
      setError(err.message || 'Failed to add lender');
      toast({
        title: "Error",
        description: `Could not add lender ${newLender.name}.`,
        variant: "destructive",
      });
    }
  };

  // *** ADD DELETE LENDER FUNCTION ***
  const deleteLender = async (lenderId: string, lenderName?: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a lender.",
        variant: "destructive",
      });
      return;
    }
    const nameToDelete = lenderName || `Lender ID ${lenderId}`;
    console.log(`useLenders: Deleting lender with ID: ${lenderId}`);
    try {
      const { error } = await supabase // Use the imported supabase client
        .from('lenders')
        .delete()
        .match({ id: lenderId, user_id: user.id }); // Match both ID and user_id for security

      if (error) throw error;

      toast({
        title: "Lender Deleted",
        description: `${nameToDelete} has been deleted successfully.`,
      });

      // Refresh the list after successful deletion
      // Option 1: Refetch from server
      await fetchLenders();

      // Option 2: Update state locally (faster UI, assumes success)
      // setLenders(prevLenders => prevLenders.filter(lender => lender.id !== lenderId));

    } catch (err: any) {
      console.error("useLenders: Error deleting lender:", err);
      setError(err.message || 'Failed to delete lender');
      toast({
        title: "Error",
        description: `Could not delete ${nameToDelete}. ${err.message}`,
        variant: "destructive",
      });
    }
  };


  return { lenders, isLoading, error, addLender, deleteLender, fetchLenders }; // Add deleteLender to return object
}
