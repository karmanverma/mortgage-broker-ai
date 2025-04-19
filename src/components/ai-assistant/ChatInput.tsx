
import React, { useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea is in ui
import { Button } from '@/components/ui/button'; // Assuming Button is in ui
import { SendHorizonal, Loader2, Settings } from 'lucide-react'; // Added Settings icon
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    newMessage: string;
    setNewMessage: (value: string) => void;
    handleSendMessage: (event: React.FormEvent<HTMLFormElement>) => void;
    handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    isWaitingForAI: boolean;
    onOpenContextDialog: () => void; // Added prop for context dialog
    className?: string; // Allow external className
}

const ChatInput: React.FC<ChatInputProps> = ({
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleKeyDown,
    textareaRef,
    isWaitingForAI,
    onOpenContextDialog, // Destructure the new prop
    className, // Destructure className
    ...props // Pass remaining props to Textarea
}) => {
    const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(event.target.value);
        adjustTextareaHeight(); // Adjust height on change
    };

    // Adjust textarea height based on content
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            // Set height based on scroll height, but limit to a reasonable max (e.g., 200px)
            const maxHeight = 200;
            textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
        }
    };

    // Adjust height on initial render and when newMessage changes
    useEffect(() => {
        adjustTextareaHeight();
    }, [newMessage]);

    return (
        // Apply external className to the root div
        <div className={cn("w-full relative", className)}>
          <form onSubmit={handleSendMessage} className="flex items-end w-full">
             {/* Make the div containing Textarea take full width */}
            <div className="flex-1 min-w-0 relative">
              <Textarea
                ref={textareaRef}
                rows={1}
                value={newMessage}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                // Increased right padding to accommodate both buttons
                className="resize-none overflow-hidden pr-24 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full block box-border py-2.5 px-3 text-sm"
                disabled={isWaitingForAI}
                style={{ height: 'auto' }} // Use style for dynamic height
                {...props} // Pass other props like aria-label etc.
              />
              {/* Context Toggle Button positioned absolutely */}
               <Button
                 type="button" // Important: Prevent form submission
                 variant="ghost"
                 size="icon"
                 onClick={onOpenContextDialog} // Call the handler
                 className="absolute right-12 bottom-2 h-8 w-8 text-gray-500 hover:text-blue-600" // Positioned left of send button
                 aria-label="Toggle context"
               >
                 <Settings className="h-4 w-4" /> {/* Context Icon */}
               </Button>

              {/* Send Button positioned absolutely */}
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={isWaitingForAI || !newMessage.trim()}
                className="absolute right-2 bottom-2 h-8 w-8 text-gray-500 hover:text-blue-600 disabled:text-gray-300" // Keeps button at bottom-right
                aria-label="Send message"
              >
                {isWaitingForAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" /> // Use matching icon
                )}
              </Button>
            </div>
          </form>
        </div>
      );
    };

export default ChatInput;
