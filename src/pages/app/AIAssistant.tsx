import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/components/ui/use-toast";
import { ConversationSidebar } from '@/components/ai-assistant/ConversationSidebar';
import MainChatArea from '@/components/ai-assistant/MainChatArea';
import ContextPanel from '@/components/ai-assistant/ContextPanel'; // Keep for dialog content
import { ChatDebugPanel } from '@/components/debug/ChatDebugPanel'; // Add debug panel
import { cn } from '@/lib/utils';
import { Conversation as ConversationMessage } from '@/hooks/useConversations.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader, // Import DialogHeader
  DialogTitle,  // Import DialogTitle
  DialogDescription, // Import DialogDescription
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { MessageSquareText, Settings2, Library, Brain } from 'lucide-react'; // Icons for buttons
// Added hook to get documents for context reconstruction
import { useLenderDocuments } from '@/hooks/useLenderDocuments';
// Import hook to fetch clients for tooltip
import { useClients } from '@/hooks/useClients';
import { useSearchParams } from 'react-router-dom';

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
  const { documents: allUserDocuments } = useLenderDocuments(); // Get documents for context
  const { clients: allUserClients } = useClients(); // Get clients for tooltip

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

  // --- Session from URL param ---
  const [searchParams] = typeof window !== 'undefined' && window.location ? [new URLSearchParams(window.location.search)] : [null];
  const sessionFromUrl = searchParams ? searchParams.get('session') : null;

  useEffect(() => {
    if (sessionFromUrl && sessionFromUrl !== currentSessionId) {
      setActiveConversation(sessionFromUrl);
    }
  }, [sessionFromUrl, setActiveConversation, currentSessionId]);

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
  const [lastChatError, setLastChatError] = useState<Error | null>(null); // Add error tracking

  // --- State for Context Panel Selections ---
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null); // Start empty
  const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]); // Start empty
  // --- End Context Panel State ---

  // --- Add Logging ---
  useEffect(() => {
    console.log("AIAssistantPage: allUserClients updated: ", allUserClients);
  }, [allUserClients]);
  // --- End Logging ---

  // Fetch messages when the active conversation changes
  useEffect(() => {
    if (currentSessionId) {
      // console.log(`AIAssistantPage: Active session changed to ${currentSessionId}, fetching messages...`);
      fetchMessages(currentSessionId);
    } else {
      // console.log("AIAssistantPage: No active session selected. Ready for new input.");
    }
  }, [currentSessionId, fetchMessages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const n8nWebhookUrl = "https://n8n.srv783065.hstgr.cloud/webhook/0d7564b0-45e8-499f-b3b9-b136386319e5/chat";

  // Helper to derive document IDs from selected lenders
  const getSelectedDocumentIds = useCallback(() => {
    if (!allUserDocuments || selectedLenderIds.length === 0) return [];
    const documentIdsByLender = allUserDocuments.reduce((acc, doc) => {
        if (!acc[doc.lender_id]) {
            acc[doc.lender_id] = [];
        }
        acc[doc.lender_id].push(doc.id);
        return acc;
    }, {} as Record<string, string[]>);
    return selectedLenderIds.flatMap(lenderId => documentIdsByLender[lenderId] || []);
  }, [allUserDocuments, selectedLenderIds]);


  const getAIResponse = useCallback(async (userMessage: string, history: ConversationMessage[], sessionId: string): Promise<string | null> => {
    console.log('🟡 AIAssistant: getAIResponse called with:', {
      userMessage: userMessage.substring(0, 50) + '...',
      historyLength: history.length,
      sessionId: sessionId,
      hasUser: !!user
    });

    if (!user) {
        console.log('❌ AIAssistant: No user found in getAIResponse');
        const authError = new Error("User not logged in.");
        setLastChatError(authError);
        toast({ variant: "destructive", title: "Error", description: authError.message });
        return null;
    }
    
    // Clear previous error
    setLastChatError(null);
    
    const safeHistory = Array.isArray(history) ? history : [];
    const historyForWebhook = safeHistory.slice(-10).map(msg => ({ 
      sender: msg.sender as 'user' | 'ai', 
      message: msg.message 
    }));

    // --- Derive context object directly from state ---
    const currentContext = {
        selectedClientId: selectedClientId || undefined,
        selectedLenderIds: selectedLenderIds,
        selectedDocumentIds: getSelectedDocumentIds()
    };
    // --- End context derivation ---

    try {
      console.log('🚀 AIAssistant: Sending message to n8n webhook:', {
        url: n8nWebhookUrl,
        userId: user.id,
        sessionId: sessionId,
        message: userMessage.substring(0, 100) + '...',
        historyLength: historyForWebhook.length,
        context: currentContext
      });

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          sessionId: sessionId,
          message: userMessage,
          history: historyForWebhook,
          context: currentContext
        }),
      });

      console.log('📡 AIAssistant: n8n webhook response status:', response.status);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('❌ AIAssistant: n8n webhook error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        });
        const webhookError = new Error(`Webhook request failed: ${response.status} ${response.statusText}. ${errorBody}`);
        setLastChatError(webhookError);
        throw webhookError;
      }

      const responseData = await response.json();
      console.log('✅ AIAssistant: n8n webhook success response:', responseData);

      const aiMessageContent = responseData?.output ?? null;
      if (!aiMessageContent) {
           console.warn("⚠️ AIAssistant: AI response format unexpected:", responseData);
           const formatError = new Error("Received unexpected response format from AI.");
           setLastChatError(formatError);
           throw formatError;
      }

      return aiMessageContent;
    } catch (error) {
      console.error('💥 AIAssistant: Error calling n8n webhook:', error);
      
      const chatError = error instanceof Error ? error : new Error("Unknown error occurred");
      setLastChatError(chatError);
      
      let errorMessage = "Could not reach AI assistant.";
      if (chatError.message.includes('fetch')) {
        errorMessage = "Network error - please check your connection.";
      } else if (chatError.message.includes('timeout')) {
        errorMessage = "Request timed out - please try again.";
      } else {
        errorMessage = chatError.message;
      }
      
      toast({ 
        variant: "destructive", 
        title: "AI Communication Error", 
        description: errorMessage 
      });
      return null;
    }
  }, [user, n8nWebhookUrl, selectedClientId, selectedLenderIds, getSelectedDocumentIds, toast]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent | React.KeyboardEvent) => {
    console.log('🔵 AIAssistant: handleSendMessage called');
    
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!newMessage.trim() || !user || isWaitingForAI) {
      console.log('🔵 AIAssistant: Early return - newMessage:', !!newMessage.trim(), 'user:', !!user, 'isWaitingForAI:', isWaitingForAI);
      return;
    }

    console.log('🔵 AIAssistant: Processing message:', newMessage.substring(0, 50) + '...');

    let targetSessionId = currentSessionId;
    let isNewSession = false;

    if (!targetSessionId) {
      console.log('🔵 AIAssistant: No session, starting new conversation...');
      setIsWaitingForAI(true);
      const newConv = await startNewConversation();
      if (newConv && newConv.session_id) {
        targetSessionId = newConv.session_id;
        setActiveConversation(targetSessionId);
        isNewSession = true;
        console.log(`🔵 AIAssistant: Started new conversation: ${targetSessionId}`);
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

    console.log('🔵 AIAssistant: Using session:', targetSessionId);

    const userMessageContent = newMessage;
    setNewMessage('');
    if (!isNewSession) setIsWaitingForAI(true);

    console.log('🔵 AIAssistant: Saving user message to database...');
    const savedUserMessage = await addMessage(userMessageContent, 'user', targetSessionId);
    if (!savedUserMessage) {
      console.log('❌ AIAssistant: Failed to save user message');
      setIsWaitingForAI(false);
      setNewMessage(userMessageContent);
      if (isNewSession && targetSessionId) {
          await deleteConversation(targetSessionId);
          setActiveConversation(null);
          console.error("Failed to save the first message, reverting new conversation.");
      }
      return;
    }

    console.log('✅ AIAssistant: User message saved, calling getAIResponse...');
    const currentHistory = isNewSession ? [savedUserMessage] : [...(apiMessages || []), savedUserMessage];
    
    try {
      const aiResponseContent = await getAIResponse(userMessageContent, currentHistory, targetSessionId);
      console.log('🔵 AIAssistant: getAIResponse returned:', !!aiResponseContent);

      if (aiResponseContent) {
        console.log('🔵 AIAssistant: Saving AI response to database...');
        await addMessage(aiResponseContent, 'ai', targetSessionId);
        console.log('✅ AIAssistant: AI response saved successfully');
      } else {
        console.log('⚠️ AIAssistant: No AI response received');
      }
    } catch (error) {
      console.error('💥 AIAssistant: Error in getAIResponse:', error);
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
    // console.log(`AIAssistantPage: Deleting conversation session ${sessionIdToDelete}`);
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
    <div className="flex flex-col min-h-screen items-center bg-background overflow-auto relative p-4">
      {/* Debug Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full max-w-3xl mx-auto mb-4">
          <ChatDebugPanel
            sessionId={currentSessionId}
            selectedClientId={selectedClientId}
            selectedLenderIds={selectedLenderIds}
            lastError={lastChatError}
            isLoading={isWaitingForAI}
          />
        </div>
      )}

      {/* Centered/empty state */}
      {messages.length === 0 && !isLoadingHistory && !isWaitingForAI && (
        <div className="flex flex-1 flex-col items-center justify-center w-full max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="flex flex-row items-center justify-center gap-6 w-full">
              {/* Chat Input - 98% width */}
              <div className="flex-1 flex flex-col items-center w-[98%] mx-auto">
                <MainChatArea
                  messages={[]}
                  isLoadingHistory={false}
                  conversationError={null}
                  currentSessionId={currentSessionId}
                  isWaitingForAI={false}
                  user={user}
                  messagesEndRef={messagesEndRef}
                  textareaRef={textareaRef}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  handleSendMessage={handleSendMessage}
                  handleKeyDown={handleKeyDown}
                  onOpenContextDialog={() => setIsContextDialogOpen(true)}
                  isAssistPage={true}
                  showChatSessionInfo={false}
                  onDeleteConversation={() => {}}
                  onSaveAsPdf={() => {}}
                  onCopyToClipboard={() => {}}
                  onPrint={() => {}}
                  selectedClientId={selectedClientId}
                  selectedLenderIds={selectedLenderIds}
                  clients={allUserClients}
                  inputContainerClassName="w-[98%] max-w-[780px] mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area Container (normal mode) */}
      {(messages.length > 0 || isLoadingHistory || isWaitingForAI) && (
        <div className="flex-1 flex flex-col w-[98%] max-w-[780px] mx-auto overflow-y-auto h-[80vh] min-h-[400px]">
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
            onOpenContextDialog={() => setIsContextDialogOpen(true)}
            isAssistPage={true}
            showChatSessionInfo={!!currentSessionId}
            onDeleteConversation={() => currentSessionId && handleDeleteConversation(currentSessionId)}
            onSaveAsPdf={handleSaveAsPdf}
            onCopyToClipboard={handleCopyToClipboard}
            onPrint={handlePrint}
            selectedClientId={selectedClientId}
            selectedLenderIds={selectedLenderIds}
            clients={allUserClients}
            inputContainerClassName="w-[98%] max-w-[780px] mx-auto"
          />
        </div>
      )}

      {/* Conversation Dialog - not triggered by DialogTrigger anymore */}
      <Dialog open={isConversationDialogOpen} onOpenChange={setIsConversationDialogOpen}>
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
                setIsConversationDialogOpen(false);
            }}
            onStartNewConversation={handleStartNewConversation}
            onDeleteConversation={handleDeleteConversation}
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

      {/* Context Panel Dialog */}
      <Dialog open={isContextDialogOpen} onOpenChange={setIsContextDialogOpen}>
        <DialogContent 
          className="sm:max-w-md p-0" 
          aria-describedby="context-dialog-description"
        >
           <DialogHeader className="p-4 pb-2 border-b"> 
             <DialogTitle>Context</DialogTitle>
             <DialogDescription id="context-dialog-description" className="sr-only">
               Select a client and lenders to provide context for the AI assistant.
             </DialogDescription>
           </DialogHeader>

          <ContextPanel
            selectedClientId={selectedClientId}
            selectedLenderIds={selectedLenderIds}
            onSelectedClientChange={setSelectedClientId}
            onSelectedLendersChange={setSelectedLenderIds}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIAssistantPage;
