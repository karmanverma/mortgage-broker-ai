
import React, { useRef, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Loader2, Settings, Info } from 'lucide-react'; // Added Info icon
import { cn } from '@/lib/utils';
// Import Tooltip components
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// Import Client type
import { Client } from '@/features/clients/types';

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    newMessage: string;
    setNewMessage: (value: string) => void;
    handleSendMessage: (event: React.FormEvent<HTMLFormElement>) => void;
    handleKeyDown: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    isWaitingForAI: boolean;
    onOpenContextDialog: () => void;
    className?: string;

    // --- Props for Context Tooltip ---
    selectedClientId: string | null;
    selectedLenderIds: string[];
    clients: Client[]; // Receive clients list
    // --- End Context Tooltip Props ---
}

const ChatInput: React.FC<ChatInputProps> = ({
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleKeyDown,
    textareaRef,
    isWaitingForAI,
    onOpenContextDialog,
    className,
    // --- Receive Context Tooltip Props ---
    selectedClientId,
    selectedLenderIds,
    clients,
    // --- End Receive Context Tooltip Props ---
    ...props
}) => {

    console.log("ChatInput: Received props - selectedClientId:", selectedClientId, "clients:", clients);

    const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(event.target.value);
        adjustTextareaHeight(); // Adjust height on change
    };

    // Adjust textarea height based on content
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height
            const maxHeight = 200;
            textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
        }
    };

    // Adjust height on initial render and when newMessage changes
    useEffect(() => {
        adjustTextareaHeight();
    }, [newMessage]);

    // --- Calculate Tooltip Text (Refined Logic) --- 
    const contextTooltipText = useMemo(() => {
        const lenderCount = selectedLenderIds.length;

        // --- Handle case where clients array isn't ready yet ---
        if (!clients || clients.length === 0) {
            console.log("ChatInput useMemo: Clients array is empty or not yet loaded.");
            if (selectedClientId && lenderCount > 0) {
                // Client selected, but name not found yet
                return `Client selected, ${lenderCount} lender(s) selected`; 
            } else if (selectedClientId) {
                 // Client selected, no lenders
                 return `Client selected`;
            } else if (lenderCount > 0) {
                // Lenders selected, no client
                return `No client, ${lenderCount} lender(s) selected`;
            } else {
                 // Nothing selected
                 return "No context selected";
            }
        }
        // --- End loading state handling ---

        // --- Clients list IS available, proceed as before ---
        const client = clients.find(c => c.id === selectedClientId);
        const clientName = client ? `${client.firstName} ${client.lastName}` : 'No client';

        console.log("ChatInput useMemo: Finding client with ID:", selectedClientId, "in clients:", clients);
        console.log("ChatInput useMemo: Found client:", client, "Calculated text:", `${clientName}, ${lenderCount} lender(s) selected`);

        if (!client && lenderCount === 0) {
            return "No context selected";
        }
        return `${clientName}, ${lenderCount} lender(s) selected`;

    }, [selectedClientId, selectedLenderIds, clients]);
    // --- End Calculate Tooltip Text --- 

    return (
        <TooltipProvider delayDuration={200}> 
          <div className={cn("w-full relative", className)}>
            <form onSubmit={handleSendMessage} className="flex items-end w-full">
              <div className="flex-1 min-w-0 relative">
                <Textarea
                  ref={textareaRef}
                  rows={1}
                  value={newMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="resize-none overflow-hidden pr-32 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full block box-border py-2.5 px-3 text-sm"
                  disabled={isWaitingForAI}
                  style={{ height: 'auto' }}
                  {...props}
                />
                
                <div className="absolute right-2 bottom-2 flex items-center gap-1"> 
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <span className="text-gray-500 cursor-help" tabIndex={0}> 
                         <Info className="h-4 w-4" />
                       </span>
                     </TooltipTrigger>
                     <TooltipContent side="top" align="end">
                       <p>{contextTooltipText}</p>
                     </TooltipContent>
                   </Tooltip>
                
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onOpenContextDialog}
                    className="h-8 w-8 text-gray-500 hover:text-blue-600"
                    aria-label="Toggle context"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon"
                    disabled={isWaitingForAI || !newMessage.trim()}
                    className="h-8 w-8 text-gray-500 hover:text-blue-600 disabled:text-gray-300"
                    aria-label="Send message"
                  >
                    {isWaitingForAI ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendHorizonal className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </TooltipProvider>
      );
    };

export default ChatInput;
