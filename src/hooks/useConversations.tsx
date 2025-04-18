import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { toast } from '@/components/ui/use-toast';

// Define the Conversation type based on Supabase schema
export type Conversation = Database['public']['Tables']['conversations']['Row'];

// Type for the list of conversations (session IDs and last message time)
export type ConversationInfo = {
  session_id: string;
  last_message_at: string;
};

export const useConversations = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Conversation[]>([]);
  const [conversationList, setConversationList] = useState<ConversationInfo[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Fetching Conversation List ---
  const fetchConversationList = useCallback(async () => {
    if (!user) {
      setConversationList([]);
      return;
    }
    setIsLoadingList(true);
    setError(null);
    try {
      const { data, error: listError } = await supabase
        .from('conversations')
        .select('session_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listError) throw listError;

      const sessionsMap = new Map<string, string>();
      data.forEach(conv => {
          if (!sessionsMap.has(conv.session_id) || new Date(conv.created_at) > new Date(sessionsMap.get(conv.session_id)!)) {
              sessionsMap.set(conv.session_id, conv.created_at);
          }
      });

      const uniqueSessions: ConversationInfo[] = Array.from(sessionsMap.entries())
        .map(([session_id, last_message_at]) => ({ session_id, last_message_at }))
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setConversationList(uniqueSessions);

    } catch (err: any) {
      console.error('Error fetching conversation list:', err);
      setError('Failed to load conversation list.');
      toast({ variant: "destructive", title: "Error Loading Chats", description: err.message || 'Could not fetch past conversations.' });
      setConversationList([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversationList();
  }, [user, fetchConversationList]);

  // --- Managing Active Conversation ---
  const startNewConversation = useCallback(() => {
    if (user) {
      const newSessionId = uuidv4();
      setCurrentSessionId(newSessionId);
      setMessages([]);
      setError(null);
      // Don't add to list until first message is sent
    } else {
      setError("Cannot start conversation: User not logged in.");
    }
  }, [user]);

  useEffect(() => {
      if (user && !currentSessionId && !isLoadingList && conversationList.length > 0) {
          setCurrentSessionId(conversationList[0].session_id);
      } else if (user && !currentSessionId && !isLoadingList && conversationList.length === 0) {
          startNewConversation();
      }
  }, [user, currentSessionId, conversationList, isLoadingList, startNewConversation]);

  const setActiveConversation = useCallback((sessionId: string) => {
    if (sessionId !== currentSessionId) {
      setMessages([]);
      setCurrentSessionId(sessionId);
      setError(null);
    }
  }, [currentSessionId]);

  const fetchMessages = useCallback(async () => {
    if (!user || !currentSessionId) {
        setMessages([]);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError('Failed to load conversation history.');
      toast({ variant: "destructive", title: "Error Loading History", description: err.message || 'Could not fetch messages.' });
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentSessionId]);

  useEffect(() => {
    if (currentSessionId) {
        fetchMessages();
    } else {
        setMessages([]);
    }
  }, [currentSessionId, fetchMessages]);

  const addMessage = useCallback(async (messageContent: string, sender: 'user' | 'ai'): Promise<Conversation | null> => {
    if (!user || !currentSessionId) {
      setError('User not authenticated or session not active.');
      toast({ variant: "destructive", title: "Cannot Send Message", description: "No active session or user not logged in." });
      return null;
    }
    setError(null);

    const newMessageData = { user_id: user.id, session_id: currentSessionId, message: messageContent, sender: sender };

    try {
      const { data, error: insertError } = await supabase
        .from('conversations')
        .insert(newMessageData)
        .select()
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('Supabase insert did not return data.');

      setMessages((prevMessages) => [...prevMessages, data]);

      const sessionExists = conversationList.some(c => c.session_id === currentSessionId);
      const updatedList = [
            { session_id: currentSessionId, last_message_at: data.created_at },
            ...conversationList.filter(c => c.session_id !== currentSessionId)
        ];

      // Ensure list is sorted correctly after update/add
      updatedList.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      setConversationList(updatedList);

      return data;

    } catch (err: any) {
      console.error(`Failed to save ${sender} message to database:`, err);
      setError(`Failed to save ${sender} message.`);
      toast({ variant: "destructive", title: `Database Error`, description: `Could not save ${sender} message: ${err.message}` });
      return null;
    }
  }, [user, currentSessionId, conversationList]);

  const deleteConversation = useCallback(async (sessionIdToDelete: string) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "User not logged in." });
        return;
    }

    try {
        const { error: deleteError } = await supabase
            .from('conversations')
            .delete()
            .eq('user_id', user.id)
            .eq('session_id', sessionIdToDelete);

        if (deleteError) {
            throw deleteError;
        }

        toast({ title: "Chat Deleted", description: "The conversation has been removed." });

        const updatedList = conversationList.filter(c => c.session_id !== sessionIdToDelete);
        setConversationList(updatedList);

        if (currentSessionId === sessionIdToDelete) {
            if (updatedList.length > 0) {
                setCurrentSessionId(updatedList[0].session_id);
            } else {
                startNewConversation();
            }
        }

    } catch (err: any) {
        console.error("Error deleting conversation:", err);
        toast({
            variant: "destructive",
            title: "Deletion Failed",
            description: err.message || "Could not delete the conversation."
        });
    }
}, [user, conversationList, currentSessionId, startNewConversation]);

  return {
    messages,
    conversationList,
    currentSessionId,
    isLoading,
    isLoadingList,
    error,
    addMessage,
    startNewConversation,
    setActiveConversation,
    fetchMessages,
    deleteConversation,
  };
};
