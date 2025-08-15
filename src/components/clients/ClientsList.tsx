import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import { UnifiedDataTable, TableColumn, TableAction, AvatarCell, BadgeCell, ContactCell } from '@/components/ui/unified-data-table';
import { Client } from '@/features/clients/types';

interface ClientsListProps {
  clients: Client[];
  isLoading?: boolean;
  error?: string | null;
  onClientClick?: (client: Client) => void;
  onEditClient?: (client: Client) => void;
  onDeleteClient?: (client: Client) => void;
  isDeleting?: boolean;
}

export const ClientsList: React.FC<ClientsListProps> = ({
  clients,
  isLoading = false,
  error = null,
  onClientClick,
  onEditClient,
  onDeleteClient,
  isDeleting = false
}) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return 'N/A';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const columns: TableColumn<Client>[] = [
    {
      key: 'name',
      label: 'Client',
      render: (client) => (
        <AvatarCell
          src={client.avatarUrl || ''}
          alt={`${client.firstName} ${client.lastName}`}
          fallback={getInitials(client.firstName, client.lastName)}
          name={`${client.firstName} ${client.lastName}`}
          linkTo={onClientClick ? undefined : `/app/clients/${client.id}`}
        />
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (client) => (
        <ContactCell
          email={client.email}
          phone={client.phone}
        />
      )
    },
    {
      key: 'loanAmount',
      label: 'Loan Amount',
      className: 'text-right',
      render: (client) => (
        <div className="text-right">
          {formatCurrency(client.loanAmountSought)}
        </div>
      )
    },
    {
      key: 'loanType',
      label: 'Loan Type',
      render: (client) => client.loanType || '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (client) => (
        <BadgeCell
          value={client.status || 'Active'}
          variant={getStatusColor(client.status || 'active') as any}
        />
      )
    },
    {
      key: 'applicationStatus',
      label: 'Application',
      render: (client) => {
        if (!client.applicationStatus) return '-';
        const getAppStatusVariant = (status: string) => {
          switch (status.toLowerCase()) {
            case 'approved': return 'default';
            case 'denied': return 'destructive';
            case 'in review': return 'secondary';
            default: return 'outline';
          }
        };
        return (
          <BadgeCell
            value={client.applicationStatus}
            variant={getAppStatusVariant(client.applicationStatus) as any}
          />
        );
      }
    }
  ];

  const actions: TableAction<Client>[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: onClientClick || ((client) => window.location.href = `/app/clients/${client.id}`)
    },
    ...(onEditClient ? [{
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEditClient
    }] : []),
    ...(onDeleteClient ? [{
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDeleteClient,
      className: 'text-red-600',
      disabled: isDeleting
    }] : [])
  ];

  return (
    <UnifiedDataTable
      data={clients}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      error={error}
      emptyMessage="No clients found"
      emptyDescription="Try adjusting your filters or add your first client to get started."
      onRowClick={onClientClick}
      getRowId={(client) => client.id}
    />
  );
};

export default ClientsList;