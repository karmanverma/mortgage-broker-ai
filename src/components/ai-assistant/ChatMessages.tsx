import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  // if (isLoadingHistory) {
  //   return <div className="text-center text-muted-foreground p-4">Loading messages...</div>;
  // }

  if (conversationError) {
    return <div className="text-center text-red-500 p-4">Error: {conversationError.message}</div>;
  }

  return (
    <div className="p-4 space-y-4"> {/* Add padding and spacing */}
      {messages.map((msg) => {
        // Add logging inside map
        // console.log(`Rendering message ID: ${msg.id}, Sender: ${msg.sender}`);
        if (msg.id === 'pending-ai') {
          return (
            <div key="pending-ai" className="flex flex-col items-start">
              <div className="max-w-[75%] rounded-xl px-4 py-2 shadow-sm bg-muted text-foreground">
                <span className="inline-block align-middle">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce mr-1" style={{animationDelay: '0ms'}}></span>
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce mr-1" style={{animationDelay: '150ms'}}></span>
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </span>
              </div>
            </div>
          );
        }
        return (
          // Use msg.id as the key
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[75%] rounded-xl px-4 py-2 shadow-sm ${msg.sender === 'user' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground'}`}>
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
              <div className="text-xs text-muted-foreground mt-1 text-right w-full">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</div>
            </div>
          </div>
        );
      })}
       {/* messagesEndRef is now handled by the parent component */}
    </div>
  );
};

export default ChatMessages;
