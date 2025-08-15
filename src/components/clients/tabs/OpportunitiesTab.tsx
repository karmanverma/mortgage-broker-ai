import React, { useState } from 'react';
import { TrendingUp, Plus, Eye, Edit, Trash2, Calendar, DollarSign, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useImprovedOpportunities } from '@/hooks/useImprovedOpportunities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AddOpportunityDialog } from '@/components/opportunities/AddOpportunityDialog';
import { format } from 'date-fns';

interface OpportunitiesTabProps {
  clientId: string;
  clientType: string;
}

const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (date: string | null | undefined) => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

const getStageVariant = (stage: string | null | undefined) => {
  switch (stage?.toLowerCase()) {
    case 'inquiry': return 'secondary';
    case 'qualified': return 'default';
    case 'proposal': return 'outline';
    case 'negotiation': return 'default';
    case 'converted': return 'default';
    case 'closed_won': return 'default';
    case 'closed_lost': return 'destructive';
    default: return 'secondary';
  }
};

interface OpportunitiesTabProps {
  clientId: string;
  clientType: string;
  primaryPerson?: any;
}

export const OpportunitiesTab: React.FC<OpportunitiesTabProps> = ({ clientId, clientType, primaryPerson }) => {
  const { opportunities, isLoading, addOpportunity, updateOpportunity, deleteOpportunity, isAdding } = useImprovedOpportunities({ clientId });
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Business Opportunities</h3>
          <p className="text-sm text-muted-foreground">
            Track potential business opportunities for this {clientType} client
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" />
          {isAdding ? 'Adding...' : 'Add Opportunity'}
        </Button>
      </div>

      {/* Opportunities List */}
      {opportunities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium mb-2">No Opportunities Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Start tracking business opportunities for this client to manage your sales pipeline effectively.
            </p>
            <Button onClick={() => setShowAddDialog(true)} disabled={isAdding}>
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? 'Adding...' : 'Create First Opportunity'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {opportunities.map((opportunity) => (
            <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {opportunity.opportunity_type?.replace('_', ' ').toUpperCase() || 'Opportunity'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStageVariant(opportunity.stage)}>
                        {opportunity.stage?.replace('_', ' ').toUpperCase() || 'INQUIRY'}
                      </Badge>
                      {opportunity.probability_percentage && (
                        <span className="text-sm text-muted-foreground">
                          {opportunity.probability_percentage}% probability
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Loan Amount</p>
                      <p className="font-medium">
                        {formatCurrency(opportunity.estimated_loan_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Close</p>
                      <p className="font-medium">
                        {formatDate(opportunity.expected_close_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contact</p>
                      <p className="font-medium">
                        {opportunity.people ? 
                          `${opportunity.people.first_name} ${opportunity.people.last_name}` : 
                          'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                {opportunity.property_address && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Property Address</p>
                    <p className="font-medium">{opportunity.property_address}</p>
                  </div>
                )}
                
                {opportunity.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{opportunity.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <AddOpportunityDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        preselectedClientId={clientId}
        preselectedPersonId={primaryPerson?.id}
      />
    </div>
  );
};