// src/components/clients/tabs/NotesTab.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Save, Clock, UserCircle, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Database, Tables, TablesInsert } from '@/integrations/supabase/types';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define type aliases
type ClientNote = Tables<"client_notes">;
type NewNote = TablesInsert<"client_notes">;

interface NotesTabProps {
    data: {
        notes: ClientNote[];
        clientId: string;
        userId?: string; // Make userId optional as it comes from auth usually
    };
}

const NoteItem: React.FC<{ note: ClientNote, onDelete: (id: string) => void }> = ({ note, onDelete }) => {
    const formattedDate = format(new Date(note.created_at), 'PPpp');
    const relativeDate = formatDistanceToNow(new Date(note.created_at), { addSuffix: true });

    return (
        <div className="p-4 border rounded-md mb-3 relative group bg-background">
            <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span title={formattedDate}>{relativeDate}</span>
                    {/* TODO: Add user info display if needed (requires joining profiles or storing name) */} 
                    {/* <UserCircle className="h-3 w-3 ml-2" /> */}
                    {/* <span>{note.user_id}</span> */}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    onClick={() => onDelete(note.id)}
                    title="Delete Note"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

const NotesTab: React.FC<NotesTabProps> = ({ data }) => {
    const { notes: initialNotes, clientId, userId } = data;
    const supabase = useSupabaseClient<Database>();
    const { toast } = useToast();

    const [notes, setNotes] = useState<ClientNote[]>(initialNotes || []);
    const [newNoteContent, setNewNoteContent] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

     // Re-sync notes if the initial prop changes (e.g., parent re-fetches)
    useEffect(() => {
        setNotes(initialNotes || []);
    }, [initialNotes]);

    const handleSaveNote = async () => {
        if (!newNoteContent.trim()) {
            toast({ title: "Cannot save empty note", variant: "destructive" });
            return;
        }
        if (!userId) {
             toast({ title: "User not identified", description: "Cannot save note.", variant: "destructive" });
             return;
        }

        setIsSaving(true);
        setError(null);

        const noteToInsert: NewNote = {
            client_id: clientId,
            user_id: userId,
            content: newNoteContent.trim(),
        };

        const { data: savedNote, error: insertError } = await supabase
            .from('client_notes')
            .insert(noteToInsert)
            .select()
            .single();

        setIsSaving(false);

        if (insertError) {
            console.error("Error saving note:", insertError);
            setError(`Failed to save note: ${insertError.message}`);
            toast({ title: "Error saving note", description: insertError.message, variant: "destructive" });
        } else if (savedNote) {
            setNotes(prevNotes => [savedNote, ...prevNotes]); // Add new note to the top
            setNewNoteContent(''); // Clear the textarea
            toast({ title: "Note saved successfully" });
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        // Optimistic UI update
        const originalNotes = notes;
        setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));

        const { error: deleteError } = await supabase
            .from('client_notes')
            .delete()
            .match({ id: noteId });

        if (deleteError) {
            console.error("Error deleting note:", deleteError);
            toast({ title: "Error deleting note", description: deleteError.message, variant: "destructive" });
            // Revert UI update on failure
            setNotes(originalNotes);
        } else {
             toast({ title: "Note deleted" });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Client Notes</CardTitle>
                <CardDescription>Add and review notes specific to this client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add Note Section */} 
                <div className="space-y-2">
                    <Textarea
                        placeholder="Type your note here..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        rows={4}
                        disabled={isSaving}
                    />
                    {error && (
                         <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                         </Alert>
                    )}
                    <div className="flex justify-end">
                        <Button onClick={handleSaveNote} disabled={!newNoteContent.trim() || isSaving}>
                            {isSaving ? (
                                <LoadingSpinner size="sm" className="mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {isSaving ? 'Saving...' : 'Save Note'}
                        </Button>
                    </div>
                </div>

                {/* Existing Notes List */} 
                <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-md font-medium">Saved Notes</h4>
                    {notes && notes.length > 0 ? (
                        notes.map(note => (
                            <NoteItem key={note.id} note={note} onDelete={handleDeleteNote} />
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No notes added for this client yet.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default NotesTab;
