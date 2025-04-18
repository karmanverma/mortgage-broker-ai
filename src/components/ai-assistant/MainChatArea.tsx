
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Settings2, Sparkles, MessageSquarePlus, Copy, Printer, Trash2, SendHorizonal } from "lucide-react"; // Updated icons
import ChatControls from "./ChatControls";
import ChatMessages from './ChatMessages';
import MessageSuggestions from './MessageSuggestions';
import ChatInput from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // For session info box
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // For icon buttons
import { format } from 'date-fns'; // For date formatting

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
    // Sidebar/Panel state removed
    // conversationSidebarOpen: boolean;
    // setConversationSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
    // contextPanelOpen: boolean;
    // setContextPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
    onDeleteConversation: () => Promise<void>;
    onSaveAsPdf: () => void;
    onCopyToClipboard: () => void;
    onPrint: () => void;
    messageSuggestions?: string[];
    // Removed onStartNewConversation from here, handled differently in AIAssist
    // onStartNewConversation?: () => Promise<void>; // Make optional if used elsewhere
    onOpenContextDialog: () => void; // Added
    isAssistPage: boolean; // Added: Controls initial view behavior
    showChatSessionInfo: boolean; // Added: Controls visibility of session info box
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
    // onStartNewConversation,
    onOpenContextDialog, // Added
    isAssistPage, // Added
    showChatSessionInfo, // Added
}) => {
    const [showSuggestions, setShowSuggestions] = useState(true);
    const conversationStartDate = getConversationStartDate(messages);

    // Function to render the main chat content (messages + input)
    const renderChatContent = () => (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Session Info Box (visible after first message) */}
            {showChatSessionInfo && currentSessionId && (
                <Card className="mx-4 mt-4 mb-0 shadow-sm border-l-4 border-primary"> {/* Adjusted margins */}
                    <CardHeader className="p-3 flex flex-row justify-between items-center">
                        <div>
                            <CardTitle className="text-sm font-medium">Chat First Message</CardTitle>
                             <CardDescription className="text-xs">
                                Chat Date: {conversationStartDate} | Chat ID: {currentSessionId.substring(0, 8)}...
                            </CardDescription>
                        </div>
                         {/* Chat Actions Dropdown/Buttons (simplified here) */}
                         <ChatControls
                            sessionId={currentSessionId}
                            onDeleteConversation={onDeleteConversation}
                            onSaveAsPdf={onSaveAsPdf} // This uses window.print
                            onCopyToClipboard={onCopyToClipboard}
                            onPrint={onPrint}
                            // Render icons only, wrap in Tooltips for better UX
                            renderAsIcons={true}
                        />
                    </CardHeader>
                </Card>
            )}

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
            <div className="px-4 pb-2 pt-2 border-t bg-white"> {/* Added padding and border */}
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
                ) : (messages.length === 0 && messageSuggestions.length > 0 &&
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

                {/* Chat Input Area with Context Button */}
                 <div className="flex items-end gap-2"> {/* Use items-end for alignment */}
                     <ChatInput
                         newMessage={newMessage}
                         setNewMessage={setNewMessage}
                         handleSendMessage={handleSendMessage} // Pass the wrapper
                         handleKeyDown={handleKeyDown}
                         textareaRef={textareaRef}
                         isWaitingForAI={isWaitingForAI}
                         className="flex-1" // Make input take remaining space
                     />
                      {/* Context Button - Triggers Dialog */}
                      <Tooltip>
                         <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onOpenContextDialog}
                                disabled={isWaitingForAI}
                                className="flex-shrink-0" // Prevent shrinking
                                aria-label="Open Context Panel"
                             >
                                <Settings2 className="h-5 w-5" />
                             </Button>
                          </TooltipTrigger>
                         <TooltipContent>
                             <p>Context</p>
                         </TooltipContent>
                     </Tooltip>
                    {/* Send Button - Now part of ChatInput, but could be extracted if needed */}
                    {/* Send Button is inside ChatInput component now */} 
                 </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative bg-gray-50 w-full h-full">
             {/* Header Section (Removed for AIAssist page as per drawing) - Kept minimal for context */}
             {/*
             <div className="border-b sticky top-0 bg-white z-10">
                 <div className="flex items-center justify-between p-4 h-16">
                     <h2 className="text-lg font-semibold truncate pr-2">
                         AI Assistant
                     </h2>
                     {/* Controls removed from header in new design * /}
                 </div>
             </div>
             */}

            {/* Conditional Content Area based on isAssistPage and currentSessionId */}
            {isAssistPage ? (
                // Always render chat content in AIAssist page
                renderChatContent()
            ) : (
                // Original AIAssistant page logic
                currentSessionId ? (
                    // Active Chat View (Original)
                     renderChatContent()
                ) : (
                    // Placeholder View (Original)
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <MessageSquarePlus className="h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Chat Selected</h3>
                        <p className="text-gray-500 mb-4">
                            Select an existing conversation or start a new one.
                        </p>
                        {/* Placeholder needs a way to start a new conversation if onStartNewConversation is passed */}
                        {/* <Button onClick={onStartNewConversation}> Start New Conversation </Button> */}
                    </div>
                )
            )}
        </div>
    );
};

export default MainChatArea;
