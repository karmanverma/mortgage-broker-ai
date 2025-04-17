
import { useState } from 'react';
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

  const fetchLenders = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lenders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setLenders(data || []);
      
    } catch (error: any) {
      console.error('Error fetching lenders:', error);
      toast({
        variant: "destructive",
        title: "Failed to load lenders",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addLender = async (newLender: NewLender) => {
    if (!user) return null;
    
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
      
      await fetchLenders(); // Refresh the lenders list
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
  };

  const updateLender = async (id: string, updates: Partial<Omit<NewLender, 'id'>>) => {
    if (!user) return null;
    
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
      
      await fetchLenders(); // Refresh the lenders list
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
  };

  const deleteLender = async (id: string) => {
    if (!user) return false;
    
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
      
      await fetchLenders(); // Refresh the lenders list
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
  };

  return {
    lenders,
    isLoading,
    fetchLenders,
    addLender,
    updateLender,
    deleteLender
  };
}
