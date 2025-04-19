import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquarePlus } from "lucide-react"; // Removed unused icons
import ChatControls from "./ChatControls";
import ChatMessages from './ChatMessages';
import MessageSuggestions from './MessageSuggestions';
import ChatInput from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // For icon buttons
import { format } from 'date-fns';

interface Message {
    sender: 'user' | 'ai';
    message: string;
    created_at: string;
    id: string;
    session_id: string;
    user_id: string;
}

// Find the earliest message timestamp
const getConversationStartDate = (msgs: Message[]): string => {
    if (!msgs || msgs.length === 0) return "N/A";
    const earliestDate = msgs.reduce((earliest, current) => {
        const currentDate = new Date(current.created_at);
        return currentDate < earliest ? currentDate : earliest;
    }, new Date(msgs[0].created_at));
    return format(earliestDate, 'PPPpp'); // Format like: Jun 21, 2024, 2:30 PM
};

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
    onDeleteConversation: () => Promise<void>;
    onSaveAsPdf: () => void;
    onCopyToClipboard: () => void;
    onPrint: () => void;
    messageSuggestions?: string[];
    onOpenContextDialog: () => void; // Handler for context dialog
    isAssistPage: boolean; // Controls initial view behavior
    showChatSessionInfo: boolean; // Controls visibility of session info box
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
    onDeleteConversation,
    onSaveAsPdf,
    onCopyToClipboard,
    onPrint,
    messageSuggestions = [],
    onOpenContextDialog, // Receive context dialog handler
    isAssistPage,
    showChatSessionInfo,
}) => {
    const [showSuggestions, setShowSuggestions] = useState(true);
    const conversationStartDate = getConversationStartDate(messages);

    // Function to render the main chat content (messages + input)
    const renderChatContent = () => (
        <div className="flex-1 flex flex-col overflow-hidden bg-white"> {/* Ensure white background */}
            {/* Chat Session Info Box (visible after first message) */}
            {showChatSessionInfo && currentSessionId && (
                <Card className="mx-4 mt-4 mb-0 shadow-sm border-l-4 border-primary">
                    <CardHeader className="p-3 flex flex-row justify-between items-center">
                        <div>
                            <CardTitle className="text-sm font-medium">Chat First Message</CardTitle>
                             <CardDescription className="text-xs">
                                Chat Date: {conversationStartDate} | Chat ID: {currentSessionId.substring(0, 8)}...
                            </CardDescription>
                        </div>
                         {/* Chat Actions Dropdown/Buttons */}
                         <ChatControls
                            sessionId={currentSessionId}
                            onDeleteConversation={onDeleteConversation}
                            onSaveAsPdf={onSaveAsPdf}
                            onCopyToClipboard={onCopyToClipboard}
                            onPrint={onPrint}
                            renderAsIcons={true}
                        />
                    </CardHeader>
                </Card>
            )}

            {/* Chat Messages Area */}
            <ScrollArea className="flex-1 overflow-y-auto p-4 bg-white">
                <ChatMessages
                    messages={messages}
                    isLoadingHistory={isLoadingHistory}
                    conversationError={conversationError}
                />
                <div ref={messagesEndRef} /> {/* Scroll anchor */}
            </ScrollArea>

            {/* Suggestions & Input Container */}
            {/* Removed border-t from here */}
            <div className="px-4 pb-2 pt-2 bg-white"> 
                {/* Suggestions Area (Conditional) */}
                {showSuggestions && messages.length === 0 && !isLoadingHistory && messageSuggestions.length > 0 ? (
                    <MessageSuggestions
                        suggestions={messageSuggestions}
                        onSelectSuggestion={(suggestion) => {
                            setNewMessage(suggestion);
                            textareaRef.current?.focus();
                        }}
                        isVisible={showSuggestions}
                        onClose={() => setShowSuggestions(false)}
                    />
                 // Show "Show Suggestions" button only if suggestions are hidden AND available
                ) : (messages.length === 0 && !isLoadingHistory && messageSuggestions.length > 0 && !showSuggestions && 
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

                {/* Chat Input Area - Placed below suggestions */}
                 <div className="flex items-end gap-2 pt-2"> {/* Add padding-top if suggestions are shown or possible */}
                     <ChatInput
                         newMessage={newMessage}
                         setNewMessage={setNewMessage}
                         handleSendMessage={handleSendMessage} // Pass the wrapper
                         handleKeyDown={handleKeyDown}
                         textareaRef={textareaRef}
                         isWaitingForAI={isWaitingForAI}
                         className="flex-1" // Make input take remaining space
                         onOpenContextDialog={onOpenContextDialog} // Pass the handler down
                     />
                 </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full bg-white">
            {/* Conditional Content Area based on isAssistPage and currentSessionId */}
            {isAssistPage ? (
                renderChatContent()
            ) : (
                currentSessionId ? (
                     renderChatContent()
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
                        <MessageSquarePlus className="h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Chat Selected</h3>
                        <p className="text-gray-500 mb-4">
                            Select an existing conversation or start a new one.
                        </p>
                    </div>
                )
            )}
        </div>
    );
};

export default MainChatArea;
