import React from 'react';
import { Edit, Trash2, FileText, Users } from 'lucide-react';
import { UnifiedDataTable, TableColumn, TableAction, AvatarCell, BadgeCell, ContactCell } from '@/components/ui/unified-data-table';
import { Badge } from '@/components/ui/badge';
import { Lender } from '@/hooks/useImprovedLenders';

interface LendersListUnifiedProps {
  lenders: Lender[];
  isLoading?: boolean;
  error?: string | null;
  onLenderClick?: (lender: Lender) => void;
  onEditLender?: (lender: Lender) => void;
  onDeleteLender?: (lender: Lender) => void;
  onManageDocuments?: (lender: Lender) => void;
  onManagePeople?: (lender: Lender) => void;
  isDeleting?: boolean;
}

export const LendersListUnified: React.FC<LendersListUnifiedProps> = ({
  lenders,
  isLoading = false,
  error = null,
  onLenderClick,
  onEditLender,
  onDeleteLender,
  onManageDocuments,
  onManagePeople,
  isDeleting = false
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'outline';
      default: return 'default';
    }
  };

  const columns: TableColumn<Lender>[] = [
    {
      key: 'name',
      label: 'Lender Name',
      render: (lender) => (
        <AvatarCell
          src=""
          alt={lender.name}
          fallback={getInitials(lender.name)}
          name={lender.name}
          subtitle={lender.type}
        />
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (lender) => (
        <BadgeCell
          value={lender.type || 'Unknown'}
          variant="outline"
        />
      )
    },
    {
      key: 'contact',
      label: 'Contact Person',
      render: (lender) => {
        const primaryPerson = lender.people?.find(p => p.is_primary);
        if (!primaryPerson) return <span className="text-muted-foreground">No contact</span>;
        
        return (
          <div>
            <div className="font-medium">
              {primaryPerson.first_name} {primaryPerson.last_name}
            </div>
            {primaryPerson.title_position && (
              <div className="text-sm text-muted-foreground">{primaryPerson.title_position}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'contactInfo',
      label: 'Contact Info',
      render: (lender) => {
        const primaryPerson = lender.people?.find(p => p.is_primary);
        return (
          <ContactCell
            email={primaryPerson?.email_primary}
            phone={primaryPerson?.phone_primary}
          />
        );
      }
    },
    {
      key: 'status',
      label: 'Status',
      render: (lender) => (
        <BadgeCell
          value={lender.status || 'Active'}
          variant={getStatusColor(lender.status) as any}
        />
      )
    },
    {
      key: 'documents',
      label: 'Documents',
      render: (lender) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{lender.document_count || 0}</span>
        </div>
      )
    },
    {
      key: 'people',
      label: 'People',
      render: (lender) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{lender.people?.length || 0}</span>
        </div>
      )
    }
  ];

  const actions: TableAction<Lender>[] = [
    ...(onEditLender ? [{
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEditLender
    }] : []),
    ...(onManageDocuments ? [{
      label: 'Manage Documents',
      icon: <FileText className="h-4 w-4" />,
      onClick: onManageDocuments
    }] : []),
    ...(onManagePeople ? [{
      label: 'Manage People',
      icon: <Users className="h-4 w-4" />,
      onClick: onManagePeople
    }] : []),
    ...(onDeleteLender ? [{
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDeleteLender,
      className: 'text-red-600',
      disabled: isDeleting
    }] : [])
  ];

  return (
    <UnifiedDataTable
      data={lenders}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      error={error}
      emptyMessage="No lenders found"
      emptyDescription="Try adjusting your filters or add your first lender to get started."
      onRowClick={onLenderClick}
      getRowId={(lender) => lender.id}
    />
  );
};

export default LendersListUnified;