import React from 'react';
import EntityNotesTab from '@/components/ui/EntityNotesTab';

interface NotesTabProps {
    data: {
        clientId: string;
    };
}

const NotesTab: React.FC<NotesTabProps> = ({ data }) => {
    const { clientId } = data;
    
    return (
        <EntityNotesTab
            entityType="client"
            entityId={clientId}
            title="Client Notes"
            description="Add and review notes specific to this client."
        />
    );
};

export default NotesTab;
