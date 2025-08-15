import React from 'react';
import ActivityTimeline from '@/components/ActivityTimeline';
import { useClientActivities } from '@/hooks/useActivities';

interface ActivityLogTabProps {
  clientId: string;
}

const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ clientId }) => {
  const { data: activities = [], isLoading } = useClientActivities(clientId);

  return (
    <ActivityTimeline
      activities={activities}
      loading={isLoading}
      title="Activity Log"
      description="All activities for this client"
      showEntityFilter={false}
    />
  );
};

export default ActivityLogTab;