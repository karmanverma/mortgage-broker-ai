import React from 'react';
import ActivityTimeline from '@/components/ActivityTimeline';
import { useOpportunityActivities } from '@/hooks/useActivities';

interface OpportunityActivityTimelineProps {
  opportunityId: string;
}

const OpportunityActivityTimeline: React.FC<OpportunityActivityTimelineProps> = ({ opportunityId }) => {
  const { data: activities = [], isLoading } = useOpportunityActivities(opportunityId);

  return (
    <ActivityTimeline
      activities={activities}
      loading={isLoading}
      title="Opportunity Activity Timeline"
      description="All activities for this opportunity"
      showEntityFilter={false}
    />
  );
};

export default OpportunityActivityTimeline;