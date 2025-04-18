
import React, { RefObject, useCallback, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Loader2 } from "lucide-react"; // Use SendHorizonal for consistency
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from "@/lib/utils"; // Import cn utility

interface ChatInputProps {
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (e?: React.FormEvent) => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  isWaitingForAI: boolean;
  className?: string; // Add className prop
}

const ChatInput: React.FC<ChatInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyDown,
  textareaRef,
  isWaitingForAI,
  className, // Destructure className
}) => {
  const isMobile = useIsMobile();

  const adjustTextareaHeight = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;

    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
    const verticalPaddingAndBorder = paddingTop + paddingBottom + borderTop + borderBottom;

    const maxRows = isMobile ? 5 : 10; // Adjust max rows if needed
    const maxHeight = (maxRows * lineHeight) + verticalPaddingAndBorder;

    element.style.height = 'auto';
    const scrollHeight = element.scrollHeight;

    if (scrollHeight > maxHeight) {
        element.style.height = `${maxHeight}px`;
        element.style.overflowY = 'auto';
    } else {
        element.style.height = `${scrollHeight}px`;
        element.style.overflowY = 'hidden';
    }
  }, [isMobile]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    adjustTextareaHeight(e.target);
  };

  useEffect(() => {
    if (newMessage === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      adjustTextareaHeight(textareaRef.current);
    }
  }, [newMessage, adjustTextareaHeight, textareaRef]);

  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [adjustTextareaHeight, textareaRef]);

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
            className="resize-none overflow-hidden pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full block box-border py-2.5 px-3 text-sm" // Adjusted padding slightly
            disabled={isWaitingForAI}
            style={{ height: 'auto' }}
          />
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
