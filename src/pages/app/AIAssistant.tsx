
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/components/ui/use-toast";
import { ConversationSidebar } from '@/components/ai-assistant/ConversationSidebar';
import MainChatArea from '@/components/ai-assistant/MainChatArea';
import ContextPanel from '@/components/ai-assistant/ContextPanel'; // Keep for dialog content
import { cn } from '@/lib/utils';
import { Conversation as ConversationMessage } from '@/hooks/useConversations.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { MessageSquareText, Settings2 } from 'lucide-react'; // Icons for buttons

// Interface for individual messages remains the same
interface Message {
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
  id: string;
  session_id: string;
  user_id: string;
}

const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  // isMobile hook is no longer needed for layout decisions here
  // const isMobile = useIsMobile(); 

  const {
    conversations: conversationList,
    loading: isLoadingList,
    error: conversationListError,
    startNewConversation,
    deleteConversation,
    messages: apiMessages,
    setActiveConversation,
    currentSessionId,
    isLoading: isLoadingHistory,
    error: messageError,
    addMessage,
    fetchMessages,
  } = useConversations();

  // Map raw messages for display
  const messages: Message[] = (apiMessages || []).map((msg: ConversationMessage) => ({
    sender: msg.sender as 'user' | 'ai',
    message: msg.message || '',
    created_at: msg.created_at,
    id: String(msg.id),
    session_id: msg.session_id,
    user_id: msg.user_id
  }));

  const [newMessage, setNewMessage] = useState("");
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [isConversationDialogOpen, setIsConversationDialogOpen] = useState(false);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);

  const [messageContext, setMessageContext] = useState<{
    selectedClientId?: string;
    selectedLenderIds: string[];
    selectedDocumentIds: string[];
  }>({
    selectedLenderIds: [],
    selectedDocumentIds: [],
  });

  const [messageSuggestions] = useState([
    "Show me this client's loan application status",
    "Compare rates from selected lenders",
    "What documents are still needed?",
    "Summarize client's financial profile"
  ]);

  // Fetch messages when the active conversation changes
  useEffect(() => {
    if (currentSessionId) {
      console.log(`AIAssistantPage: Active session changed to ${currentSessionId}, fetching messages...`);
      fetchMessages(currentSessionId);
    } else {
      console.log("AIAssistantPage: No active session selected. Ready for new input.");
    }
  }, [currentSessionId, fetchMessages]);

  // Sidebar state based on mobile is removed
  // useEffect(() => { ... }, [isMobile]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const n8nWebhookUrl = "https://n8n.srv783065.hstgr.cloud/webhook/0d7564b0-45e8-499f-b3b9-b136386319e5/chat";

  const getAIResponse = useCallback(async (userMessage: string, history: ConversationMessage[], sessionId: string): Promise<string | null> => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "User not logged in." });
        return null;
    }
    const safeHistory = Array.isArray(history) ? history : [];
    const historyForWebhook = safeHistory.slice(-10).map(msg => ({ sender: msg.sender, message: msg.message }));

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          sessionId: sessionId,
          message: userMessage,
          history: historyForWebhook,
          context: messageContext
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Webhook request failed: ${response.status}. ${errorBody}`);
      }
      const responseData = await response.json();
      const aiMessageContent = responseData?.output ?? null;
      if (!aiMessageContent) {
           console.warn("AI response format unexpected:", responseData);
           throw new Error("Received unexpected response format from AI.");
      }
      return aiMessageContent;
    } catch (error) {
      console.error('Error calling n8n webhook:', error);
      toast({ variant: "destructive", title: "AI Communication Error", description: error instanceof Error ? error.message : "Could not reach AI assistant." });
      return null;
    }
  }, [user, n8nWebhookUrl, messageContext, toast]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!newMessage.trim() || !user || isWaitingForAI) return;

    let targetSessionId = currentSessionId;
    let isNewSession = false;

    if (!targetSessionId) {
      setIsWaitingForAI(true);
      const newConv = await startNewConversation();
      if (newConv && newConv.session_id) {
        targetSessionId = newConv.session_id;
        setActiveConversation(targetSessionId);
        isNewSession = true;
        console.log(`Started new conversation: ${targetSessionId}`);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not start a new conversation." });
        setIsWaitingForAI(false);
        return;
      }
    }

    if (!targetSessionId) {
      toast({ variant: "destructive", title: "Error", description: "Session ID is missing." });
      setIsWaitingForAI(false);
      return;
    }

    const userMessageContent = newMessage;
    setNewMessage('');
    if (!isNewSession) setIsWaitingForAI(true);

    const savedUserMessage = await addMessage(userMessageContent, 'user', targetSessionId);
    if (!savedUserMessage) {
      setIsWaitingForAI(false);
      setNewMessage(userMessageContent);
      if (isNewSession && targetSessionId) {
          await deleteConversation(targetSessionId);
          setActiveConversation(null);
          console.error("Failed to save the first message, reverting new conversation.");
      }
      return;
    }

    const currentHistory = isNewSession ? [savedUserMessage] : [...(apiMessages || []), savedUserMessage];
    const aiResponseContent = await getAIResponse(userMessageContent, currentHistory, targetSessionId);

    if (aiResponseContent) {
      await addMessage(aiResponseContent, 'ai', targetSessionId);
    } else {
      toast({ variant: "default", title: "AI Response Pending", description: "Could not get AI response, but your message was saved." });
    }

    setIsWaitingForAI(false);
    textareaRef.current?.focus();

  }, [
    newMessage, user, currentSessionId, isWaitingForAI, addMessage, getAIResponse,
    startNewConversation, setActiveConversation, apiMessages, deleteConversation, toast
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isWaitingForAI) {
        textareaRef.current?.focus();
    }
  }, [currentSessionId, isWaitingForAI]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isWaitingForAI) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Start new conversation (closes dialog)
  const handleStartNewConversation = useCallback(async () => {
    if (isWaitingForAI) return;
    setIsWaitingForAI(true);
    const newConv = await startNewConversation();
    if (newConv && newConv.session_id) {
        setActiveConversation(newConv.session_id);
        setNewMessage('');
        setIsConversationDialogOpen(false); // Close dialog after starting
    } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to start a new conversation." });
    }
    setIsWaitingForAI(false);
  }, [startNewConversation, setActiveConversation, isWaitingForAI, toast]);

  // Delete conversation (closes dialog if current deleted)
  const handleDeleteConversation = useCallback(async (sessionIdToDelete: string) => {
    if (!deleteConversation || !sessionIdToDelete) return;
    console.log(`AIAssistantPage: Deleting conversation session ${sessionIdToDelete}`);
    const { success } = await deleteConversation(sessionIdToDelete);
    if (success) {
        toast({ title: "Conversation Deleted", description: `Session ${sessionIdToDelete.substring(0,8)}... removed.` });
        if (currentSessionId === sessionIdToDelete) {
            setActiveConversation(null);
            setNewMessage('');
            // Close the dialog if the active conversation was deleted
            setIsConversationDialogOpen(false); 
        }
        // Potentially refetch or update list if needed, assuming hook handles it
    } else {
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the conversation." });
    }
  }, [deleteConversation, currentSessionId, setActiveConversation, toast]);

  const handleSaveAsPdf = useCallback(() => {
    toast({ title: "Print Chat", description: "Use your browser's print function (Ctrl+P/Cmd+P) and select 'Save as PDF'." });
    window.print();
  }, [toast]);

  const handleCopyToClipboard = useCallback(() => {
    if (!messages || messages.length === 0) {
        toast({ title: "Nothing to Copy", description: "The chat is empty." });
        return;
    }
    const messageStrings = messages.map(msg => {
        const sender = msg.sender === 'user' ? 'You' : 'AI';
        const timestamp = new Date(msg.created_at).toLocaleString();
        return `${sender} (${timestamp}):
