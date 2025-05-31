import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquarePlus, Library } from "lucide-react"; // Removed unused icons
import ChatControls from "./ChatControls";
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // For icon buttons
import { format } from 'date-fns';
// Import Client type
import { Client } from '@/features/clients/types';

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

// Utility to get first user message
const getFirstUserMessage = (msgs: Message[]): Message | undefined =>
    msgs.find(msg => msg.sender === 'user');

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
    onOpenContextDialog: () => void; // Handler for context dialog
    isAssistPage: boolean; // Controls initial view behavior
    showChatSessionInfo: boolean; // Controls visibility of session info box
    inputContainerClassName?: string; // Add inputContainerClassName prop

    // --- Props for Context Tooltip ---
    selectedClientId: string | null;
    selectedLenderIds: string[];
    clients: Client[]; // Add clients list
    // --- End Context Tooltip Props ---
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
    onOpenContextDialog, // Receive context dialog handler
    isAssistPage,
    showChatSessionInfo,
    inputContainerClassName, // Receive inputContainerClassName prop
    // --- Receive Context Tooltip Props ---
    selectedClientId,
    selectedLenderIds,
    clients,
    // --- End Receive Context Tooltip Props ---
}) => {

    // Function to render the main chat content (messages + input)
    const renderChatContent = () => (
        <div className="flex-1 flex flex-col overflow-hidden bg-background"> {/* Ensure background */}
            {/* Chat Messages Area */}
            <ScrollArea className="flex-1 overflow-y-auto bg-background">
                <ChatMessages
                    messages={isWaitingForAI ? [...messages, {
                        id: 'pending-ai',
                        sender: 'ai',
                        message: '',
                        created_at: new Date().toISOString(),
                        session_id: currentSessionId || '',
                        user_id: user?.id || ''
                    }] : messages}
                    isLoadingHistory={isLoadingHistory}
                    conversationError={conversationError}
                />
                <div ref={messagesEndRef} /> {/* Scroll anchor */}
            </ScrollArea>

            {/* Chat Input Area - sticky to bottom when chat is selected */}
            <div className={inputContainerClassName ? `${inputContainerClassName} pb-2 pt-2 bg-background mx-1 sticky bottom-0 z-10` : "pb-2 pt-2 bg-background mx-1 sticky bottom-0 z-10"}>
                <div className="flex items-end gap-2 pt-2"> 
                    <ChatInput
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        handleSendMessage={handleSendMessage} // Pass the wrapper
                        handleKeyDown={handleKeyDown}
                        textareaRef={textareaRef}
                        isWaitingForAI={isWaitingForAI}
                        className="flex-1" // Make input take remaining space
                        onOpenContextDialog={onOpenContextDialog} // Pass the handler down
                        // --- Pass selection props to ChatInput ---
                        selectedClientId={selectedClientId}
                        selectedLenderIds={selectedLenderIds}
                        clients={clients}
                        // --- End Pass selection props ---
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full bg-background">
            {/* Conditional Content Area based on isAssistPage and currentSessionId */}
            {isAssistPage ? (
                <div>
                    {showChatSessionInfo && currentSessionId && (
                        <div className="mt-4 mb-0">
                            <div className="p-3 flex flex-row justify-between items-center bg-background flex-wrap gap-2">
                                <div>
                                    <span className="text-base font-normal block">
                                        {(() => {
                                            const firstUserMsg = getFirstUserMessage(messages);
                                            return firstUserMsg
                                                ? firstUserMsg.message
                                                : 'No user message yet.';
                                        })()}
                                    </span>
                                    <span className="text-xs mt-1 block">
                                        Chat Date: {getConversationStartDate(messages)} | Chat ID: {currentSessionId.substring(0, 8)}...
                                    </span>
                                </div>
                                <div className="flex flex-row items-center gap-2">
                                    <ChatControls
                                        sessionId={currentSessionId}
                                        onDeleteConversation={onDeleteConversation}
                                        onSaveAsPdf={onSaveAsPdf}
                                        onCopyToClipboard={onCopyToClipboard}
                                        onPrint={onPrint}
                                        renderAsIcons={false}
                                    />
                                </div>
                            </div>
                            <div className="border-b border-gray-200 w-full" />
                        </div>
                    )}
                    {renderChatContent()}
                </div>
            ) : (
                currentSessionId ? (
                    <div>
                        {showChatSessionInfo && currentSessionId && (
                            <div className="mt-4 mb-0">
                                <div className="p-3 flex flex-row justify-between items-center bg-background flex-wrap gap-2">
                                    <div>
                                        <span className="text-base font-normal block">
                                            {(() => {
                                                const firstUserMsg = getFirstUserMessage(messages);
                                                return firstUserMsg
                                                    ? firstUserMsg.message
                                                    : 'No user message yet.';
                                            })()}
                                        </span>
                                        <span className="text-xs mt-1 block">
                                            Chat Date: {getConversationStartDate(messages)} | Chat ID: {currentSessionId.substring(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="flex flex-row items-center gap-2">
                                        <ChatControls
                                            sessionId={currentSessionId}
                                            onDeleteConversation={onDeleteConversation}
                                            onSaveAsPdf={onSaveAsPdf}
                                            onCopyToClipboard={onCopyToClipboard}
                                            onPrint={onPrint}
                                            renderAsIcons={false}
                                        />
                                    </div>
                                </div>
                                <div className="border-b border-gray-200 w-full" />
                            </div>
                        )}
                        {renderChatContent()}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-background">
                        <MessageSquarePlus className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No Chat Selected</h3>
                        <p className="text-muted-foreground mb-4">
                            Select an existing conversation or start a new one.
                        </p>
                    </div>
                )
            )}
        </div>
    );
};

export default MainChatArea;
