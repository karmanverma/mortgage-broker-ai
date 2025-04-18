
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Menu } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from "@/lib/utils";

interface Message {
    sender: 'user' | 'ai';
    message: string;
    created_at: string;
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
    messageSuggestions = [], // Provide default empty array to prevent undefined errors
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
                    <div className="flex items-center space-x-2 overflow-x-auto">
                        <Button variant="outline" size="sm" onClick={onDeleteConversation} className="whitespace-nowrap">Delete Chat</Button>
                        <Button variant="outline" size="sm" onClick={onSaveAsPdf} className="whitespace-nowrap hidden sm:inline-flex">Save as PDF</Button>
                        <Button variant="outline" size="sm" onClick={onCopyToClipboard} className="whitespace-nowrap hidden sm:inline-flex">Copy</Button>
                        <Button variant="outline" size="sm" onClick={onPrint} className="whitespace-nowrap hidden sm:inline-flex">Print</Button>
                        <Button variant="ghost" size="icon" onClick={() => setContextPanelOpen(!contextPanelOpen)} className="flex-shrink-0">
                            {contextPanelOpen ? 
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm12 1.5a.75.75 0 00-.75.75v3a.75.75 0 001.5 0v-3a.75.75 0 00-.75-.75zM8.25 7.5a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v8.25a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V7.5zM6 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm9 1.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" /></svg>
                                : 
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zM6 4.5A1.5 1.5 0 004.5 6v12a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H6zm7.5 1.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3a.75.75 0 01.75-.75zM8.25 7.5a.75.75 0 00-.75.75v8.25a.75.75 0 001.5 0V8.25a.75.75 0 00-.75-.75zM6 12a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm9 1.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" /></svg>
                            }
                        </Button>
                    </div>
                </div>
            </div>
            <ScrollArea className="flex-1 p-4">
                {isLoadingHistory ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                ) : conversationError ? (
                    <div className="text-center text-red-500">Error: {conversationError.message}</div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`mb-4 flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[75%] rounded-xl px-4 py-2 ${msg.sender === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                {msg.message}
                                <div className="text-xs text-gray-500 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </ScrollArea>
            
            {/* Message suggestions */}
            {messageSuggestions && messageSuggestions.length > 0 && (
                <div className="px-4 py-2 border-t bg-gray-50">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {messageSuggestions.map((suggestion, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="whitespace-nowrap"
                                onClick={() => setNewMessage(suggestion)}
                            >
                                {suggestion}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input area with fixed positioning */}
            <div className="border-t bg-white p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="min-h-[60px] resize-none"
                            disabled={isWaitingForAI}
                        />
                    </div>
                    <Button 
                        type="submit" 
                        disabled={isWaitingForAI || !newMessage.trim()}
                        className="h-[60px] px-6"
                    >
                        {isWaitingForAI ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default MainChatArea;
