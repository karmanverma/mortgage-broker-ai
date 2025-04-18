
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConversations } from '@/hooks/useConversations'; // Updated hook
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from "@/components/ui/use-toast";
import { ConversationSidebar } from '@/components/ai-assistant/ConversationSidebar'; // Refactored sidebar
import MainChatArea from '@/components/ai-assistant/MainChatArea';
import ContextPanel from '@/components/ai-assistant/ContextPanel';
import { cn } from '@/lib/utils';
import { Conversation as ConversationMessage } from '@/hooks/useConversations.types'; // Renaming to avoid conflict if needed

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
  const isMobile = useIsMobile();

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
  const [contextPanelOpen, setContextPanelOpen] = useState(!isMobile);
  const [conversationSidebarOpen, setConversationSidebarOpen] = useState(!isMobile);
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
      fetchMessages(currentSessionId); // Fetch messages for the newly selected session
    } else {
      // Optionally clear messages or handle the "no session selected" state
      console.log("AIAssistantPage: No active session selected.");
    }
  }, [currentSessionId, fetchMessages]);

  // Adjust sidebars based on mobile state
  useEffect(() => {
    if (isMobile) {
      setConversationSidebarOpen(false);
      setContextPanelOpen(false);
    } else {
      // Default to open on desktop
      setConversationSidebarOpen(true);
      setContextPanelOpen(true);
    }
  }, [isMobile]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const n8nWebhookUrl = "https://n8n.srv783065.hstgr.cloud/webhook/0d7564b0-45e8-499f-b3b9-b136386319e5/chat";

  const getAIResponse = useCallback(async (userMessage: string, history: ConversationMessage[], sessionId: string): Promise<string | null> => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "User not logged in." });
        return null;
    }
    // Ensure history is an array before slicing
    const safeHistory = Array.isArray(history) ? history : [];
    const historyForWebhook = safeHistory.slice(-10).map(msg => ({ sender: msg.sender, message: msg.message }));

    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          sessionId: sessionId, // Use the provided sessionId
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
  }, [user, n8nWebhookUrl, messageContext]); // Removed currentSessionId dependency

  const handleSendMessage = useCallback(async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!newMessage.trim() || !user || isWaitingForAI) return;

    let targetSessionId = currentSessionId;
    let isNewSession = false;

    // 1. Start a new conversation if none is active
    if (!targetSessionId) {
      setIsWaitingForAI(true); // Show loading early
      const newConv = await startNewConversation();
      if (newConv && newConv.session_id) {
        targetSessionId = newConv.session_id;
        setActiveConversation(targetSessionId); // Set the new conversation as active
        isNewSession = true;
        console.log(`Started new conversation: ${targetSessionId}`);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not start a new conversation." });
        setIsWaitingForAI(false);
        return;
      }
    }

    if (!targetSessionId) { // Double-check if session ID is available
      toast({ variant: "destructive", title: "Error", description: "Session ID is missing." });
      setIsWaitingForAI(false);
      return;
    }

    const userMessageContent = newMessage;
    setNewMessage('');
    if (!isNewSession) setIsWaitingForAI(true); // Set waiting if not already set for new session

    // 2. Add user message to the conversation (potentially new)
    const savedUserMessage = await addMessage(userMessageContent, 'user', targetSessionId);
    if (!savedUserMessage) {
      setIsWaitingForAI(false);
      setNewMessage(userMessageContent); // Restore input if save failed
      if (isNewSession && targetSessionId) {
          // Attempt to delete the just-created session if the first message failed
          await deleteConversation(targetSessionId);
          setActiveConversation(null);
      }
      return;
    }

    // Fetch history *after* adding the user message, especially for new sessions
    // Use apiMessages directly which should update via the hook
    const currentHistory = isNewSession ? [savedUserMessage] : [...(apiMessages || []), savedUserMessage];

    // 3. Get AI response
    const aiResponseContent = await getAIResponse(userMessageContent, currentHistory, targetSessionId);

    // 4. Add AI response
    if (aiResponseContent) {
      await addMessage(aiResponseContent, 'ai', targetSessionId);
    } else {
      // Handle cases where AI response failed but user message was saved
      toast({ variant: "default", title: "AI Response Pending", description: "Could not get AI response, but your message was saved." });
    }

    setIsWaitingForAI(false);
    textareaRef.current?.focus();

  }, [
    newMessage,
    user,
    currentSessionId,
    isWaitingForAI,
    addMessage,
    getAIResponse,
    startNewConversation,
    setActiveConversation,
    apiMessages, // Depend on apiMessages to get updated history
    deleteConversation // Added dependency
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Trigger scroll when mapped messages change

  // Focus input on initial load
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Start new conversation (used by sidebar and placeholder)
  const handleStartNewConversation = useCallback(async () => {
    setIsWaitingForAI(true); // Indicate loading while creating
    const newConv = await startNewConversation();
    if (newConv && newConv.session_id) {
        setActiveConversation(newConv.session_id);
        setNewMessage(''); // Clear any pending input
        if (isMobile) {
            setConversationSidebarOpen(false);
        }
    } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to start a new conversation." });
    }
    setIsWaitingForAI(false);
  }, [startNewConversation, setActiveConversation, isMobile, setConversationSidebarOpen]);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (sessionIdToDelete: string) => {
    if (!deleteConversation) return;
    console.log(`AIAssistantPage: Deleting conversation session ${sessionIdToDelete}`);
    const { success } = await deleteConversation(sessionIdToDelete);
    if (success && currentSessionId === sessionIdToDelete) {
        setActiveConversation(null); // Clear selection if active chat was deleted
        setNewMessage(''); // Clear input
    }
    // No need to manually refetch list, hook should handle it
  }, [deleteConversation, currentSessionId, setActiveConversation]);

  // Save as PDF (using browser print)
  const handleSaveAsPdf = useCallback(() => {
    toast({ title: "Print Chat", description: "Use your browser's print function (Ctrl+P/Cmd+P) and select 'Save as PDF'." });
    window.print();
  }, []);

  // Copy to clipboard
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
  }, [messages]);

  // Print
  const handlePrint = useCallback(() => {
    toast({ title: "Print Chat", description: "Opening print dialog..." });
    window.print();
  }, []);


  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative">
          {/* Mobile conversation overlay */} 
          {conversationSidebarOpen && isMobile && (
            <div 
                className="fixed inset-0 bg-black/50 z-30 md:hidden" 
                onClick={() => setConversationSidebarOpen(false)} 
            />
          )}
          
          {/* Conversation Sidebar Container */}
          {/* Use conditional rendering or dynamic classes for sidebar */}
          <div className={cn(
              "fixed inset-y-0 left-0 z-40 w-64 bg-gray-50 border-r transform transition-transform duration-300 md:static md:z-auto md:translate-x-0", 
              conversationSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
              <ConversationSidebar
                conversations={conversationList}
                loading={isLoadingList}
                error={conversationListError}
                selectedConversationId={currentSessionId}
                onSelectConversation={(id) => {
                    setActiveConversation(id);
                    if (isMobile) setConversationSidebarOpen(false); // Close on selection in mobile
                }}
                onStartNewConversation={handleStartNewConversation}
                onDeleteConversation={handleDeleteConversation}
                className="h-full" 
              />
          </div>

          {/* Main Content Area */} 
          <div className="flex-1 flex overflow-hidden">
                <MainChatArea
                    messages={messages} 
                    isLoadingHistory={isLoadingHistory && !!currentSessionId} // Only show loading if a session is selected
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
                    conversationSidebarOpen={conversationSidebarOpen} 
                    setConversationSidebarOpen={setConversationSidebarOpen} 
                    // fetchMessages removed - handled by useEffect
                    contextPanelOpen={contextPanelOpen} 
                    setContextPanelOpen={setContextPanelOpen}
                    onDeleteConversation={() => currentSessionId && handleDeleteConversation(currentSessionId)}
                    onSaveAsPdf={handleSaveAsPdf}
                    onCopyToClipboard={handleCopyToClipboard}
                    onPrint={handlePrint}
                    messageSuggestions={messageSuggestions}
                    onStartNewConversation={handleStartNewConversation} // Pass the start new conversation handler
                />
                
                {/* Context Panel Container - Adjusted for better overlay/static behavior */}
                <div className={cn(
                    "fixed inset-y-0 right-0 z-30 w-80 border-l bg-white transform transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0", 
                    contextPanelOpen ? "translate-x-0" : "translate-x-full"
                )}>
                    <ContextPanel
                    contextPanelOpen={contextPanelOpen} 
                    setContextPanelOpen={setContextPanelOpen} 
                    onContextChange={setMessageContext}
                    />
                </div>
            </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
