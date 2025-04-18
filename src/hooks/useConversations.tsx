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

  // Fetch the list of unique conversation sessions
  const fetchConversationList = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    setListError(null);
    console.log("useConversations: Fetching conversation list for user:", user.id);
    try {
      const { data, error } = await supabase
        .rpc('get_latest_conversations_per_session', { user_uuid: user.id });

      if (error) throw error;

      console.log("useConversations: Fetched unique conversation list data:", data);
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
      setMessages(data || []);
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

  // Effect to fetch messages when the active session changes
  useEffect(() => {
      if (currentSessionId) {
        console.log(`useConversations: Active session changed to ${currentSessionId}, fetching messages...`);
        fetchMessages(currentSessionId);
      } else {
        console.log("useConversations: No active session, clearing messages.");
        setMessages([]);
      }
  }, [currentSessionId, fetchMessages]);

  // Add a message to the active or specified session
  const addMessage = async (
    messageContent: string,
    senderType: 'user' | 'ai',
    sessionId: string // Explicitly require session ID
  ): Promise<Conversation | null> => {
    if (!user || !sessionId) {
      toast({ variant: "destructive", title: "Error", description: "Cannot send message: User or Session ID missing." });
      return null;
    }
    console.log(`useConversations: Adding ${senderType} message to session ${sessionId}`);
    try {
      const newMessage: Omit<Conversation, 'id' | 'created_at'> = {
        user_id: user.id,
        session_id: sessionId, // Use the provided session ID
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
        console.log(`useConversations: Message added successfully to session ${sessionId}:`, data);
        // Update messages only if the message belongs to the currently active session
        if (sessionId === currentSessionId) {
          setMessages(prevMessages => [...prevMessages, data as Conversation]);
        }

        // Update the conversation list: Add if new, update timestamp if existing
        setConversationList(prevList => {
            const existingConvIndex = prevList.findIndex(conv => conv.session_id === sessionId);
            let newList: Conversation[]; // <-- Corrected type annotation
            if (existingConvIndex > -1) {
                // Update existing conversation's timestamp
                newList = prevList.map((conv, index) =>
                    index === existingConvIndex ? { ...conv, created_at: data.created_at, message: data.message, sender: data.sender } : conv
                );
            } else {
                // Add new conversation (this happens when the first message is saved)
                newList = [...prevList, data as Conversation];
            }
            // Remove temporary placeholder if it exists
            newList = newList.filter(conv => !String(conv.id).startsWith('temp-')); // <-- Applied fix here
            // Sort by the latest message timestamp
            return newList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        });

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

            // Create a temporary representation for the sidebar
             const tempNewConv: Conversation = {
                 id: `temp-${newSessionId}`, // Use a temporary, distinguishable ID
                 user_id: user.id,
                 created_at: new Date().toISOString(),
                 session_id: newSessionId,
                 message: "New Chat Started...", // Placeholder message
                 sender: undefined,
             };

            // Add to list optimistically & sort
            setConversationList(prev => [tempNewConv, ...prev]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

            setCurrentSessionId(newSessionId); // Set the new session as active
             setMessages([]); // Clear messages for the new session
             setMessageError(null); // Clear any previous message errors
             setLoadingMessages(false); // Ensure loading is false for the new empty session

            console.log("useConversations: New conversation started locally with session ID:", newSessionId);
            // --- TOAST REMOVED --- 

             // Return the temporary conversation object; it will be updated when the first message is added
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
        } finally {
            // Reset specific loading state if used
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

      // Update state: remove the conversation from the list
      setConversationList(prevList =>
        prevList.filter(conv => conv.session_id !== sessionId)
      );

      // If the deleted conversation was the active one, clear active state
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
        setMessageError(null);
      }

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
      setListError(errorMessage); // Use list error state
      return { success: false, error: errorMessage };
    }
  };

  // Function to explicitly set the active conversation
   const setActiveConversation = useCallback((sessionId: string | null) => {
       console.log(`useConversations: Setting active conversation to session ID: ${sessionId}`);
       if (sessionId !== currentSessionId) {
           setCurrentSessionId(sessionId);
           // Fetching messages is handled by the useEffect watching currentSessionId
       }
   }, [currentSessionId]);


  // Return values including message state and handlers
  return {
    // Conversation List related
    conversations: conversationList, // Renamed state variable
    loading: loadingList, // Renamed state variable
    error: listError, // Renamed state variable
    fetchConversations: fetchConversationList, // Renamed function

    // Active Conversation (Messages) related
    currentSessionId,
    setActiveConversation, // New function added
    messages, // Direct access to messages of the active session
    isLoading: loadingMessages, // Renamed state variable for message loading
    messageError, // New state variable for message errors
    fetchMessages, // Keep fetchMessages if needed externally (e.g., manual refresh)
    addMessage, // Updated function signature

    // Actions
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
