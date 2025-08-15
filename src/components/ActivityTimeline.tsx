import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  ListFilter, 
  FileText, 
  Edit, 
  MessageSquare, 
  Activity as DefaultActivityIcon,
  Target,
  TrendingUp,
  DollarSign,
  User,
  Building2,
  UserCheck,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Activity } from '@/hooks/useActivities';

interface ActivityTimelineProps {
  activities: Activity[];
  loading?: boolean;
  title?: string;
  description?: string;
  showEntityFilter?: boolean;
}

const getActivityIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'note_added': return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'document_upload':
    case 'document_deleted': return <FileText className="h-4 w-4 text-green-500" />;
    case 'client_created':
    case 'client_updated': return <User className="h-4 w-4 text-orange-500" />;
    case 'person_created':
    case 'person_updated': return <UserCheck className="h-4 w-4 text-blue-500" />;
    case 'opportunity_created': return <Target className="h-4 w-4 text-green-500" />;
    case 'opportunity_updated': return <Edit className="h-4 w-4 text-blue-500" />;
    case 'opportunity_stage_changed': return <TrendingUp className="h-4 w-4 text-purple-500" />;
    case 'loan_created':
    case 'loan_updated': return <DollarSign className="h-4 w-4 text-green-600" />;
    case 'loan_status_changed': return <TrendingUp className="h-4 w-4 text-blue-600" />;
    case 'loan_deleted':
    case 'client_deleted':
    case 'person_deleted': return <Trash2 className="h-4 w-4 text-red-500" />;
    default: return <DefaultActivityIcon className="h-4 w-4 text-gray-500" />;
  }
};

const getEntityIcon = (entityType: string | null) => {
  switch (entityType) {
    case 'client': return <User className="h-3 w-3" />;
    case 'opportunity': return <Target className="h-3 w-3" />;
    case 'loan': return <DollarSign className="h-3 w-3" />;
    case 'person': return <UserCheck className="h-3 w-3" />;
    case 'lender': return <Building2 className="h-3 w-3" />;
    case 'realtor': return <Building2 className="h-3 w-3" />;
    default: return <DefaultActivityIcon className="h-3 w-3" />;
  }
};

const getEntityTypeFromActivity = (activity: Activity): string => {
  if (activity.client_id) return 'client';
  if (activity.loan_id) return 'loan';
  if (activity.opportunity_id) return 'opportunity';
  if (activity.people_id) return 'person';
  if (activity.lender_id) return 'lender';
  if (activity.realtor_id) return 'realtor';
  return 'unknown';
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  activities, 
  loading = false, 
  title = "Activity Timeline",
  description = "Recent activities and updates",
  showEntityFilter = true
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  const uniqueActivityTypes = useMemo(() => {
    return Array.from(new Set(activities.map(act => act.action_type).filter(Boolean)));
  }, [activities]);

  const uniqueEntityTypes = useMemo(() => {
    return Array.from(new Set(activities.map(act => getEntityTypeFromActivity(act))));
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const typeMatch = filterType === 'all' || activity.action_type === filterType;
      const entityType = getEntityTypeFromActivity(activity);
      const entityMatch = filterEntity === 'all' || entityType === filterEntity;
      return typeMatch && entityMatch;
    });
  }, [activities, filterType, filterEntity]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        
        {/* Filter Controls */}
        {(uniqueActivityTypes.length > 1 || uniqueEntityTypes.length > 1) && (
          <div className="flex items-center justify-between pt-4 space-x-4">
            <div className="flex items-center space-x-2">
              <ListFilter className="h-5 w-5 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  {uniqueActivityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {showEntityFilter && uniqueEntityTypes.length > 1 && (
              <div className="flex items-center space-x-2">
                <Select value={filterEntity} onValueChange={setFilterEntity}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by entity..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    {uniqueEntityTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}s
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="relative pl-6 space-y-6 border-l-2 border-border">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity, index) => {
              const formattedDate = format(new Date(activity.created_at), 'PPpp');
              const relativeDate = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });
              const entityType = getEntityTypeFromActivity(activity);
              
              return (
                <div key={activity.id} className="relative flex items-start space-x-3">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[1.30rem] top-1 flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 border-border">
                    <div className="h-3 w-3 rounded-full bg-primary"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium flex items-center">
                        {getActivityIcon(activity.action_type)}
                        <span className="ml-1.5">{activity.description || 'No description'}</span>
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap" title={formattedDate}>
                        {relativeDate}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      {/* Activity type badge */}
                      <span className="px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground">
                        {activity.action_type.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase())}
                      </span>
                      
                      {/* Entity badge */}
                      {activity.entity_name && (
                        <span className={`px-2 py-1 rounded-md text-xs flex items-center space-x-1 ${
                          entityType === 'client' ? 'bg-blue-100 text-blue-800' :
                          entityType === 'opportunity' ? 'bg-purple-100 text-purple-800' :
                          entityType === 'loan' ? 'bg-green-100 text-green-800' :
                          entityType === 'person' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getEntityIcon(entityType)}
                          <span>{activity.entity_name}</span>
                        </span>
                      )}
                    </div>
                    
                    {/* Separator */}
                    {index < filteredActivities.length - 1 && <div className="border-b my-4"></div>}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="relative flex items-start space-x-3 pl-6">
              <p className="text-center text-muted-foreground py-4">
                {activities.length === 0 
                  ? 'No activities found.' 
                  : 'No activities found matching the current filters.'
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;