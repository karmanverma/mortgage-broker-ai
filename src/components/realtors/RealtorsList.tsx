import React from 'react';
import { Edit, Trash2, Mail, Phone, MapPin, Star } from 'lucide-react';
import { UnifiedDataTable, TableColumn, TableAction, AvatarCell, BadgeCell, ContactCell } from '@/components/ui/unified-data-table';
import { Badge } from '@/components/ui/badge';
import { Realtor } from '@/hooks/useImprovedRealtors';

interface RealtorsListProps {
  realtors: Realtor[];
  isLoading?: boolean;
  error?: string | null;
  onRealtorClick?: (realtor: Realtor) => void;
  onEditRealtor?: (realtor: Realtor) => void;
  onDeleteRealtor?: (realtor: Realtor) => void;
  isDeleting?: boolean;
}

export const RealtorsList: React.FC<RealtorsListProps> = ({
  realtors,
  isLoading = false,
  error = null,
  onRealtorClick,
  onEditRealtor,
  onDeleteRealtor,
  isDeleting = false
}) => {
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const renderStars = (rating?: number | null) => {
    if (!rating) return <span className="text-muted-foreground">-</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating}/10)</span>
      </div>
    );
  };

  const columns: TableColumn<Realtor>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (realtor) => (
        <AvatarCell
          src=""
          alt={`${realtor.people?.first_name} ${realtor.people?.last_name}`}
          fallback={getInitials(realtor.people?.first_name, realtor.people?.last_name)}
          name={`${realtor.people?.first_name || ''} ${realtor.people?.last_name || ''}`.trim()}
          subtitle={realtor.brokerage_name || 'Independent'}
          linkTo={`/app/realtors/${realtor.id}`}
        />
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (realtor) => (
        <BadgeCell
          value={realtor.active_status ? 'Active' : 'Inactive'}
          variant={realtor.active_status ? 'default' : 'secondary'}
        />
      )
    },
    {
      key: 'license',
      label: 'License',
      render: (realtor) => (
        <div className="space-y-1">
          {realtor.license_number && (
            <div className="text-sm font-mono">{realtor.license_number}</div>
          )}
          {realtor.license_state && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              {realtor.license_state}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (realtor) => (
        <ContactCell
          email={realtor.people?.email_primary}
          phone={realtor.people?.phone_primary}
        />
      )
    },
    {
      key: 'performance',
      label: 'Performance',
      render: (realtor) => renderStars(realtor.performance_rating)
    },
    {
      key: 'stats',
      label: 'Stats',
      render: (realtor) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">{realtor.total_referrals_sent || 0}</span>
            <span className="text-muted-foreground ml-1">referrals</span>
          </div>
          <div className="text-sm">
            <span className="font-medium">{realtor.total_deals_closed || 0}</span>
            <span className="text-muted-foreground ml-1">deals</span>
          </div>
        </div>
      )
    },
    {
      key: 'specialties',
      label: 'Specialties',
      render: (realtor) => (
        <div className="flex flex-wrap gap-1">
          {realtor.specialty_areas?.slice(0, 2).map((specialty, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {(realtor.specialty_areas?.length || 0) > 2 && (
            <Badge variant="outline" className="text-xs">
              +{(realtor.specialty_areas?.length || 0) - 2}
            </Badge>
          )}
          {(!realtor.specialty_areas || realtor.specialty_areas.length === 0) && (
            <span className="text-xs text-muted-foreground">No specialties</span>
          )}
        </div>
      )
    },
    {
      key: 'experience',
      label: 'Experience',
      render: (realtor) => (
        <div className="text-sm">
          {realtor.years_experience ? (
            <span>{realtor.years_experience} years</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      )
    }
  ];

  const actions: TableAction<Realtor>[] = [
    ...(onEditRealtor ? [{
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: onEditRealtor
    }] : []),
    ...(onDeleteRealtor ? [{
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDeleteRealtor,
      className: 'text-red-600',
      disabled: isDeleting
    }] : [])
  ];

  return (
    <UnifiedDataTable
      data={realtors}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      error={error}
      emptyMessage="No realtors found"
      emptyDescription="Try adjusting your filters or add your first realtor to get started."
      onRowClick={onRealtorClick}
      getRowId={(realtor) => realtor.id}
    />
  );
};

export default RealtorsList;