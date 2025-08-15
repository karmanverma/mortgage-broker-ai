import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useImprovedNotes, EntityType, NewNote } from '@/hooks/useImprovedNotes';
import { Search, Plus, Filter, Pin, Clock, Trash2, PinOff } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const NotesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | ''>('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [newNote, setNewNote] = useState<NewNote>({
    title: '',
    content: '',
    category: '',
    entity_type: undefined,
    entity_id: undefined,
  });

  const filters = {
    search: searchTerm || undefined,
    category: selectedCategory && selectedCategory !== 'all' ? selectedCategory : undefined,
    entityType: selectedEntityType && selectedEntityType !== 'all' ? selectedEntityType : undefined,
    pinnedOnly: showPinnedOnly || undefined,
  };

  const {
    notes,
    isLoading,
    isAdding,
    isDeleting,
    isUpdating,
    addNote,
    deleteNote,
    updateNote,
  } = useImprovedNotes(filters);

  const handleAddNote = () => {
    if (!newNote.content.trim()) return;
    
    addNote({
      ...newNote,
      title: newNote.title?.trim() || undefined,
      content: newNote.content.trim(),
      category: newNote.category?.trim() || undefined,
      entity_type: newNote.entity_type || undefined,
      entity_id: newNote.entity_id && newNote.entity_id.trim() ? newNote.entity_id.trim() : undefined,
    });
    
    // Reset form
    setNewNote({
      title: '',
      content: '',
      category: '',
      entity_type: undefined,
      entity_id: undefined,
    });
    setShowAddForm(false);
  };

  const togglePin = (noteId: string, isPinned: boolean) => {
    updateNote(noteId, { is_pinned: !isPinned });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Manage all your notes in one place</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="important">Important</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="research">Research</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedEntityType} onValueChange={(value) => setSelectedEntityType(value as EntityType | '')}>
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="lender">Lenders</SelectItem>
                <SelectItem value="realtor">Realtors</SelectItem>
                <SelectItem value="opportunity">Opportunities</SelectItem>
                <SelectItem value="loan">Loans</SelectItem>
                <SelectItem value="person">People</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showPinnedOnly ? "default" : "outline"}
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            >
              <Pin className="h-4 w-4 mr-2" />
              Pinned Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Note Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Note title (optional)"
              value={newNote.title || ''}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Category (optional)"
                value={newNote.category || ''}
                onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
              />
              <Select 
                value={newNote.entity_type || 'standalone'} 
                onValueChange={(value) => setNewNote({ ...newNote, entity_type: value === 'standalone' ? undefined : value as EntityType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to entity (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standalone">Standalone Note</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="lender">Lender</SelectItem>
                  <SelectItem value="realtor">Realtor</SelectItem>
                  <SelectItem value="opportunity">Opportunity</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newNote.entity_type && (
              <Input
                placeholder="Entity ID (UUID)"
                value={newNote.entity_id || ''}
                onChange={(e) => setNewNote({ ...newNote, entity_id: e.target.value || undefined })}
                className="font-mono text-sm"
              />
            )}
            <Textarea
              placeholder="Note content..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={!newNote.content.trim() || isAdding}>
                {isAdding ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Add Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No notes found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className={note.is_pinned ? 'border-yellow-300 bg-yellow-50/50' : ''}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {note.title && (
                      <h3 className="font-semibold text-lg mb-2">{note.title}</h3>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words mb-3">{note.content}</p>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      {note.category && (
                        <Badge variant="secondary">{note.category}</Badge>
                      )}
                      {note.entity_type && (
                        <Badge variant="outline">
                          {note.entity_type}
                        </Badge>
                      )}
                      {note.is_pinned && (
                        <Badge variant="default" className="bg-yellow-500">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span title={format(new Date(note.created_at), 'PPpp')}>
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePin(note.id, note.is_pinned)}
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
                      onClick={() => deleteNote(note.id)}
                      disabled={isDeleting}
                      className="text-destructive hover:text-destructive"
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesPage;