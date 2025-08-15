import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { useOptimisticListMutation } from './useOptimisticMutation';

export type EntityType = 'client' | 'lender' | 'realtor' | 'opportunity' | 'loan' | 'person' | 'document';

export interface Note {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  category?: string;
  entity_type?: EntityType;
  entity_id?: string;
  is_pinned: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NewNote {
  title?: string;
  content: string;
  category?: string;
  entity_type?: EntityType;
  entity_id?: string;
  is_pinned?: boolean;
  tags?: string[];
}

export interface NotesFilters {
  entityType?: EntityType;
  entityId?: string;
  category?: string;
  tags?: string[];
  search?: string;
  pinnedOnly?: boolean;
}

export function useImprovedNotes(filters?: NotesFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logActivityAndNotify } = useActivityAndNotification();

  const NOTES_QUERY_KEY = ['notes', filters] as const;

  // Fetch notes query with filtering
  const notesQuery = useQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filters?.entityType && filters?.entityId) {
        query = query.eq('entity_type', filters.entityType).eq('entity_id', filters.entityId);
      } else if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.pinnedOnly) {
        query = query.eq('is_pinned', true);
      }

      if (filters?.search) {
        query = query.or(`content.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
      }

      // Order by pinned first, then by created_at desc
      query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
        
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add note mutation
  const addNoteMutation = useOptimisticListMutation(
    async (noteData: NewNote) => {
      if (!user) throw new Error('User not authenticated');
      if (!noteData.content.trim()) throw new Error('Note content is required');
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          ...noteData,
          content: noteData.content.trim(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity if note is attached to an entity
      if (noteData.entity_type && noteData.entity_id) {
        const activityData: any = {
          action_type: 'note_added',
          description: `Note added to ${noteData.entity_type}`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          entity_type: noteData.entity_type,
          entity_id: noteData.entity_id,
          client_id: null,
          lender_id: null,
          document_id: null,
          opportunity_id: null,
          loan_id: null,
          people_id: null,
          realtor_id: null,
          id: undefined,
        };

        // Set the appropriate entity field
        switch (noteData.entity_type) {
          case 'client':
            activityData.client_id = noteData.entity_id;
            break;
          case 'lender':
            activityData.lender_id = noteData.entity_id;
            break;
          case 'realtor':
            activityData.realtor_id = noteData.entity_id;
            break;
          case 'opportunity':
            activityData.opportunity_id = noteData.entity_id;
            break;
          case 'loan':
            activityData.loan_id = noteData.entity_id;
            break;
          case 'person':
            activityData.people_id = noteData.entity_id;
            break;
          case 'document':
            activityData.document_id = noteData.entity_id;
            break;
        }

        await logActivityAndNotify(
          activityData,
          {
            user_id: user.id,
            type: 'note_added',
            entity_id: noteData.entity_id,
            entity_type: noteData.entity_type,
            message: `A new note was added to the ${noteData.entity_type}.`,
            read: false,
            created_at: new Date().toISOString(),
            id: undefined,
          }
        );
      }
      
      return data;
    },
    NOTES_QUERY_KEY,
    {
      addItem: (noteData) => ({
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,
        entity_type: noteData.entity_type,
        entity_id: noteData.entity_id,
        is_pinned: noteData.is_pinned || false,
        tags: noteData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      onSuccess: () => {
        toast({
          title: "Note Added",
          description: "Note has been added successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error Adding Note",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  // Update note mutation
  const updateNoteMutation = useOptimisticListMutation(
    async ({ noteId, updates }: { noteId: string; updates: Partial<NewNote> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    NOTES_QUERY_KEY,
    {
      updateItem: ({ noteId, updates }) => ({ id: noteId, ...updates }),
      onSuccess: () => {
        toast({
          title: "Note Updated",
          description: "Note has been updated successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error Updating Note",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  // Delete note mutation
  const deleteNoteMutation = useOptimisticListMutation(
    async (noteId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return noteId;
    },
    NOTES_QUERY_KEY,
    {
      removeItem: (noteId) => noteId,
      onSuccess: () => {
        toast({
          title: "Note Deleted",
          description: "Note has been deleted successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error Deleting Note",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  return {
    // Data
    notes: notesQuery.data || [],
    
    // Loading states
    isLoading: notesQuery.isLoading,
    isAdding: addNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
    
    // Error states
    error: notesQuery.error,
    
    // Actions
    addNote: (noteData: NewNote) => addNoteMutation.mutate(noteData),
    updateNote: (noteId: string, updates: Partial<NewNote>) => 
      updateNoteMutation.mutate({ noteId, updates }),
    deleteNote: (noteId: string) => deleteNoteMutation.mutate(noteId),
    
    // Utility
    refetch: notesQuery.refetch,
  };
}