// src/hooks/useLenders.tsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Import the configured client
import { Tables } from '@/integrations/supabase/types';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useActivityAndNotification } from './useActivityAndNotification';

// Define Lender type using Tables utility
export type Lender = Tables<'lenders'>;

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
  const { logActivityAndNotify } = useActivityAndNotification();
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

      // Log activity and notification
      if (data) {
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
      }

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

      // Log activity and notification
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

      // Refresh the list after successful deletion
      await fetchLenders();

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


  const updateLender = async (updatedLender: Lender) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update a lender.",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`useLenders: Updating lender with ID: ${updatedLender.id}`);
    try {
      const { error } = await supabase
        .from('lenders')
        .update({
          name: updatedLender.name,
          type: updatedLender.type,
          contact_name: updatedLender.contact_name,
          contact_email: updatedLender.contact_email,
          contact_phone: updatedLender.contact_phone,
          status: updatedLender.status,
          notes: updatedLender.notes,
        })
        .eq('id', updatedLender.id)
        .eq('user_id', user.id); // Security check: ensure user owns the lender

      if (error) throw error;

      toast({
        title: "Lender Updated",
        description: `${updatedLender.name} has been updated successfully.`,
      });

      // Log activity and notification
      await logActivityAndNotify(
        {
          action_type: 'lender_updated',
          lender_id: updatedLender.id,
          description: `Lender ${updatedLender.name} updated`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          client_id: null,
          document_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'lender_updated',
          entity_id: updatedLender.id,
          entity_type: 'lender',
          message: `Lender ${updatedLender.name} was updated.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );

      // Refresh the list after successful update
      await fetchLenders();

    } catch (err: any) {
      console.error("useLenders: Error updating lender:", err);
      setError(err.message || 'Failed to update lender');
      toast({
        title: "Error",
        description: `Could not update ${updatedLender.name}. ${err.message}`,
        variant: "destructive",
      });
    }
  };

  return { lenders, isLoading, error, addLender, updateLender, deleteLender, fetchLenders };
}
