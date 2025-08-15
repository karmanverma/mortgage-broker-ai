import React, { useState } from 'react';
import { Plus, Edit, Trash2, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useImprovedNotes } from '@/hooks/useImprovedNotes';

interface RealtorNotesTabProps {
  realtorId: string;
}

export const RealtorNotesTab: React.FC<RealtorNotesTabProps> = ({ realtorId }) => {
  const { notes, addNote, updateNote, deleteNote, isLoading, isAdding, isUpdating, isDeleting } = useImprovedNotes({
    entityType: 'realtor',
    entityId: realtorId
  });
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    is_pinned: false,
    tags: [] as string[]
  });

  const handleAddNote = () => {
    if (!formData.content.trim()) return;
    
    addNote({
      title: formData.title || undefined,
      content: formData.content,
      category: formData.category || undefined,
      entity_type: 'realtor',
      entity_id: realtorId,
      is_pinned: formData.is_pinned,
      tags: formData.tags
    });
    
    setFormData({ title: '', content: '', category: '', is_pinned: false, tags: [] });
    setShowAddDialog(false);
  };

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content,
        category: note.category || '',
        is_pinned: note.is_pinned,
        tags: note.tags || []
      });
      setEditingNote(noteId);
      setShowAddDialog(true);
    }
  };

  const handleUpdateNote = () => {
    if (!editingNote || !formData.content.trim()) return;
    
    updateNote(editingNote, {
      title: formData.title || undefined,
      content: formData.content,
      category: formData.category || undefined,
      is_pinned: formData.is_pinned,
      tags: formData.tags
    });
    
    setFormData({ title: '', content: '', category: '', is_pinned: false, tags: [] });
    setEditingNote(null);
    setShowAddDialog(false);
  };

  const togglePin = (noteId: string, currentPinned: boolean) => {
    updateNote(noteId, { is_pinned: !currentPinned });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <div className="p-4">Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Notes</h3>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      <div className="space-y-4">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No notes yet. Add your first note to get started.</p>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id} className={note.is_pinned ? 'border-yellow-200 bg-yellow-50' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    {note.title && (
                      <CardTitle className="text-base">{note.title}</CardTitle>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(note.created_at)}</span>
                      {note.category && (
                        <Badge variant="outline" className="text-xs">
                          {note.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePin(note.id, note.is_pinned)}
                    >
                      {note.is_pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title (optional)</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Note title..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your note..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category (optional)</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Meeting, Follow-up, Important"
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={editingNote ? handleUpdateNote : handleAddNote}
                disabled={isAdding || isUpdating || !formData.content.trim()}
              >
                {editingNote ? 'Update' : 'Add'} Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};