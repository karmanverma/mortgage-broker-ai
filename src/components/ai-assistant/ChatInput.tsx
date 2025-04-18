
import React, { RefObject, useCallback, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

interface ChatInputProps {
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (e?: React.FormEvent) => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  isWaitingForAI: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  handleKeyDown,
  textareaRef,
  isWaitingForAI
}) => {
  const isMobile = useIsMobile(); // Use the hook

  // Function to adjust textarea height
  const adjustTextareaHeight = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;

    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 20; // Approx line height or get computed
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
    const verticalPaddingAndBorder = paddingTop + paddingBottom + borderTop + borderBottom;

    const maxRows = isMobile ? 10 : 30;
    const maxHeight = (maxRows * lineHeight) + verticalPaddingAndBorder;

    // Temporarily shrink height to calculate scrollHeight correctly
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

  // Adjust height on input change
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    adjustTextareaHeight(e.target);
  };

  // Adjust height when newMessage is cleared (after sending)
  useEffect(() => {
    if (newMessage === '' && textareaRef.current) {
      // Reset to single line height
      textareaRef.current.style.height = 'auto'; 
      adjustTextareaHeight(textareaRef.current);
    }
  }, [newMessage, adjustTextareaHeight, textareaRef]);

  // Initial height adjustment on mount
  useEffect(() => {
    adjustTextareaHeight(textareaRef.current);
  }, [adjustTextareaHeight, textareaRef]);

  return (
    // Added p-2 for padding around the input area
    <div className="w-full relative p-2">
      <form onSubmit={handleSendMessage} className="flex items-end max-w-full">
        <div className="flex-1 min-w-0 relative"> 
          <Textarea
            ref={textareaRef}
            rows={1} // Start with 1 row
            value={newMessage}
            onChange={handleTextareaChange} // Use the combined handler
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            // Removed min-h-[60px]. Dynamic height is handled by JS.
            // Added overflow-hidden initially, pr-12 for button space.
            className="resize-none overflow-hidden pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full block box-border py-2 px-3"
            disabled={isWaitingForAI}
            style={{ height: 'auto' }} // Start with auto height
          />
          {/* Position the button absolutely within the textarea container */}
          <Button 
            type="submit" 
            variant="ghost" // Ghost variant for no background
            size="icon" // Icon size for a smaller button
            disabled={isWaitingForAI || !newMessage.trim()}
            // Adjusted absolute positioning - place consistently at bottom right
            className="absolute right-2 bottom-2 h-8 w-8 text-gray-500 hover:text-blue-600 disabled:text-gray-300"
            aria-label="Send message"
          >
            {isWaitingForAI ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
