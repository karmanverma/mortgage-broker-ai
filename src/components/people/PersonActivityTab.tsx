import React from 'react';
import ActivityTimeline from '@/components/ActivityTimeline';
import { usePersonActivities } from '@/hooks/useActivities';

interface PersonActivityTabProps {
  personId: string;
}

const PersonActivityTab: React.FC<PersonActivityTabProps> = ({ personId }) => {
  const { data: activities = [], isLoading } = usePersonActivities(personId);

  return (
    <ActivityTimeline
      activities={activities}
      loading={isLoading}
      title="Activity Timeline"
      description="All activities across clients, opportunities, and loans associated with this person."
      showEntityFilter={true}
    />
  );
};

export default PersonActivityTab;