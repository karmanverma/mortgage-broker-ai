import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, Trash2, AlertCircle } from 'lucide-react';
import { Conversation } from '@/hooks/useConversations.types'; // Import Conversation type (now represents unique session)
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// Removed useToast - errors/success handled by parent via hook

interface ConversationSidebarProps {
  // Expect a list of unique conversations (e.g., based on session_id)
  conversations: Conversation[]; // Should be the unique list from the hook
  loading: boolean;
  error: string | null;
  onSelectConversation: (sessionId: string | null) => void; // Changed to sessionId
  selectedConversationId: string | null; // Changed to selectedConversationSessionId?
  onStartNewConversation: () => void; // Callback to trigger new conversation in parent
  onDeleteConversation: (sessionId: string) => Promise<void>; // Adjusted to reflect async nature if needed, though hook handles it
  className?: string;
}

export function ConversationSidebar({
  conversations,
  loading,
  error,
  onSelectConversation,
  selectedConversationId, // Should match the session_id being selected
  onStartNewConversation,
  onDeleteConversation,
  className,
}: ConversationSidebarProps) {

  // State for delete confirmation dialog is local to the sidebar
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // Still track local delete UI state

  // Call the prop function passed from the parent
  const handleStartNewConversation = () => {
     console.log("Sidebar: Requesting new conversation...");
     onStartNewConversation();
  };

  // Trigger delete confirmation dialog
  const handleDeleteClick = (conversation: Conversation, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent selecting the conversation when clicking delete
    setConversationToDelete(conversation);
  };

  // Confirm and call the prop function for deletion
  const handleConfirmDelete = async () => {
    if (!conversationToDelete || !conversationToDelete.session_id) return;

    const sessionIdToDelete = conversationToDelete.session_id;
    setIsDeleting(true);
    try {
      // Call the parent's delete function (provided via props)
      await onDeleteConversation(sessionIdToDelete);
      // The parent hook (useConversations) now handles all state updates
      // and showing success/error toasts. No need for extra logic here.
      console.log(`Sidebar: Delete requested for session ${sessionIdToDelete} processed.`);
       // --- REMOVED the block that manually called onSelectConversation(null) ---
    } catch (err) {
      // Errors are handled and toasted by the useConversations hook.
      // Log here just for debugging if needed.
      console.error("Sidebar: Error during delete confirmation (should be handled by hook):", err);
    } finally {
      setIsDeleting(false);
      setConversationToDelete(null); // Close the dialog
    }
  };


  return (
    // MODIFIED: Added bg-background and removed dark mode classes
    <div className={cn("h-full flex flex-col border-r bg-background", className)}>
      {/* MODIFIED: Removed heading, updated button style and container */}
      <div className="p-4 border-b">
        <Button variant="outline" className="w-full" onClick={handleStartNewConversation} title="Start New Conversation">
          <PlusCircle className="h-5 w-5 mr-2" /> {/* Added margin */}
          New Chat {/* Added text */}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading && <p className="p-2 text-sm text-muted-foreground">Loading...</p>}
          {error && (
             <div className="p-2 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {/* Display the error passed from parent */}
                <span>{error || "Error loading chats"}</span>
             </div>
           )}
          {!loading && !error && conversations.map((conv) => {
             // Use session_id as the key and for selection/identification
             const convSessionId = conv.session_id;
             // Generate a display title (e.g., from date)
             const displayTitle = `Chat from ${new Date(conv.created_at).toLocaleDateString()}`;
             return (
              <div
                key={convSessionId} // Use session_id for the key
                onClick={() => onSelectConversation(convSessionId)} // Pass session_id
                className={cn(
                  // MODIFIED: Adjusted hover/selected background for white bg
                  "flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer group",
                  selectedConversationId === convSessionId ? "bg-gray-100 font-medium" : ""
                )}
              >
                <div className="flex items-center space-x-2 overflow-hidden">
                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                    {/* Display generated title or fallback */}
                    <span className="text-sm truncate">{displayTitle || `Conversation ${convSessionId.substring(0, 6)}`}</span>
                </div>

                {/* --- AlertDialog Trigger for Delete --- */}
                {/* Use AlertDialog based on the state `conversationToDelete` */}
                <AlertDialog open={conversationToDelete?.session_id === convSessionId} onOpenChange={(open) => !open && setConversationToDelete(null)}>
                   <AlertDialogTrigger asChild>
                       <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteClick(conv, e)}
                          title="Delete Conversation"
                       >
                          <Trash2 className="h-4 w-4" />
                       </Button>
                   </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                       <AlertDialogDescription>
                         This action cannot be undone. This will permanently delete this conversation session.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel onClick={() => setConversationToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                       <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                         {isDeleting ? "Deleting..." : "Delete"}
                       </AlertDialogAction>
                     </AlertDialogFooter>
                   </AlertDialogContent>
                 </AlertDialog>
                {/* --- End AlertDialog --- */}
              </div>
             );
          })}
           {!loading && !error && conversations.length === 0 && (
              <p className="p-2 text-sm text-muted-foreground text-center">No conversations yet.</p>
           )}
        </div>
      </ScrollArea>
    </div>
  );
}
