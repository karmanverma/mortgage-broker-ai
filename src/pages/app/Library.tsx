import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversations } from '@/hooks/useConversations';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertTriangle, List, MoreHorizontal, Plus, Umbrella } from 'lucide-react';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast'; // Import useToast

const LibraryPage: React.FC = () => {
  const { 
    conversations,
    loading: isLoadingList,
    error: listError,
    setActiveConversation, // Destructure setActiveConversation
    currentSessionId,
    startNewConversation, // Use startNewConversation
    // deleteConversation, // Destructure if delete functionality is needed here
  } = useConversations();
  
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize toast
  const [searchTerm, setSearchTerm] = useState('');

  const handleConversationSelect = (sessionId: string) => {
    setActiveConversation(sessionId); // Use setActiveConversation
    navigate('/app/ai-assistant');
  };

  const handleCreateNewThread = useCallback(async () => {
    try {
      // Use startNewConversation - it doesn't take arguments
      const newConv = await startNewConversation(); 
      if (newConv && newConv.session_id) {
        setActiveConversation(newConv.session_id); // Set the new conversation as active
        navigate('/app/ai-assistant');
      } else {
         toast({ variant: "destructive", title: "Error", description: "Could not start a new conversation session." });
      }
    } catch (err: any) {
      console.error("Failed to create new conversation:", err);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: err.message || "Failed to start a new conversation." 
      });
    }
  }, [startNewConversation, setActiveConversation, navigate, toast]); // Add dependencies

  const filteredConversations = conversations.filter(conv =>
    (conv.title || `Conversation ${conv.session_id.substring(0, 8)}...`).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.message || '').toLowerCase().includes(searchTerm.toLowerCase()) // Use 'message' for preview/search based on RPC result
  );

  // Sort conversations by the timestamp of the latest message (aliased as created_at)
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    // Use created_at as it holds the timestamp of the latest message per session
    const dateA = a.created_at ? parseISO(a.created_at) : null;
    const dateB = b.created_at ? parseISO(b.created_at) : null;

    if (dateA && isValid(dateA) && dateB && isValid(dateB)) {
      return dateB.getTime() - dateA.getTime();
    } else if (dateB && isValid(dateB)) {
      return 1; 
    } else if (dateA && isValid(dateA)) {
      return -1; 
    } else {
      return 0; 
    }
  });

  const renderContent = () => {
    if (isLoadingList) {
      return (
        <div className="space-y-4 px-4 md:px-0">
          {[...Array(5)].map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-5 w-3/5" />
                 <Skeleton className="h-6 w-6" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (listError) {
      return (
        <Alert variant="destructive" className="mx-4 md:mx-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {listError || 'Failed to load conversations.'}
          </AlertDescription>
        </Alert>
      );
    }

    if (sortedConversations.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
          <p className="text-gray-500 text-lg">No conversation threads found.</p>
          {searchTerm && <p className="text-gray-400 text-sm mt-1">Try adjusting your search term.</p>}
          {!searchTerm && <p className="text-gray-400 text-sm mt-1">Click the '+' button to start a new conversation.</p>}
        </div>
      );
    }

    return (
       <div className="space-y-4 px-4 md:px-0">
            {sortedConversations.map((conv) => {
              // Safely parse and validate the date using created_at
              const latestMessageDate = conv.created_at ? parseISO(conv.created_at) : null;
              const isValidDate = latestMessageDate && isValid(latestMessageDate);
              // Determine title - use RPC result directly if needed, or fallback
              const displayTitle = conv.title || `Conversation ${conv.session_id.substring(0, 8)}...`;
              // Use the latest message content as preview
              const messagePreview = conv.message;

              return (
                <Card
                  key={conv.session_id}
                  className={`cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out ${
                    conv.session_id === currentSessionId ? 'border-primary ring-1 ring-primary' : 'border-border'
                  }`}
                  onClick={() => handleConversationSelect(conv.session_id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-x-2">
                    <CardTitle className="text-base font-medium truncate flex-1" title={displayTitle}>
                      {displayTitle}
                    </CardTitle>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                             <MoreHorizontal className="h-4 w-4" />
                             <span className="sr-only">Thread options</span>
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => alert('Rename action (not implemented)')}>Rename</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => alert('Delete action (not implemented)')} className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </CardHeader>
                  <CardContent className="pt-1">
                     {/* Display the latest message as preview */}
                     {messagePreview && (
                       <p className="text-sm text-muted-foreground truncate mb-2" title={messagePreview}>{messagePreview}</p>
                     )}
                    <p className="text-xs text-gray-500">
                      {/* Conditionally render the formatted date */}
                      {isValidDate
                        ? formatDistanceToNow(latestMessageDate, { addSuffix: true })
                        : 'Processing date...' // Changed fallback text
                      }
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
    );
  };


  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center space-x-2">
           <Umbrella className="h-6 w-6 text-primary"/>
           <h1 className="text-xl font-semibold">Library</h1>
        </div>
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
          <Input
            type="search"
            placeholder="Search your threads..."
            className="w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

       {/* Navigation / Actions Section */}
       <div className="flex items-center justify-between p-4 border-b">
         <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
            <List className="h-4 w-4" />
            <span>Threads</span>
         </div>
         <div className="flex items-center space-x-2">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                     <MoreHorizontal className="h-4 w-4" />
                     <span className="sr-only">More options</span>
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end">
                 <DropdownMenuItem onClick={() => alert('Sort action (not implemented)')}>Sort Threads</DropdownMenuItem>
                 <DropdownMenuItem onClick={() => alert('Filter action (not implemented)')}>Filter Threads</DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCreateNewThread}>
              <Plus className="h-4 w-4" />
              <span className="sr-only">Create new thread</span>
            </Button>
         </div>
       </div>


      {/* Content List */}
      <ScrollArea className="flex-grow p-4 md:p-6 bg-muted/40">
        {renderContent()}
      </ScrollArea>
    </div>
  );
};

export default LibraryPage;
