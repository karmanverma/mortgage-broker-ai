import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MessageSquare,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    Send,
    MoreHorizontal, // Icon for the dropdown trigger
    Trash2,         // Delete icon
    FileDown,       // PDF icon (example)
    ClipboardCopy,  // Copy icon
    Printer         // Print icon
} from "lucide-react";
import { Conversation } from '@/hooks/useConversations';
import { AuthContextType } from '@/contexts/AuthContext.types';

interface MainChatAreaProps {
    messages: Conversation[];
    isLoadingHistory: boolean;
    conversationError: string | null;
    currentSessionId: string | null;
    isWaitingForAI: boolean;
    user: AuthContextType['user'];
    messagesEndRef: React.RefObject<HTMLDivElement>;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    newMessage: string;
    setNewMessage: (message: string) => void;
    handleSendMessage: (e?: React.FormEvent | React.KeyboardEvent) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    setConversationSidebarOpen: (isOpen: boolean) => void;
    fetchMessages: () => void;
    setContextPanelOpen: (isOpen: boolean) => void;
    contextPanelOpen: boolean;
    // Action Handlers
    onDeleteConversation: () => void;
    onSaveAsPdf: () => void;
    onCopyToClipboard: () => void;
    onPrint: () => void;
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
    // Destructure action handlers
    onDeleteConversation,
    onSaveAsPdf,
    onCopyToClipboard,
    onPrint
}) => {
    const canPerformActions = currentSessionId && messages.length > 0;

    return (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header */}
            <div className="py-3 px-4 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center min-w-0">
                    <Button variant="ghost" size="icon" onClick={() => setConversationSidebarOpen(true)} className="md:hidden mr-2"><PanelLeftOpen className="h-5 w-5" /></Button>
                    <h2 className="font-semibold truncate mr-2 flex-shrink min-w-0" title={`Session: ${currentSessionId?.substring(0,8) ?? '...'}`}>
                        Chat Session {currentSessionId ? `(${currentSessionId.substring(0,8)}...)` : ''}
                    </h2>
                    <Badge variant="outline" className="ml-auto md:ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap flex-shrink-0">AI Assistant</Badge>
                </div>
                <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                    {/* Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!canPerformActions}>
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onCopyToClipboard}>
                                <ClipboardCopy className="mr-2 h-4 w-4" />
                                <span>Copy to Clipboard</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onSaveAsPdf}>
                                <FileDown className="mr-2 h-4 w-4" />
                                <span>Save as PDF (Print)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onPrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                <span>Print</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDeleteConversation} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Chat</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Context Panel Toggle */}
                    <Button variant="ghost" size="icon" onClick={() => setContextPanelOpen(!contextPanelOpen)} className="inline-flex">
                        {contextPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Messages */}
            {/* ... (Messages rendering remains the same) ... */}
             <ScrollArea className="flex-1 p-4 pb-2">
                {isLoadingHistory && messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <p className="text-muted-foreground">Loading conversation...</p>
                    </div>
                )}
                {!isLoadingHistory && messages.length === 0 && !conversationError && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                           <MessageSquare className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Mortgage AI Assistant</h3>
                        <p className="text-gray-500 max-w-md mb-6">Start by typing your question below.</p>
                    </div>
                )}
                {conversationError && messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                           <p className="text-red-500">Error loading conversation: {conversationError}</p>
                       </div>
                )}

                {messages.length > 0 && (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[85%] md:max-w-[70%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <Avatar className={`h-8 w-8 shrink-0 mt-1 ${message.sender === 'user' ? 'ml-2' : 'mr-2'}`}>
                                        <AvatarImage src={message.sender === 'user' ? `https://api.dicebear.com/8.x/initials/svg?seed=${user?.email}` : '/placeholder.svg'} />
                                        <AvatarFallback className={message.sender === 'user' ? '' : 'bg-blue-600 text-white'}>
                                            {message.sender === 'user' ? (user?.email?.[0] ?? 'U').toUpperCase() : 'AI'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`px-4 py-3 rounded-lg shadow-sm ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                        <div className="whitespace-pre-line text-sm">{message.message}</div>
                                        <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isWaitingForAI && (
                            <div className="flex justify-start">
                                <div className="flex flex-row">
                                    <Avatar className="h-8 w-8 shrink-0 mt-1 mr-2">
                                       <AvatarImage src={'/placeholder.svg'} />
                                       <AvatarFallback className="bg-blue-600 text-white">AI</AvatarFallback>
                                    </Avatar>
                                    <div className="mx-2 px-4 py-3 rounded-lg bg-gray-100 shadow-sm">
                                        <div className="flex space-x-1.5">
                                            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                 )}
                <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input Area */}
            {/* ... (Input Area remains the same) ... */}
             <div className="shrink-0 border-t bg-white">
                <div className="p-4">
                    <div className="relative">
                        <Textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ask about lenders, rates, client scenarios..."
                            className="resize-none pr-12 min-h-[40px]"
                            rows={1}
                            onKeyDown={handleKeyDown}
                            disabled={!currentSessionId || isLoadingHistory || isWaitingForAI}
                        />
                        <Button
                            className="absolute right-2 bottom-1.5"
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || !currentSessionId || isWaitingForAI || isLoadingHistory}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1.5 text-center">
                        AI Assistant uses your lender data. Session: {currentSessionId ? currentSessionId.substring(0,8) + '...' : 'None'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainChatArea;
