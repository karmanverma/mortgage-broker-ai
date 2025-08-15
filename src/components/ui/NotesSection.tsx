import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Save, Clock, Trash2, Pin, PinOff } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Note, NewNote } from '@/hooks/useImprovedNotes';

interface NoteItemProps {
  note: Note;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<NewNote>) => void;
  isDeleting: boolean;
  isUpdating: boolean;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDelete, onUpdate, isDeleting, isUpdating }) => {
  const formattedDate = format(new Date(note.created_at), 'PPpp');
  const relativeDate = formatDistanceToNow(new Date(note.created_at), { addSuffix: true });

  const togglePin = () => {
    onUpdate(note.id, { is_pinned: !note.is_pinned });
  };

  return (
    <div className={`p-4 border rounded-md mb-3 relative group bg-background ${
      note.is_pinned ? 'border-yellow-300 bg-yellow-50/50' : ''
    }`}>
      {note.title && (
        <h4 className="font-medium text-sm mb-2">{note.title}</h4>
      )}
      <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
      {note.category && (
        <span className="inline-block mt-2 px-2 py-1 text-xs bg-secondary rounded-md">
          {note.category}
        </span>
      )}
      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span title={formattedDate}>{relativeDate}</span>
        </div>
        <div className="flex items-center space-x-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={togglePin}
            disabled={isUpdating}
            title={note.is_pinned ? "Unpin Note" : "Pin Note"}
          >
            {note.is_pinned ? (
              <PinOff className="h-4 w-4 text-yellow-600" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete(note.id)}
            disabled={isDeleting}
            title="Delete Note"
          >
            {isDeleting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface NotesSectionProps {
  title: string;
  description: string;
  notes: Note[];
  isLoading: boolean;
  isAdding: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  onAddNote: (noteData: NewNote) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (noteId: string, updates: Partial<NewNote>) => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  title,
  description,
  notes,
  isLoading,
  isAdding,
  isDeleting,
  isUpdating,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
}) => {
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [newNoteCategory, setNewNoteCategory] = useState<string>('');

  const handleSaveNote = () => {
    if (!newNoteContent.trim()) {
      return;
    }
    
    onAddNote({
      title: newNoteTitle.trim() || undefined,
      content: newNoteContent.trim(),
      category: newNoteCategory.trim() || undefined,
    });
    
    // Clear form
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteCategory('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Section */} 
        <div className="space-y-2">
          <Input
            placeholder="Note title (optional)"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            disabled={isAdding}
          />
          <Input
            placeholder="Category (optional)"
            value={newNoteCategory}
            onChange={(e) => setNewNoteCategory(e.target.value)}
            disabled={isAdding}
          />
          <Textarea
            placeholder="Type your note here..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            rows={4}
            disabled={isAdding}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveNote} 
              disabled={!newNoteContent.trim() || isAdding}
            >
              {isAdding ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isAdding ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </div>

        {/* Existing Notes List */} 
        <div className="space-y-3 pt-4 border-t">
          <h4 className="text-md font-medium">Saved Notes</h4>
          {notes && notes.length > 0 ? (
            notes.map(note => (
              <NoteItem 
                key={note.id} 
                note={note} 
                onDelete={onDeleteNote}
                onUpdate={onUpdateNote}
                isDeleting={isDeleting}
                isUpdating={isUpdating}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes added yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotesSection;