import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DocumentStatus } from '@/features/documents/types';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending Review',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  approved: {
    label: 'Approved',
    variant: 'default' as const,
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  expired: {
    label: 'Expired',
    variant: 'outline' as const,
    icon: AlertTriangle,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  }
};

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} flex items-center gap-1`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};