import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Target } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useImprovedOpportunities } from '@/hooks/useImprovedOpportunities';
import { Opportunity } from '@/hooks/useImprovedOpportunities';
import { AddOpportunityDialog } from '@/components/opportunities/AddOpportunityDialog';
import { OpportunityKanbanBoard } from '@/components/opportunities/kanban/OpportunityKanbanBoard';
import OpportunitiesList from '@/components/opportunities/OpportunitiesList';

const OpportunitiesPage = () => {
  const navigate = useNavigate();
  const { opportunities, isLoading, error, updateOpportunity } = useImprovedOpportunities();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Filter opportunities based on search and stage
  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = searchTerm === '' || 
      opportunity.people?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opportunity.people?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opportunity.property_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || opportunity.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  // Group opportunities by stage for kanban view
  const opportunitiesByStage = {
    inquiry: filteredOpportunities.filter(o => o.stage === 'inquiry'),
    contacted: filteredOpportunities.filter(o => o.stage === 'contacted'),
    qualified: filteredOpportunities.filter(o => o.stage === 'qualified'),
    nurturing: filteredOpportunities.filter(o => o.stage === 'nurturing'),
    ready_to_apply: filteredOpportunities.filter(o => o.stage === 'ready_to_apply'),
    converted: filteredOpportunities.filter(o => o.stage === 'converted'),
    lost: filteredOpportunities.filter(o => o.stage === 'lost'),
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

  const stageColors = {
    inquiry: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-green-100 text-green-800',
    nurturing: 'bg-purple-100 text-purple-800',
    ready_to_apply: 'bg-orange-100 text-orange-800',
    converted: 'bg-emerald-100 text-emerald-800',
    lost: 'bg-red-100 text-red-800',
  };

  // Handle stage change from kanban drag and drop
  const handleStageChange = (opportunityId: string, newStage: string) => {
    updateOpportunity({
      id: opportunityId,
      updates: { stage: newStage }
    });
  };

  // Handle opportunity click
  const handleOpportunityClick = (opportunity: Opportunity) => {
    navigate(`/app/opportunities/${opportunity.id}`);
  };

  const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/app/opportunities/${opportunity.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm">
            {opportunity.people?.first_name} {opportunity.people?.last_name}
          </h4>
          <Badge className={`text-xs ${stageColors[opportunity.stage as keyof typeof stageColors]}`}>
            {stageLabels[opportunity.stage as keyof typeof stageLabels]}
          </Badge>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="capitalize">{opportunity.opportunity_type?.replace('_', ' ')}</p>
          {opportunity.estimated_loan_amount && (
            <p>${opportunity.estimated_loan_amount.toLocaleString()}</p>
          )}
          {opportunity.property_address && (
            <p className="truncate">{opportunity.property_address}</p>
          )}
          {opportunity.expected_close_date && (
            <p>Close: {new Date(opportunity.expected_close_date).toLocaleDateString()}</p>
          )}
        </div>

        {opportunity.urgency_level && (
          <div className="mt-2">
            <Badge 
              variant={opportunity.urgency_level === 'urgent' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {opportunity.urgency_level}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading opportunities...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Error loading opportunities: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search opportunities..."
        filters={[
          {
            value: stageFilter,
            onValueChange: setStageFilter,
            options: [
              { value: 'all', label: 'All Stages' },
              { value: 'inquiry', label: 'New Lead' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'qualified', label: 'Qualified' },
              { value: 'nurturing', label: 'Nurturing' },
              { value: 'ready_to_apply', label: 'Ready to Apply' },
              { value: 'converted', label: 'Converted' },
              { value: 'lost', label: 'Lost' }
            ],
            placeholder: 'Filter by stage'
          }
        ]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewOptions={['kanban', 'list']}
        onAddClick={() => setShowAddDialog(true)}
        addButtonText="Add Opportunity"
        addButtonIcon={<Plus className="h-4 w-4" />}
      />

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="w-full">
          <OpportunityKanbanBoard
            opportunities={filteredOpportunities}
            onStageChange={handleStageChange}
            onOpportunityClick={handleOpportunityClick}
          />
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <OpportunitiesList
          opportunities={filteredOpportunities}
          isLoading={isLoading}
          error={error?.message || null}
          onOpportunityClick={handleOpportunityClick}
        />
      )}

      {filteredOpportunities.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No opportunities found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || stageFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first opportunity'
              }
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Opportunity
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Opportunity Dialog */}
      <AddOpportunityDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />
    </div>
  );
};

export default OpportunitiesPage;