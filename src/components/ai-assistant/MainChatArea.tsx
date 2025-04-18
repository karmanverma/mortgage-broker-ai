
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Sparkles, MessageSquarePlus } from "lucide-react"; // Added MessageSquarePlus
import ChatControls from "./ChatControls";
import ChatMessages from './ChatMessages';
import MessageSuggestions from './MessageSuggestions';
import ChatInput from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea

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
    conversationSidebarOpen: boolean;
    setConversationSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
    // fetchMessages: () => Promise<void>; // Removed as it's likely managed by the parent based on currentSessionId
    contextPanelOpen: boolean;
    setContextPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
    onDeleteConversation: () => Promise<void>;
    onSaveAsPdf: () => void;
    onCopyToClipboard: () => void;
    onPrint: () => void;
    messageSuggestions?: string[];
    // Add a prop to trigger starting a new conversation from the placeholder
    onStartNewConversation: () => Promise<void>;
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
    conversationSidebarOpen,
    setConversationSidebarOpen,
    // fetchMessages, // Removed
    contextPanelOpen,
    setContextPanelOpen,
    onDeleteConversation,
    onSaveAsPdf,
    onCopyToClipboard,
    onPrint,
    messageSuggestions = [],
    onStartNewConversation, // Added
}) => {
    const [showSuggestions, setShowSuggestions] = useState(true);

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-50"> {/* Added background */}
            {/* Header */}
            <div className="border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between p-4 h-16"> {/* Fixed height */}
                    {/* Left Side: Conversation Toggle + Title */}
                    <div className="flex items-center gap-4 flex-1 min-w-0"> {/* Added flex-1 and min-w-0 */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConversationSidebarOpen(prev => !prev)}
                            aria-label={conversationSidebarOpen ? "Close conversation list" : "Open conversation list"}
                        >
                           {conversationSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
                        </Button>
                        <h2 className="text-lg font-semibold truncate pr-2">
                            {currentSessionId ? `Chat Session: ${currentSessionId.substring(0, 8)}...` : 'AI Assistant'}
                        </h2>
                    </div>

                    {/* Right Side: Chat Controls + Context Panel Toggle */}
                    <div className="flex items-center gap-2 flex-shrink-0"> {/* Added flex-shrink-0 */}
                        {currentSessionId && ( // Only show controls if a chat is active
                            <ChatControls
                                sessionId={currentSessionId}
                                onDeleteConversation={onDeleteConversation}
                                onSaveAsPdf={onSaveAsPdf}
                                onCopyToClipboard={onCopyToClipboard}
                                onPrint={onPrint}
                            />
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setContextPanelOpen(prev => !prev)}
                            aria-label={contextPanelOpen ? "Close context panel" : "Open context panel"}
                            className="hidden lg:inline-flex" // Hide on smaller screens where panel is overlay
                        >
                           {contextPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Conditional Content Area */}
            {currentSessionId ? (
                // Active Chat View
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Chat Messages Area */}
                    <ScrollArea className="flex-1 overflow-y-auto p-4">
                        <ChatMessages
                            messages={messages}
                            isLoadingHistory={isLoadingHistory}
                            conversationError={conversationError}
                        />
                        <div ref={messagesEndRef} /> {/* Scroll anchor */}
                    </ScrollArea>


                    {/* Suggestions Area (Conditional) */}
                    <div className="px-4 pb-2 border-t bg-white"> {/* Added padding and border */}
                         {showSuggestions && messages.length === 0 && !isLoadingHistory ? ( // Show suggestions only if chat is empty and not loading
                            <MessageSuggestions
                                suggestions={messageSuggestions}
                                onSelectSuggestion={(suggestion) => {
                                    setNewMessage(suggestion);
                                    textareaRef.current?.focus();
                                }}
                                isVisible={showSuggestions}
                                onClose={() => setShowSuggestions(false)}
                            />
                        ) : ( messages.length === 0 && // Optionally show toggle even when hidden if chat empty
                            <div className="flex justify-end py-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowSuggestions(true)}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                    aria-label="Show suggestions"
                                >
                                    <Sparkles className="h-4 w-4 mr-1" />
                                    Show Suggestions
                                </Button>
                            </div>
                        )}

                        {/* Chat Input Area */}
                        <ChatInput
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            handleSendMessage={handleSendMessage}
                            handleKeyDown={handleKeyDown}
                            textareaRef={textareaRef}
                            isWaitingForAI={isWaitingForAI}
                        />
                    </div>
                </div>
            ) : (
                // Placeholder View when no chat is selected
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MessageSquarePlus className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Chat Selected</h3>
                    <p className="text-gray-500 mb-4">
                        Select an existing conversation from the sidebar or start a new one to begin chatting.
                    </p>
                    <Button onClick={onStartNewConversation}>
                        <Sparkles className="h-4 w-4 mr-2" /> Start New Conversation
                    </Button>
                     <Button
                        variant="link"
                        onClick={() => setConversationSidebarOpen(true)}
                        className="mt-2 text-sm md:hidden" // Show only on mobile where sidebar might be closed
                    >
                        Open Conversation List
                    </Button>
                </div>
            )}
        </div>
    );
};

export default MainChatArea;

