import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, X, MessageSquareText } from "lucide-react"; // Added icon
import { ConversationInfo } from '@/hooks/useConversations';
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

interface ConversationSidebarProps {
    conversationList: ConversationInfo[];
    isLoadingList: boolean;
    activeSessionId: string | null;
    setActiveConversation: (sessionId: string) => void;
    onNewConversation: () => void;
    setConversationSidebarOpen: (isOpen: boolean) => void;
}

// Use ConversationInfo which only contains session_id and last_message_at
const ConversationItem: React.FC<{ convo: ConversationInfo, isActive: boolean, onClick: () => void }> = ({ convo, isActive, onClick }) => (
    <button
        key={convo.session_id} // Use session_id as key
        onClick={onClick}
        className={cn(
            "flex items-center w-full text-left px-3 py-2.5 rounded-md hover:bg-gray-100 text-sm truncate",
            isActive ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
        )}
        title={`Session started at ${new Date(convo.last_message_at).toLocaleString()}`}
    >
        <MessageSquareText className="h-4 w-4 mr-2.5 shrink-0" />
        <span className="truncate flex-1">
            Chat from {new Date(convo.last_message_at).toLocaleDateString()} {new Date(convo.last_message_at).toLocaleTimeString([], { hour: 'numeric', minute:'2-digit'})}
        </span>
        {/* Optionally add a visual indicator for the active chat */}
    </button>
);

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
    conversationList,
    isLoadingList,
    activeSessionId,
    setActiveConversation,
    onNewConversation,
    setConversationSidebarOpen
}) => {
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header with New Chat Button */}
            <div className="p-3 flex items-center justify-between shrink-0 border-b">
                 <Button onClick={onNewConversation} className="w-full mr-2"><Plus className="h-4 w-4 mr-2" />New Chat</Button>
                 <Button variant="ghost" size="icon" onClick={() => setConversationSidebarOpen(false)} className="md:hidden"><X className="h-5 w-5" /></Button>
            </div>

            {/* Recent Conversations Section */}
            <div className="px-3 pt-3 pb-1 shrink-0">
                 <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Chats</h2>
            </div>

            {/* Conversation List Area */}
            <ScrollArea className="flex-1 px-2 pb-2">
                {isLoadingList ? (
                   // Show skeleton loaders while fetching the list
                   <div className="space-y-2 p-1">
                       <Skeleton className="h-9 w-full" />
                       <Skeleton className="h-9 w-full" />
                       <Skeleton className="h-9 w-full" />
                   </div>
                ) : conversationList && conversationList.length > 0 ? (
                   // Render the list of conversations
                   <div className="space-y-1">
                       {conversationList.map((convo) => (
                           <ConversationItem
                               key={convo.session_id} // Use session_id
                               convo={convo}
                               isActive={convo.session_id === activeSessionId} // Check if it's the active one
                               onClick={() => {
                                   setActiveConversation(convo.session_id); // Call the function from the hook
                                   setConversationSidebarOpen(false); // Close sidebar on mobile after selection
                               }}
                           />
                       ))}
                   </div>
                ) : (
                  // Show message if no conversations exist
                  <div className="p-4 text-sm text-center text-gray-500">No recent conversations. Start a new chat!</div>
                )}
            </ScrollArea>
        </div>
   );
};

export default ConversationSidebar;
