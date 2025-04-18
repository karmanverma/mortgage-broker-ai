
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  sender: 'user' | 'ai';
  message: string;
  created_at: string;
  id: string;
  session_id: string;
  user_id: string;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoadingHistory: boolean;
  conversationError: any;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoadingHistory,
  conversationError,
  messagesEndRef
}) => {
  return (
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
  );
};

export default ChatMessages;