${msg.message}`;
    });
    const chatText = messageStrings.join(`

`);
    navigator.clipboard.writeText(chatText)
      .then(() => toast({ title: "Chat Copied", description: "Conversation copied to clipboard." }))
      .catch(err => {
          console.error("Clipboard copy error:", err);
          toast({ variant: "destructive", title: "Copy Failed", description: `Could not copy to clipboard. See console for details.` });
      });
  }, [messages, toast]);

  const handlePrint = useCallback(() => {
    toast({ title: "Print Chat", description: "Opening print dialog..." });
    window.print();
  }, [toast]);

  return (
    // Main container: centers the chat area
    <div className="flex flex-col h-full items-center bg-white overflow-hidden relative p-4">

      {/* Floating Conversation Button & Dialog */}
      <Dialog open={isConversationDialogOpen} onOpenChange={setIsConversationDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            // Position fixed on the left, vertically centered
            className="fixed left-4 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg h-12 w-12" 
            aria-label="Conversations"
          >
            <MessageSquareText className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]"> 
          <DialogHeader>
            <DialogTitle>Conversations</DialogTitle>
          </DialogHeader>
          <ConversationSidebar
            conversations={conversationList}
            loading={isLoadingList}
            error={conversationListError}
            selectedConversationId={currentSessionId}
            onSelectConversation={(id) => {
                setActiveConversation(id);
                setIsConversationDialogOpen(false); // Close dialog on selection
            }}
            onStartNewConversation={handleStartNewConversation} // Already closes dialog
            onDeleteConversation={handleDeleteConversation} // Handles closing if needed
            className="h-auto max-h-[70vh] overflow-y-auto" 
          />
           <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Chat Area Container: Centered with max-width */} 
      <div className="flex-1 flex flex-col w-full max-w-3xl overflow-hidden h-full">
        <MainChatArea
          messages={messages}
          isLoadingHistory={isLoadingHistory && !!currentSessionId}
          conversationError={messageError}
          currentSessionId={currentSessionId}
          isWaitingForAI={isWaitingForAI}
          user={user}
          messagesEndRef={messagesEndRef}
          textareaRef={textareaRef}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          handleKeyDown={handleKeyDown}
          // Remove props related to static sidebars
          // Pass handler to open context dialog
          onOpenContextDialog={() => setIsContextDialogOpen(true)}
          // Identify this page variant to MainChatArea (using isAssistPage convention)
          isAssistPage={true} 
          showChatSessionInfo={!!currentSessionId} // Show info box when session ID exists
          // Pass conversation management functions directly
          onDeleteConversation={() => currentSessionId && handleDeleteConversation(currentSessionId)}
          onSaveAsPdf={handleSaveAsPdf}
          onCopyToClipboard={handleCopyToClipboard}
          onPrint={handlePrint}
          messageSuggestions={messageSuggestions}
          // onStartNewConversation={handleStartNewConversation} // Not needed in MainChatArea for this layout
        />
      </div>

      {/* Context Panel Dialog */}
      <Dialog open={isContextDialogOpen} onOpenChange={setIsContextDialogOpen}>
        {/* Trigger is now inside MainChatArea's input section */}
        <DialogContent className="sm:max-w-md"> 
           <DialogHeader>
             <DialogTitle>Context</DialogTitle>
           </DialogHeader>
          <ContextPanel
            onContextChange={setMessageContext}
            className="h-auto max-h-[70vh] overflow-y-auto"
            // Pass any props needed by ContextPanel internally, e.g., initial values
            // Currently selected context is managed by `messageContext` state here.
          />
          <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AIAssistantPage;
