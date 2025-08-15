import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Mail, Phone } from 'lucide-react';
import { UnifiedDataTable, TableColumn, TableAction, AvatarCell, BadgeCell, ContactCell, TagsCell } from '@/components/ui/unified-data-table';
import { Badge } from '@/components/ui/badge';
import { Person, getContactTypeDisplayName, getContactTypeColor, formatPersonName } from '@/features/people/types';

interface PeopleListUnifiedProps {
  people: Person[];
  isLoading?: boolean;
  error?: string | null;
  onPersonClick?: (person: Person) => void;
  onEditPerson?: (person: Person) => void;
  onDeletePerson?: (person: Person) => void;
  isDeleting?: boolean;
  getPersonEntityAssociations?: (personId: string) => string[];
}

export const PeopleListUnified: React.FC<PeopleListUnifiedProps> = ({
  people,
  isLoading = false,
  error = null,
  onPersonClick,
  onEditPerson,
  onDeletePerson,
  isDeleting = false,
  getPersonEntityAssociations = () => []
}) => {
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const columns: TableColumn<Person>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (person) => (
        <AvatarCell
          src=""
          alt={formatPersonName(person)}
          fallback={getInitials(person.first_name, person.last_name)}
          name={formatPersonName(person)}
          subtitle={person.title_position}
          linkTo={onPersonClick ? undefined : `/app/people/${person.id}`}
        />
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (person) => (
        <BadgeCell
          value={getContactTypeDisplayName(person.contact_type as any)}
          className={getContactTypeColor(person.contact_type as any)}
        />
      )
    },
    {
      key: 'entities',
      label: 'Entities',
      render: (person) => {
        const associations = getPersonEntityAssociations(person.id);
        return (
          <div className="flex flex-wrap gap-1">
            {associations.map((entity) => (
              <Badge key={entity} variant="outline" className="text-xs">
                {entity.charAt(0).toUpperCase() + entity.slice(1)}
              </Badge>
            ))}
            {associations.length === 0 && (
              <span className="text-xs text-muted-foreground">No entities</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'company',
      label: 'Company',
      render: (person) => person.company_name || '-'
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (person) => (
        <ContactCell
          email={person.email_primary}
          phone={person.phone_primary}
        />
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (person) => (
        <BadgeCell
          value={person.status?.charAt(0).toUpperCase() + person.status?.slice(1) || 'Active'}
          variant={person.status === 'active' ? 'default' : 'secondary'}
        />
      )
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (person) => (
        <TagsCell tags={person.tags} maxVisible={2} />
      )
    }
  ];

  const actions: TableAction<Person>[] = [
    ...(onEditPerson ? [{
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEditPerson
    }] : []),
    ...(onDeletePerson ? [{
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDeletePerson,
      className: 'text-red-600',
      disabled: isDeleting
    }] : [])
  ];

  return (
    <UnifiedDataTable
      data={people}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      error={error}
      emptyMessage="No people found"
      emptyDescription="Try adjusting your filters or add your first person to get started."
      onRowClick={onPersonClick}
      getRowId={(person) => person.id}
    />
  );
};

export default PeopleListUnified;