
import React from 'react';
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import ChatControls from "./ChatControls";
import ChatMessages from './ChatMessages';
import MessageSuggestions from './MessageSuggestions';
import ChatInput from './ChatInput';

interface Message {
    sender: 'user' | 'ai';
    message: string;
    created_at: string;
    id: string;
    session_id: string;
    user_id: string;
}

interface MainChatAreaProps {
    messages: Message[];
    isLoadingHistory: boolean;
    conversationError: any;
    currentSessionId: string | null;
    isWaitingForAI: boolean;
    user: any;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    newMessage: string;
    setNewMessage: React.Dispatch<React.SetStateAction<string>>;
    handleSendMessage: (e?: React.FormEvent | React.KeyboardEvent) => Promise<void>;
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    setConversationSidebarOpen: (open: boolean) => void;
    fetchMessages: () => Promise<void>;
    setContextPanelOpen: (open: boolean) => void;
    contextPanelOpen: boolean;
    onDeleteConversation: () => Promise<void>;
    onSaveAsPdf: () => void;
    onCopyToClipboard: () => void;
    onPrint: () => void;
    messageSuggestions?: string[];
}

const MainChatArea: React.FC<MainChatAreaProps> = ({
    messages,
    isLoadingHistory,
    conversationError,
    currentSessionId,
    isWaitingForAI,
    user,
    messagesEndRef,
    textareaRef,
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleKeyDown,
    setConversationSidebarOpen,
    fetchMessages,
    setContextPanelOpen,
    contextPanelOpen,
    onDeleteConversation,
    onSaveAsPdf,
    onCopyToClipboard,
    onPrint,
    messageSuggestions = [],
}) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setConversationSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-semibold">{currentSessionId ? `Chat Session: ${currentSessionId.substring(0, 8)}` : 'New Chat'}</h2>
                    </div>
                    <ChatControls
                        sessionId={currentSessionId}
                        onDeleteConversation={onDeleteConversation}
                        onSaveAsPdf={onSaveAsPdf}
                        onCopyToClipboard={onCopyToClipboard}
                        onPrint={onPrint}
                    />
                </div>
            </div>
            
            <ChatMessages 
                messages={messages}
                isLoadingHistory={isLoadingHistory}
                conversationError={conversationError}
                messagesEndRef={messagesEndRef}
            />
            
            <MessageSuggestions 
                suggestions={messageSuggestions}
                onSelectSuggestion={setNewMessage}
            />

            <ChatInput
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleSendMessage={handleSendMessage}
                handleKeyDown={handleKeyDown}
                textareaRef={textareaRef}
                isWaitingForAI={isWaitingForAI}
            />
        </div>
    );
};

export default MainChatArea;
