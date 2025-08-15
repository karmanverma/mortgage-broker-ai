import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useImprovedConversations } from '@/hooks/useImprovedConversations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "@/components/ui/use-toast";
import { useLenderDocuments } from '@/hooks/useLenderDocuments';
import { useImprovedClients } from '@/hooks/useImprovedClients';
import { useImprovedLenders } from '@/hooks/useImprovedLenders';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Settings2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Components
import ChatWelcomeScreenClean from '@/components/mvp-blocks/chat-welcome-screen-clean';
import WorkingChatbot from '@/components/mvp-blocks/working-chatbot';
import ContextPanel from '@/components/ai-assistant/ContextPanel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const NewAIAssistantV2: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get session from URL
  const sessionFromUrl = searchParams.get('session');
  const mode = searchParams.get('mode') || 'new'; // 'new', 'chat', 'library'

  const { documents: allUserDocuments } = useLenderDocuments();
  const { clients: allUserClients } = useImprovedClients();
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
  } = useImprovedConversations();

  // Context Panel State
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  
  // Store initial message to pass to WorkingChatbot
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  // Set active conversation from URL
  useEffect(() => {
    if (sessionFromUrl && sessionFromUrl !== currentSessionId) {
      setActiveConversation(sessionFromUrl);
    }
  }, [sessionFromUrl, setActiveConversation, currentSessionId]);

  // Fetch messages when the active conversation changes
  useEffect(() => {
    if (currentSessionId) {
      fetchMessages(currentSessionId);
    }
  }, [currentSessionId, fetchMessages]);

  // Clear initial message when switching modes or sessions
  useEffect(() => {
    if (mode !== 'chat' || !currentSessionId) {
      setInitialMessage(null);
    }
  }, [mode, currentSessionId]);

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

  // Handle sending a message from welcome screen
  const handleWelcomeMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !user) return;

    try {
      console.log('🔵 NewAIAssistantV2: handleWelcomeMessage called with:', messageContent.substring(0, 50) + '...');
      
      // Start a new conversation
      const newConv = await startNewConversation();
      if (newConv && newConv.session_id) {
        console.log('🔵 NewAIAssistantV2: New conversation created:', newConv.session_id);
        
        // Set the active conversation
        setActiveConversation(newConv.session_id);
        
        // Store the initial message
        setInitialMessage(messageContent);
        
        // Navigate to chat mode
        setSearchParams({ mode: 'chat', session: newConv.session_id });
        
        console.log('✅ NewAIAssistantV2: Ready for chat mode');
        
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not start a new conversation." });
      }
    } catch (error) {
      console.error('❌ NewAIAssistantV2: Error starting conversation:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to start conversation." });
    }
  }, [user, startNewConversation, setSearchParams, setActiveConversation, toast]);

  // Handle going back to welcome screen
  const handleBackToWelcome = useCallback(() => {
    setSearchParams({ mode: 'new' });
    setActiveConversation(null);
    setInitialMessage(null); // Clear initial message
  }, [setSearchParams, setActiveConversation]);

  // Handle going to library
  const handleGoToLibrary = useCallback(() => {
    setSearchParams({ mode: 'library' });
  }, [setSearchParams]);

  // Convert API messages to the format expected by WorkingChatbot
  const chatMessages: Message[] = (apiMessages || []).map((msg) => ({
    id: String(msg.id),
    role: msg.sender as 'user' | 'assistant',
    content: msg.message || '',
  }));

  // Get selected client name for display
  const selectedClient = allUserClients?.find(client => client.id === selectedClientId);

  // Render based on mode
  const renderContent = () => {
    switch (mode) {
      case 'new':
        return (
          <div className="h-full">
            <ChatWelcomeScreenClean
              onSendMessage={handleWelcomeMessage}
              placeholder="Ask about clients, lenders, rates, or get personalized recommendations..."
              title="How can I help with your mortgage needs today?"
              subtitle="Ask about clients, lenders, rates, or get personalized recommendations"
              selectedClientId={selectedClientId}
              selectedLenderIds={selectedLenderIds}
              clients={allUserClients || []}
              lenders={allUserLenders || []}
              onSelectedClientChange={setSelectedClientId}
              onSelectedLendersChange={setSelectedLenderIds}
              showContextSelector={true}
              onContextToggle={() => setIsContextDialogOpen(true)}
            />
          </div>
        );

      case 'chat':
        if (!currentSessionId) {
          return (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">No active conversation</p>
                <Button onClick={handleBackToWelcome}>
                  Start New Chat
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="h-full relative">
            <WorkingChatbot
              sessionId={currentSessionId}
              title="Mortgage"
              subtitle=" Assistant"
              selectedClientId={selectedClientId}
              selectedLenderIds={selectedLenderIds}
              clients={allUserClients || []}
              lenders={allUserLenders || []}
              onSelectedClientChange={setSelectedClientId}
              onSelectedLendersChange={setSelectedLenderIds}
              showContextSelector={true}
              initialMessages={chatMessages}
              initialMessageToSend={initialMessage}
            />
          </div>
        );

      case 'library':
        return (
          <div className="h-full p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Conversation Library</h1>
                <Button onClick={handleBackToWelcome}>
                  New Chat
                </Button>
              </div>

              {isLoadingList ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-muted-foreground">Loading conversations...</div>
                </div>
              ) : conversationListError ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-destructive">Error loading conversations</div>
                </div>
              ) : conversationList.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No conversations yet</p>
                    <Button onClick={handleBackToWelcome}>
                      Start Your First Chat
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {conversationList.map((conversation) => (
                    <div
                      key={conversation.session_id}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        setSearchParams({ mode: 'chat', session: conversation.session_id });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {conversation.title || `Session ${conversation.session_id.substring(0, 8)}...`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(conversation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.session_id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative">
          {renderContent()}
        </div>
      </div>

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

export default NewAIAssistantV2;
