import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation } from './useConversations.types';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

export function useImprovedConversations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for the active conversation
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messageUpdateTrigger, setMessageUpdateTrigger] = useState(0);

  // Query for conversation list
  const {
    data: conversations = [],
    isLoading: loading,
    error: listError,
    refetch: fetchConversations
  } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .rpc('get_latest_conversations_per_session', { user_uuid: user.id });

      if (error) throw error;
      return (data as Conversation[]) || [];
    },
    enabled: !!user,
  });

  // Query for messages in current session
  const {
    data: messages = [],
    isLoading: loadingMessages,
    error: messageError,
    refetch: fetchMessages
  } = useQuery({
    queryKey: ['conversation-messages', currentSessionId, messageUpdateTrigger],
    queryFn: async () => {
      if (!user || !currentSessionId) return [];
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!currentSessionId,
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({ 
      messageContent, 
      senderType, 
      sessionId 
    }: { 
      messageContent: string; 
      senderType: 'user' | 'ai'; 
      sessionId: string; 
    }) => {
      if (!user) throw new Error('User not authenticated');

      const newMessage: Omit<Conversation, 'id' | 'created_at'> = {
        user_id: user.id,
        session_id: sessionId,
        message: messageContent,
        sender: senderType,
      };

      const { data, error } = await supabase
        .from('conversations')
        .insert(newMessage)
        .select('*')
        .single();

      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: (data, variables) => {
      // Update conversation list
      queryClient.setQueryData(['conversations', user?.id], (old: Conversation[] = []) => {
        const existingConvIndex = old.findIndex(conv => conv.session_id === variables.sessionId);
        let newList: Conversation[];
        if (existingConvIndex > -1) {
          newList = old.map((conv, index) =>
            index === existingConvIndex 
              ? { ...conv, created_at: data.created_at, message: data.message, sender: data.sender } 
              : conv
          );
        } else {
          newList = [...old, data];
        }
        return newList.filter(conv => !String(conv.id).startsWith('temp-'))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });

      // Optimistically update messages if it's the current session
      if (variables.sessionId === currentSessionId) {
        queryClient.setQueryData(['conversation-messages', currentSessionId, messageUpdateTrigger], 
          (old: Conversation[] = []) => [...old, data]
        );
      }

      // Increment trigger for refetch
      setMessageUpdateTrigger(prev => prev + 1);
    },
    onError: (error: any) => {
      toast({
        title: "Error Sending Message",
        description: error.message || "Could not save your message.",
        variant: "destructive",
      });
    }
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;
      return sessionId;
    },
    onSuccess: (sessionId) => {
      // Remove from conversation list
      queryClient.setQueryData(['conversations', user?.id], (old: Conversation[] = []) =>
        old.filter(conv => conv.session_id !== sessionId)
      );

      // Clear current session if it was deleted
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }

      toast({
        title: "Conversation Deleted",
        description: "The conversation has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Conversation",
        description: error.message || 'Failed to delete conversation.',
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const addMessage = useCallback(async (
    messageContent: string,
    senderType: 'user' | 'ai',
    sessionId: string
  ): Promise<Conversation | null> => {
    try {
      const result = await addMessageMutation.mutateAsync({
        messageContent,
        senderType,
        sessionId
      });
      return result;
    } catch (error) {
      return null;
    }
  }, [addMessageMutation]);

  const startNewConversation = useCallback(async (): Promise<Conversation | null> => {
    if (!user) return null;
    
    try {
      const newSessionId = uuidv4();
      const tempNewConv: Conversation = {
        id: `temp-${newSessionId}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        session_id: newSessionId,
        message: "New Chat Started...",
        sender: undefined,
      };

      // Add to conversation list optimistically
      queryClient.setQueryData(['conversations', user.id], (old: Conversation[] = []) =>
        [tempNewConv, ...old].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      );

      setCurrentSessionId(newSessionId);
      return tempNewConv;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not start a new conversation.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, queryClient, toast]);

  const deleteConversation = useCallback(async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteConversationMutation.mutateAsync(sessionId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [deleteConversationMutation]);

  const setActiveConversation = useCallback((sessionId: string | null) => {
    if (sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
    }
  }, [currentSessionId]);

  return {
    // Data
    conversations,
    messages,
    currentSessionId,
    
    // Loading states
    loading,
    isLoading: loadingMessages,
    loadingMessages,
    
    // Errors
    error: listError?.message || null,
    listError: listError?.message || null,
    messageError: messageError?.message || null,
    
    // Actions
    addMessage,
    startNewConversation,
    deleteConversation,
    setActiveConversation,
    fetchConversations,
    fetchMessages: () => fetchMessages(),
    
    // Mutation states
    isAddingMessage: addMessageMutation.isPending,
    isDeletingConversation: deleteConversationMutation.isPending,
  };
}