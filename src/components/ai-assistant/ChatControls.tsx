
import { MoreHorizontal, Trash2, Save, Copy, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ChatControlsProps {
  sessionId: string | null;
  onDeleteConversation: () => Promise<void>;
  onSaveAsPdf: () => void;
  onCopyToClipboard: () => void;
  onPrint: () => void;
}

const ChatControls = ({
  sessionId,
  onDeleteConversation,
  onSaveAsPdf,
  onCopyToClipboard,
  onPrint,
}: ChatControlsProps) => {
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
        <DropdownMenuItem onClick={onSaveAsPdf}>
          <Save className="h-4 w-4 mr-2" /> Save as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyToClipboard}>
          <Copy className="h-4 w-4 mr-2" /> Copy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPrint}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatControls;
