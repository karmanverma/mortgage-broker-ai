import React from 'react';
import ActivityTimeline from '@/components/ActivityTimeline';
import { useLoanActivities } from '@/hooks/useActivities';

interface LoanActivityTimelineProps {
  loanId: string;
}

const LoanActivityTimeline: React.FC<LoanActivityTimelineProps> = ({ loanId }) => {
  const { data: activities = [], isLoading } = useLoanActivities(loanId);

  return (
    <ActivityTimeline
      activities={activities}
      loading={isLoading}
      title="Loan Activity Timeline"
      description="All activities for this loan"
      showEntityFilter={false}
    />
  );
};

export default LoanActivityTimeline;