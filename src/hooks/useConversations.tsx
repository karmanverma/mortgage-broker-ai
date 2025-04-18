import { useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation } from './useConversations.types';
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

export function useConversations() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State for the list of unique conversation sessions
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // State for the active conversation
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Conversation[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  // --- New state to trigger message refetch ---
  const [messageUpdateTrigger, setMessageUpdateTrigger] = useState(0);

  // Fetch the list of unique conversation sessions
  const fetchConversationList = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    setListError(null);
    // console.log("useConversations: Fetching conversation list for user:", user.id);
    try {
      const { data, error } = await supabase
        .rpc('get_latest_conversations_per_session', { user_uuid: user.id });

      if (error) throw error;

      // console.log("useConversations: Fetched unique conversation list data:", data);
      setConversationList(data as Conversation[] || []);

    } catch (err: any) {
      console.error("useConversations: Error fetching conversation list:", err);
      setListError(err.message || 'Failed to fetch conversation list');
      toast({
        title: "Error",
        description: "Could not fetch conversation list.",
        variant: "destructive",
      });
    } finally {
      setLoadingList(false);
    }
  }, [user, toast]);


  // Fetch messages for a specific session_id
  const fetchMessages = useCallback(async (sessionId: string | null) => {
    if (!user || !sessionId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    setMessageError(null);
    console.log(`useConversations: Fetching messages for session: ${sessionId}`);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log(`useConversations: Fetched ${data?.length} messages for session ${sessionId}`);
      setMessages(data || []); // Update messages state with fetched data
    } catch (err: any) {
      console.error(`useConversations: Error fetching messages for session ${sessionId}:`, err);
      setMessageError(err.message || 'Failed to fetch messages');
      toast({
        title: "Error",
        description: `Could not fetch messages for the selected conversation. ${err.message}`,
        variant: "destructive",
      });
       setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [user, toast]);

  // Effect to fetch the conversation list on user change
  useEffect(() => {
    fetchConversationList();
  }, [fetchConversationList]);

  // --- Effect to fetch messages when active session changes OR message trigger fires ---
  useEffect(() => {
      if (currentSessionId) {
        console.log(`useConversations: Active session changed or trigger fired for ${currentSessionId}, fetching messages...`);
        fetchMessages(currentSessionId);
      } else {
        console.log("useConversations: No active session, clearing messages.");
        setMessages([]);
      }
  // Watch both currentSessionId and the trigger
  }, [currentSessionId, messageUpdateTrigger, fetchMessages]); 

  // Add a message to the active or specified session
  const addMessage = async (
    messageContent: string,
    senderType: 'user' | 'ai',
    sessionId: string
  ): Promise<Conversation | null> => {
    if (!user || !sessionId) {
      toast({ variant: "destructive", title: "Error", description: "Cannot send message: User or Session ID missing." });
      return null;
    }
    console.log(`useConversations: Adding ${senderType} message to session ${sessionId}`);
    try {
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

      if (data) {
        console.log(`useConversations: Message added successfully to DB for session ${sessionId}:`, data);
        
        // --- Restore Optimistic Update for responsiveness ---
        if (sessionId === currentSessionId) {
          console.log(`useConversations: Optimistically adding message ${data.id} to UI.`);
          setMessages(prevMessages => [...prevMessages, data as Conversation]);
        }

        // Update the conversation list
        setConversationList(prevList => {
            const existingConvIndex = prevList.findIndex(conv => conv.session_id === sessionId);
            let newList: Conversation[];
            if (existingConvIndex > -1) {
                newList = prevList.map((conv, index) =>
                    index === existingConvIndex ? { ...conv, created_at: data.created_at, message: data.message, sender: data.sender } : conv
                );
            } else {
                newList = [...prevList, data as Conversation];
            }
            newList = newList.filter(conv => !String(conv.id).startsWith('temp-'));
            return newList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });

        // --- Remove explicit fetchMessages call ---
        // if (sessionId === currentSessionId) {
        //    console.log(`useConversations: Refetching messages for active session ${sessionId} after adding new message.`);
        //    await fetchMessages(sessionId); 
        // }

        // --- Increment trigger AFTER successful insertion and list update ---
        setMessageUpdateTrigger(prev => prev + 1);
        console.log(`useConversations: Incremented messageUpdateTrigger.`);

        return data as Conversation;
      }
      return null;

    } catch (err: any) {
      console.error(`useConversations: Error adding message to session ${sessionId}:`, err);
      toast({
        title: "Error Sending Message",
        description: err.message || "Could not save your message.",
        variant: "destructive",
      });
      setMessageError(err.message || 'Failed to send message');
      return null;
    }
  };

  // Start a new conversation session (locally first)
   const startNewConversation = async (): Promise<Conversation | null> => {
        if (!user) return null;
        console.log("useConversations: Starting new conversation...");
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

            setConversationList(prev => [tempNewConv, ...prev]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

            setCurrentSessionId(newSessionId); // This will trigger the useEffect to clear/fetch messages

            console.log("useConversations: New conversation started locally with session ID:", newSessionId);
            return tempNewConv;

        } catch (err: any) {
            console.error("useConversations: Error starting new conversation:", err);
            toast({
                title: "Error",
                description: err.message || "Could not start a new conversation.",
                variant: "destructive",
            });
            setListError(err.message || 'Failed to start conversation');
            return null;
        }
    };


  // Delete a conversation session
  const deleteConversation = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user || !sessionId) {
      const errorMsg = "User not authenticated or Session ID missing for deletion.";
      console.error("useConversations:", errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log(`useConversations: Deleting conversation session: ${sessionId}`);
    try {
      const { error: deleteError } = await supabase
        .from('conversations')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      console.log(`useConversations: Conversation session ${sessionId} deleted successfully from DB.`);

      setConversationList(prevList =>
        prevList.filter(conv => conv.session_id !== sessionId)
      );

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null); // This triggers useEffect to clear messages
      }
      // No need to manually trigger refetch here, changing currentSessionId handles it

      toast({
        title: "Conversation Deleted",
        description: "The conversation has been deleted successfully.",
      });
      return { success: true };

    } catch (err: any) {
      console.error("useConversations: Error deleting conversation session:", err);
      const errorMessage = err.message || 'Failed to delete conversation.';
      toast({
        title: "Error Deleting Conversation",
        description: errorMessage,
        variant: "destructive",
      });
      setListError(errorMessage); 
      return { success: false, error: errorMessage };
    }
  };

  // Function to explicitly set the active conversation
   const setActiveConversation = useCallback((sessionId: string | null) => {
       console.log(`useConversations: Setting active conversation to session ID: ${sessionId}`);
       if (sessionId !== currentSessionId) {
           setCurrentSessionId(sessionId); // Triggers useEffect to fetch/clear messages
       }
   }, [currentSessionId]);


  // Return values including message state and handlers
  return {
    conversations: conversationList,
    loading: loadingList,
    error: listError,
    fetchConversations: fetchConversationList,
    currentSessionId,
    setActiveConversation,
    messages,
    isLoading: loadingMessages,
    messageError,
    fetchMessages, // Keep exported if needed elsewhere
    addMessage,
    startNewConversation,
    deleteConversation,
  };
}

// Add the Supabase RPC function (run this in your Supabase SQL editor)
/*
-- Function to get the latest conversation entry for each session_id for a specific user
CREATE OR REPLACE FUNCTION get_latest_conversations_per_session(user_uuid UUID)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    message TEXT,
    sender TEXT,
    created_at TIMESTAMPTZ,
    session_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (c.session_id)
        c.id,
        c.user_id,
        c.message,
        c.sender,
        c.created_at,
        c.session_id
    FROM
        conversations c
    WHERE
        c.user_id = user_uuid
    ORDER BY
        c.session_id, c.created_at DESC;
END;
$$;

-- Grant execution permission to the authenticated role
GRANT EXECUTE ON FUNCTION get_latest_conversations_per_session(UUID) TO authenticated;
*/
