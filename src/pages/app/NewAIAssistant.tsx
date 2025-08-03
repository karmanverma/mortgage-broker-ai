import React, { useState, useEffect, useCallback } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/components/ui/use-toast";
import { ConversationSidebar } from '@/components/ai-assistant/ConversationSidebar';
import ContextPanel from '@/components/ai-assistant/ContextPanel';
import AnimatedAIChat from '@/components/mvp-blocks/animated-ai-chat';
import WorkingChatbot from '@/components/mvp-blocks/working-chatbot';
import EnhancedChatInterface from '@/components/mvp-blocks/enhanced-chat-interface';
import { cn } from '@/lib/utils';
import { Conversation as ConversationMessage } from '@/hooks/useConversations.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { MessageSquareText, Settings2, Brain, Menu, X } from 'lucide-react';
import { useLenderDocuments } from '@/hooks/useLenderDocuments';
import { useClients } from '@/hooks/useClients';
import { useImprovedLenders } from '@/hooks/useImprovedLenders';

import { Badge } from "@/components/ui/badge";

interface Message {
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
  id: string;
  session_id: string;
  user_id: string;
}

const NewAIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { documents: allUserDocuments } = useLenderDocuments();
  const { clients: allUserClients } = useClients();
  const { lenders: allUserLenders } = useImprovedLenders();

  const {
    conversations: conversationList,
    loading: isLoadingList,
    error: conversationListError,
    startNewConversation,
    deleteConversation,
    messages: apiMessages,
    setActiveConversation,
    currentSessionId,
    addMessage,
    fetchMessages,
  } = useConversations();

  // Session from URL param
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

  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const [isConversationDialogOpen, setIsConversationDialogOpen] = useState(false);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Context Panel State
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]);

  // Fetch messages when the active conversation changes
  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    }
  }, [currentSessionId, fetchMessages]);

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
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "User not logged in." });
        return null;
    }
    const safeHistory = Array.isArray(history) ? history : [];
    const historyForWebhook = safeHistory.slice(-10).map(msg => ({ sender: msg.sender, message: msg.message }));

    const currentContext = {
        selectedClientId: selectedClientId || undefined,
        selectedLenderIds: selectedLenderIds,
        selectedDocumentIds: getSelectedDocumentIds()
    };

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
          context: currentContext
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
  }, [user, n8nWebhookUrl, selectedClientId, selectedLenderIds, getSelectedDocumentIds, toast]);

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !user || isWaitingForAI) return;

    let targetSessionId = currentSessionId;
    let isNewSession = false;

    if (!targetSessionId) {
      setIsWaitingForAI(true);
      const newConv = await startNewConversation();
      if (newConv && newConv.session_id) {
        targetSessionId = newConv.session_id;
        setActiveConversation(targetSessionId);
        isNewSession = true;
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

    if (!isNewSession) setIsWaitingForAI(true);

    const savedUserMessage = await addMessage(messageContent, 'user', targetSessionId);
    if (!savedUserMessage) {
      setIsWaitingForAI(false);
      if (isNewSession && targetSessionId) {
          await deleteConversation(targetSessionId);
          setActiveConversation(null);
          console.error("Failed to save the first message, reverting new conversation.");
      }
      return;
    }

    const currentHistory = isNewSession ? [savedUserMessage] : [...(apiMessages || []), savedUserMessage];
    const aiResponseContent = await getAIResponse(messageContent, currentHistory, targetSessionId);

    if (aiResponseContent) {
      await addMessage(aiResponseContent, 'ai', targetSessionId);
    }

    setIsWaitingForAI(false);
  }, [
    user, currentSessionId, isWaitingForAI, addMessage, getAIResponse,
    startNewConversation, setActiveConversation, apiMessages, deleteConversation, toast
  ]);

  // Start new conversation
  const handleStartNewConversation = useCallback(async () => {
    if (isWaitingForAI) return;
    setIsWaitingForAI(true);
    const newConv = await startNewConversation();
    if (newConv && newConv.session_id) {
        setActiveConversation(newConv.session_id);
        setIsConversationDialogOpen(false);
        setIsSidebarOpen(false);
    } else {
        toast({ variant: "destructive", title: "Error", description: "Failed to start a new conversation." });
    }
    setIsWaitingForAI(false);
  }, [startNewConversation, setActiveConversation, isWaitingForAI, toast]);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (sessionIdToDelete: string) => {
    if (!deleteConversation || !sessionIdToDelete) return;
    const { success } = await deleteConversation(sessionIdToDelete);
    if (success) {
        toast({ title: "Conversation Deleted", description: `Session ${sessionIdToDelete.substring(0,8)}... removed.` });
        if (currentSessionId === sessionIdToDelete) {
            setActiveConversation(null);
            setIsConversationDialogOpen(false);
            setIsSidebarOpen(false);
        }
    } else {
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the conversation." });
    }
  }, [deleteConversation, currentSessionId, setActiveConversation, toast]);

  // Get selected client name for display
  const selectedClient = allUserClients?.find(client => client.id === selectedClientId);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 transform bg-card border-r transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Conversations</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Context Info */}
          {(selectedClientId || selectedLenderIds.length > 0) && (
            <div className="p-4 border-b bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Context</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsContextDialogOpen(true)}
                  >
                    <Settings2 className="h-3 w-3" />
                  </Button>
                </div>
                {selectedClient && (
                  <Badge variant="secondary" className="text-xs">
                    Client: {selectedClient.firstName} {selectedClient.lastName}
                  </Badge>
                )}
                {selectedLenderIds.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {selectedLenderIds.length} Lender{selectedLenderIds.length > 1 ? 's' : ''} Selected
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-hidden">
            <ConversationSidebar
              conversations={conversationList}
              loading={isLoadingList}
              error={conversationListError}
              selectedConversationId={currentSessionId}
              onSelectConversation={(id) => {
                  setActiveConversation(id);
                  setIsSidebarOpen(false);
              }}
              onStartNewConversation={handleStartNewConversation}
              onDeleteConversation={handleDeleteConversation}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b bg-card/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">AI Assistant</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsContextDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Context
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConversationDialogOpen(true)}
              className="flex items-center gap-2 lg:hidden"
            >
              <MessageSquareText className="h-4 w-4" />
              Chats
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden p-4">
          <EnhancedChatInterface
            messages={messages.map(msg => ({
              id: msg.id,
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.message,
              timestamp: new Date(msg.created_at)
            }))}
            onSendMessage={handleSendMessage}
            isLoading={isWaitingForAI}
            placeholder={!currentSessionId || messages.length === 0 
              ? "Ask your mortgage broker AI assistant anything..." 
              : "Continue your conversation..."
            }
            title="How can I help with your mortgage needs today?"
            subtitle="Ask about clients, lenders, rates, or get personalized recommendations"
            selectedClientId={selectedClientId}
            selectedLenderIds={selectedLenderIds}
            clients={allUserClients || []}
            lenders={allUserLenders || []}
            onSelectedClientChange={setSelectedClientId}
            onSelectedLendersChange={setSelectedLenderIds}
            showContextSelector={true}
            mode={!currentSessionId || messages.length === 0 ? 'new' : 'existing'}
          />
        </div>
      </div>

      {/* Conversation Dialog */}
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
             <DialogTitle>Context Selection</DialogTitle>
             <DialogDescription id="context-dialog-description">
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

export default NewAIAssistantPage;