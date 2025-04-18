
import React, { RefObject } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

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
  return (
    <div className="border-t bg-white p-4 w-full">
      <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-full">
        <div className="flex-1 min-w-0">
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
          className="h-[60px] px-6 shrink-0"
        >
          {isWaitingForAI ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
