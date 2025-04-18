
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from "@/components/ui/scroll-area"; // Keep ScrollArea import if used here, otherwise remove

interface Message {
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
  id: string; // Ensure id is used as key
  session_id: string;
  user_id: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoadingHistory: boolean;
  conversationError: any;
  // messagesEndRef prop removed from here, will be handled in parent
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoadingHistory,
  conversationError,
}) => {

  console.log("ChatMessages rendering with messages:", messages); // Log received messages

  if (isLoadingHistory) {
    return <div className="text-center text-gray-500 p-4">Loading messages...</div>;
  }

  if (conversationError) {
    return <div className="text-center text-red-500 p-4">Error: {conversationError.message}</div>;
  }

  if (!messages || messages.length === 0) {
      return <div className="text-center text-gray-500 p-4">No messages yet. Send a message to start the conversation!</div>; // Handle empty state
  }

  return (
    // Removed ScrollArea from here, parent will handle scrolling
    <div className="p-4 space-y-4"> {/* Add padding and spacing */}
      {messages.map((msg) => {
        // Add logging inside map
        // console.log(`Rendering message ID: ${msg.id}, Sender: ${msg.sender}`);
        return (
          // Use msg.id as the key
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[75%] rounded-xl px-4 py-2 shadow-sm ${msg.sender === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>
              {msg.sender === 'ai' ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  // Removed className prop to fix the error
                  // className="prose prose-sm max-w-none" 
                >
                  {msg.message}
                </ReactMarkdown>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p> // Ensure user message also uses <p> and handles whitespace
              )}
              <div className="text-xs text-gray-500 mt-1 text-right w-full">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</div>
            </div>
          </div>
        );
      })}
       {/* messagesEndRef is now handled by the parent component */}
    </div>
  );
};

export default ChatMessages;
