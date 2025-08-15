import React from 'react';
import { Edit, Trash2, Target, Calendar, DollarSign, MapPin } from 'lucide-react';
import { UnifiedDataTable, TableColumn, TableAction, AvatarCell, BadgeCell } from '@/components/ui/unified-data-table';
import { Badge } from '@/components/ui/badge';
import { Opportunity } from '@/hooks/useImprovedOpportunities';

interface OpportunitiesListProps {
  opportunities: Opportunity[];
  isLoading?: boolean;
  error?: string | null;
  onOpportunityClick?: (opportunity: Opportunity) => void;
  onEditOpportunity?: (opportunity: Opportunity) => void;
  onDeleteOpportunity?: (opportunity: Opportunity) => void;
  isDeleting?: boolean;
}

export const OpportunitiesList: React.FC<OpportunitiesListProps> = ({
  opportunities,
  isLoading = false,
  error = null,
  onOpportunityClick,
  onEditOpportunity,
  onDeleteOpportunity,
  isDeleting = false
}) => {
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const stageLabels = {
    inquiry: 'New Lead',
    contacted: 'Contacted',
    qualified: 'Qualified',
    nurturing: 'Nurturing',
    ready_to_apply: 'Ready to Apply',
    converted: 'Converted',
    lost: 'Lost',
  };

  const getStageVariant = (stage: string) => {
    switch (stage) {
      case 'inquiry': return 'secondary';
      case 'contacted': return 'outline';
      case 'qualified': return 'default';
      case 'nurturing': return 'secondary';
      case 'ready_to_apply': return 'default';
      case 'converted': return 'default';
      case 'lost': return 'destructive';
      default: return 'outline';
    }
  };

  const getUrgencyVariant = (urgency?: string) => {
    switch (urgency) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const columns: TableColumn<Opportunity>[] = [
    {
      key: 'person',
      label: 'Contact',
      render: (opportunity) => (
        <AvatarCell
          src=""
          alt={`${opportunity.people?.first_name} ${opportunity.people?.last_name}`}
          fallback={getInitials(opportunity.people?.first_name, opportunity.people?.last_name)}
          name={`${opportunity.people?.first_name || ''} ${opportunity.people?.last_name || ''}`.trim() || 'Unknown'}
          subtitle={opportunity.people?.email_primary}
        />
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (opportunity) => (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">
            {opportunity.opportunity_type?.replace('_', ' ') || '-'}
          </span>
        </div>
      )
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (opportunity) => (
        <BadgeCell
          value={stageLabels[opportunity.stage as keyof typeof stageLabels] || opportunity.stage}
          variant={getStageVariant(opportunity.stage) as any}
        />
      )
    },
    {
      key: 'amount',
      label: 'Est. Amount',
      className: 'text-right',
      render: (opportunity) => (
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span>{formatCurrency(opportunity.estimated_loan_amount)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'property',
      label: 'Property',
      render: (opportunity) => (
        <div className="flex items-center gap-2 max-w-[200px]">
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-sm">
            {opportunity.property_address || '-'}
          </span>
        </div>
      )
    },
    {
      key: 'closeDate',
      label: 'Expected Close',
      render: (opportunity) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {formatDate(opportunity.expected_close_date)}
          </span>
        </div>
      )
    },
    {
      key: 'urgency',
      label: 'Urgency',
      render: (opportunity) => {
        if (!opportunity.urgency_level) return '-';
        return (
          <BadgeCell
            value={opportunity.urgency_level}
            variant={getUrgencyVariant(opportunity.urgency_level) as any}
            className="capitalize"
          />
        );
      }
    }
  ];

  const actions: TableAction<Opportunity>[] = [
    ...(onEditOpportunity ? [{
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEditOpportunity
    }] : []),
    ...(onDeleteOpportunity ? [{
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDeleteOpportunity,
      className: 'text-red-600',
      disabled: isDeleting
    }] : [])
  ];

  return (
    <UnifiedDataTable
      data={opportunities}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      error={error}
      emptyMessage="No opportunities found"
      emptyDescription="Try adjusting your filters or add your first opportunity to get started."
      onRowClick={onOpportunityClick}
      getRowId={(opportunity) => opportunity.id}
    />
  );
};

export default OpportunitiesList;