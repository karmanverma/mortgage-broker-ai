import React, { useState, useEffect, useRef, useCallback } from 'react'; // Core React imports
import { useConversations, Conversation, ConversationInfo } from '@/hooks/useConversations'; // Import new types
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

// Import extracted components
import ConversationSidebar from '@/components/ai-assistant/ConversationSidebar';
import MainChatArea from '@/components/ai-assistant/MainChatArea';
import ContextPanel from '@/components/ai-assistant/ContextPanel';

const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const {
    messages,
    conversationList,
    setActiveConversation,
    currentSessionId,
    isLoading: isLoadingHistory,
    isLoadingList,
    error: conversationError,
    addMessage,
    startNewConversation,
    fetchMessages,
    deleteConversation,
  } = useConversations();

  const [newMessage, setNewMessage] = useState("");
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(!isMobile);
  const [conversationSidebarOpen, setConversationSidebarOpen] = useState(false);

  useEffect(() => {
    setContextPanelOpen(!isMobile);
  }, [isMobile]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const n8nWebhookUrl = "https://n8n.srv783065.hstgr.cloud/webhook/0d7564b0-45e8-499f-b3b9-b136386319e5/chat";

  const getAIResponse = useCallback(async (userMessage: string, history: Conversation[]): Promise<string | null> => {
    if (!user || !currentSessionId) {
        toast({ variant: "destructive", title: "Error", description: "User or Session ID missing." });
        return null;
    }
    const historyForWebhook = history.slice(-10).map(msg => ({ sender: msg.sender, message: msg.message }));
    try {
      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, sessionId: currentSessionId, message: userMessage, history: historyForWebhook }),
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
  }, [user, currentSessionId, n8nWebhookUrl]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!newMessage.trim() || !user || !currentSessionId || isWaitingForAI) return;

    const userMessageContent = newMessage;
    setNewMessage('');
    setIsWaitingForAI(true);

    const savedUserMessage = await addMessage(userMessageContent, 'user');
    if (!savedUserMessage) {
        setIsWaitingForAI(false);
        setNewMessage(userMessageContent);
        return;
    }

    const currentHistory = [...messages, savedUserMessage];
    const aiResponseContent = await getAIResponse(userMessageContent, currentHistory);
    if (aiResponseContent) {
        await addMessage(aiResponseContent, 'ai');
    }
    setIsWaitingForAI(false);
    textareaRef.current?.focus();
  }, [newMessage, user, currentSessionId, isWaitingForAI, addMessage, getAIResponse, messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleNewConversationClick = () => {
    startNewConversation();
    setConversationSidebarOpen(false);
  };

  const handleDeleteConversation = useCallback(async () => {
    if (!currentSessionId || !deleteConversation) {
        toast({ variant: "destructive", title: "Error", description: "Cannot delete chat." });
        return;
    }
    if (window.confirm("Are you sure you want to delete this entire chat history?")) {
        await deleteConversation(currentSessionId);
    }
  }, [currentSessionId, deleteConversation]);

  const handleSaveAsPdf = useCallback(() => {
    toast({ title: "Print Chat", description: "Use your browser's print function (Ctrl+P/Cmd+P) and select 'Save as PDF'." });
    window.print();
  }, []);

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

  const handlePrint = useCallback(() => {
    toast({ title: "Print Chat", description: "Opening print dialog..." });
    window.print();
  }, []);

  return (
    <div className="flex h-full bg-white overflow-hidden">
      <div className={cn(`fixed inset-y-0 left-0 z-40 w-72 border-r bg-white transform transition-transform md:hidden`, conversationSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
         <ConversationSidebar
            conversationList={conversationList}
            isLoadingList={isLoadingList}
            activeSessionId={currentSessionId}
            setActiveConversation={setActiveConversation}
            onNewConversation={handleNewConversationClick}
            setConversationSidebarOpen={setConversationSidebarOpen}
         />
      </div>
      {conversationSidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setConversationSidebarOpen(false)} />}
      <div className="w-72 border-r border-gray-200 hidden md:flex flex-col flex-shrink-0">
        <ConversationSidebar
            conversationList={conversationList}
            isLoadingList={isLoadingList}
            activeSessionId={currentSessionId}
            setActiveConversation={setActiveConversation}
            onNewConversation={handleNewConversationClick}
            setConversationSidebarOpen={setConversationSidebarOpen}
         />
      </div>

      <div className="flex-1 flex min-w-0 overflow-hidden">
        <MainChatArea
          messages={messages}
          isLoadingHistory={isLoadingHistory}
          conversationError={conversationError}
          currentSessionId={currentSessionId}
          isWaitingForAI={isWaitingForAI}
          user={user}
          messagesEndRef={messagesEndRef}
          textareaRef={textareaRef}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          handleKeyDown={handleKeyDown}
          setConversationSidebarOpen={setConversationSidebarOpen}
          fetchMessages={fetchMessages}
          setContextPanelOpen={setContextPanelOpen}
          contextPanelOpen={contextPanelOpen}
          onDeleteConversation={handleDeleteConversation}
          onSaveAsPdf={handleSaveAsPdf}
          onCopyToClipboard={handleCopyToClipboard}
          onPrint={handlePrint}
        />
        <ContextPanel
          contextPanelOpen={contextPanelOpen}
          setContextPanelOpen={setContextPanelOpen}
        />
      </div>
    </div>
  );
};

export default AIAssistantPage;
