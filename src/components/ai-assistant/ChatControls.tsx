
import { MoreHorizontal, Trash2, Save, Copy, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"; // Added Tooltip imports

interface ChatControlsProps {
  sessionId: string | null;
  onDeleteConversation: () => Promise<void>;
  onSaveAsPdf: () => void;
  onCopyToClipboard: () => void;
  onPrint: () => void;
  renderAsIcons?: boolean; // Added prop
}

const ChatControls = ({
  sessionId,
  onDeleteConversation,
  onSaveAsPdf,
  onCopyToClipboard,
  onPrint,
  renderAsIcons = false, // Default to false
}: ChatControlsProps) => {

  if (renderAsIcons) {
    return (
      <TooltipProvider delayDuration={100}> {/* Optional: Add delay */}
        <div className="flex items-center gap-1"> {/* Use gap for spacing */}
            {/* Copy Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onCopyToClipboard}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Copy Chat</p>
                </TooltipContent>
            </Tooltip>

            {/* Print Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onPrint}>
                        <Printer className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Print Chat</p>
                </TooltipContent>
            </Tooltip>

            {/* Delete Button */}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onDeleteConversation}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Delete Chat</p>
                </TooltipContent>
            </Tooltip>
             {/* Add Save as PDF button (using print) if needed */}
            {/* <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onSaveAsPdf}>
                        <Save className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Save as PDF</p>
                </TooltipContent>
            </Tooltip> */}
        </div>
       </TooltipProvider>
    );
  }

  // Original Dropdown implementation
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onDeleteConversation}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete Chat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSaveAsPdf}> {/* Assuming Save triggers print */}
          <Printer className="h-4 w-4 mr-2" /> Save as PDF / Print
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyToClipboard}>
          <Copy className="h-4 w-4 mr-2" /> Copy Chat
        </DropdownMenuItem>
        {/* Keep print explicit if desired */}
        {/* <DropdownMenuItem onClick={onPrint}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatControls;
