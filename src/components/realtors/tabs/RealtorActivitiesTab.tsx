import React from 'react';
import { Activity, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtorActivities } from '@/hooks/useActivities';

interface RealtorActivitiesTabProps {
  realtorId: string;
}

export const RealtorActivitiesTab: React.FC<RealtorActivitiesTabProps> = ({ realtorId }) => {
  const { data: activities, isLoading, error } = useRealtorActivities(realtorId);

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'realtor_added':
      case 'realtor_updated':
      case 'realtor_deleted':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (actionType: string) => {
    switch (actionType) {
      case 'realtor_added':
        return 'bg-green-100 text-green-800';
      case 'realtor_updated':
        return 'bg-blue-100 text-blue-800';
      case 'realtor_deleted':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
    return <div className="p-4">Loading activities...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error loading activities: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        <h3 className="text-lg font-medium">Activity Log</h3>
      </div>

      {!activities || activities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No activities recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={`text-xs ${getActivityColor(activity.action_type)}`}>
                        {activity.action_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(activity.created_at)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    {activity.entity_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Related to: {activity.entity_name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};