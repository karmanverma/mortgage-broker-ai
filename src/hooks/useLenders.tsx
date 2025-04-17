import { useState, useCallback } from 'react'; // Import useCallback
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type Lender = Tables<'lenders'>;

export type NewLender = {
  name: string;
  type: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: string;
  notes?: string;
};

export function useLenders() {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // --- Modification: Wrap fetchLenders in useCallback ---
  const fetchLenders = useCallback(async () => {
    console.log("useLenders: fetchLenders called");
    if (!user) {
        console.log("useLenders: No user, returning");
        setLenders([]); // Clear lenders if no user
        setIsLoading(false);
        return;
    }

    console.log(`useLenders: Fetching lenders for user ${user.id}`);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lenders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setLenders(data || []);
      console.log(`useLenders: Successfully fetched ${data?.length || 0} lenders.`);

    } catch (error: any) {
      console.error('Error fetching lenders:', error);
      toast({
        variant: "destructive",
        title: "Failed to load lenders",
        description: error.message,
      });
      setLenders([]); // Clear lenders on error
    } finally {
        console.log("useLenders: fetchLenders finished, setting isLoading false");
      setIsLoading(false);
    }
    // Dependencies: user, supabase (stable), toast (stable), setIsLoading, setLenders (stable)
  }, [user, toast]);

  // --- Modification: Wrap addLender in useCallback ---
  const addLender = useCallback(async (newLender: NewLender) => {
    if (!user) return null;

    console.log(`useLenders: Adding new lender: ${newLender.name}`);
    // Note: We don't set isLoading here, assuming the page handles loading state
    try {
      const { data, error } = await supabase
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

      // Update state directly instead of calling fetchLenders to avoid potential race conditions
      // and ensure the UI updates immediately.
      setLenders(prevLenders => [...prevLenders, data].sort((a, b) => a.name.localeCompare(b.name)));
      console.log(`useLenders: Lender added and local state updated.`);
      // await fetchLenders(); // Replaced with direct state update
      return data;

    } catch (error: any) {
      console.error('Error adding lender:', error);
      toast({
        variant: "destructive",
        title: "Failed to add lender",
        description: error.message,
      });
      return null;
    }
    // Dependencies: user, toast, fetchLenders (stable now), setLenders (stable)
  }, [user, toast, setLenders]); // Removed fetchLenders, added setLenders

  // --- Modification: Wrap updateLender in useCallback ---
  const updateLender = useCallback(async (id: string, updates: Partial<Omit<NewLender, 'id'>>) => {
    if (!user) return null;

    console.log(`useLenders: Updating lender ID: ${id}`);
    try {
      const updateData: Record<string, any> = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.type) updateData.type = updates.type;
      if (updates.contactName) updateData.contact_name = updates.contactName;
      if (updates.contactEmail) updateData.contact_email = updates.contactEmail;
      if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
      if (updates.status) updateData.status = updates.status;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data, error } = await supabase
        .from('lenders')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Lender Updated",
        description: `The lender has been updated successfully.`,
      });

      // Update state directly
      setLenders(prevLenders =>
        prevLenders.map(l => l.id === id ? data : l).sort((a, b) => a.name.localeCompare(b.name))
      );
      console.log(`useLenders: Lender updated and local state updated.`);
      // await fetchLenders(); // Replaced with direct state update
      return data;

    } catch (error: any) {
      console.error('Error updating lender:', error);
      toast({
        variant: "destructive",
        title: "Failed to update lender",
        description: error.message,
      });
      return null;
    }
     // Dependencies: user, toast, fetchLenders (stable now), setLenders (stable)
  }, [user, toast, setLenders]); // Removed fetchLenders, added setLenders

  // --- Modification: Wrap deleteLender in useCallback ---
  const deleteLender = useCallback(async (id: string) => {
    if (!user) return false;

    console.log(`useLenders: Deleting lender ID: ${id}`);
    try {
      const { error } = await supabase
        .from('lenders')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Lender Deleted",
        description: "The lender has been deleted successfully.",
      });

       // Update state directly
      setLenders(prevLenders => prevLenders.filter(l => l.id !== id));
      console.log(`useLenders: Lender deleted and local state updated.`);
      // await fetchLenders(); // Replaced with direct state update
      return true;

    } catch (error: any) {
      console.error('Error deleting lender:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete lender",
        description: error.message,
      });
      return false;
    }
     // Dependencies: user, toast, fetchLenders (stable now), setLenders (stable)
  }, [user, toast, setLenders]); // Removed fetchLenders, added setLenders

  return {
    lenders,
    isLoading,
    fetchLenders,
    addLender,
    updateLender,
    deleteLender
  };
}
