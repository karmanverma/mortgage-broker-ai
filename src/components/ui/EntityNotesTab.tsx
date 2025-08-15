import React from 'react';
import { useImprovedNotes, EntityType } from '@/hooks/useImprovedNotes';
import NotesSection from '@/components/ui/NotesSection';

interface EntityNotesTabProps {
  entityType: EntityType;
  entityId: string;
  title: string;
  description: string;
}

const EntityNotesTab: React.FC<EntityNotesTabProps> = ({
  entityType,
  entityId,
  title,
  description,
}) => {
  const {
    notes,
    isLoading,
    isAdding,
    isDeleting,
    isUpdating,
    addNote,
    deleteNote,
    updateNote,
  } = useImprovedNotes({ entityType, entityId });

  const handleAddNote = (noteData: any) => {
    addNote({
      ...noteData,
      entity_type: entityType,
      entity_id: entityId,
    });
  };

  return (
    <NotesSection
      title={title}
      description={description}
      notes={notes}
      isLoading={isLoading}
      isAdding={isAdding}
      isDeleting={isDeleting}
      isUpdating={isUpdating}
      onAddNote={handleAddNote}
      onDeleteNote={deleteNote}
      onUpdateNote={updateNote}
    />
  );
};

export default EntityNotesTab;