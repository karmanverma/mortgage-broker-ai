import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, User, MapPin } from 'lucide-react';
import TodosWidget from '@/components/todos/TodosWidget';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { useImprovedOpportunities } from '@/hooks/useImprovedOpportunities';
import { useOpportunityActivities } from '@/hooks/useOpportunityActivities';

import OpportunityActivityTimeline from '@/components/opportunities/OpportunityActivityTimeline';
import { AddLoanDialog } from '@/components/loans/AddLoanDialog';
import EntityNotesTab from '@/components/ui/EntityNotesTab';
import { toast } from '@/components/ui/use-toast';

// Opportunity update form schema
const opportunityUpdateSchema = z.object({
  stage: z.enum(['inquiry', 'contacted', 'qualified', 'nurturing', 'ready_to_apply', 'converted', 'lost']),
  opportunity_type: z.enum(['purchase', 'refinance', 'investment', 'commercial']),
  lead_source: z.string().optional(),
  estimated_loan_amount: z.preprocess(
    (a) => a === '' ? undefined : parseFloat(z.string().parse(a)),
    z.number().positive().optional()
  ),
  probability_percentage: z.preprocess(
    (a) => a === '' ? undefined : parseInt(z.string().parse(a), 10),
    z.number().min(0).max(100).optional()
  ),
  property_address: z.string().optional(),
  expected_close_date: z.string().optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
});

type OpportunityUpdateData = z.infer<typeof opportunityUpdateSchema>;

const OpportunityDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { opportunities, updateOpportunity, deleteOpportunity, isUpdating, isLoading } = useImprovedOpportunities();
  const { data: activities = [], isLoading: activitiesLoading } = useOpportunityActivities(id);

  const [showAddLoanDialog, setShowAddLoanDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const opportunity = opportunities.find(o => o.id === id);

  const form = useForm<OpportunityUpdateData>({
    resolver: zodResolver(opportunityUpdateSchema),
    values: opportunity ? {
      stage: opportunity.stage as any,
      opportunity_type: opportunity.opportunity_type as any,
      lead_source: opportunity.lead_source || '',
      estimated_loan_amount: opportunity.estimated_loan_amount || undefined,
      probability_percentage: opportunity.probability_percentage || undefined,
      property_address: opportunity.property_address || '',
      expected_close_date: opportunity.expected_close_date || '',
      urgency_level: opportunity.urgency_level as any || 'medium',
      notes: opportunity.notes || '',
    } : undefined,
  });

  const onSubmit = async (data: OpportunityUpdateData) => {
    if (!opportunity) return;

    try {
      await updateOpportunity({ 
        id: opportunity.id, 
        updates: {
          ...data,
          expected_close_date: data.expected_close_date || null,
        }
      });
      setIsEditing(false);
      toast({
        title: "Opportunity Updated",
        description: "Opportunity details have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update opportunity. Please try again.",
      });
    }
  };

  const handleDeleteOpportunity = () => {
    if (!opportunity) return;
    
    const opportunityName = opportunity.people ? 
      `${opportunity.people.first_name} ${opportunity.people.last_name}'s ${opportunity.opportunity_type?.replace('_', ' ')} opportunity` :
      'this opportunity';
    
    if (confirm(`Are you sure you want to delete ${opportunityName}? This action cannot be undone.`)) {
      deleteOpportunity(opportunity.id);
      navigate('/app/opportunities');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading opportunity...</div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-muted-foreground">Opportunity not found</div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/app/opportunities')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {opportunity.people?.first_name} {opportunity.people?.last_name}
            </h1>
            <p className="text-muted-foreground">
              {opportunity.opportunity_type?.replace('_', ' ')} opportunity
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDeleteOpportunity} 
            disabled={isUpdating}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={() => setShowAddLoanDialog(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Convert to Loan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content with Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Opportunity Overview
                    <Badge className={`${stageColors[opportunity.stage as keyof typeof stageColors]}`}>
                      {stageLabels[opportunity.stage as keyof typeof stageLabels]}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="capitalize">{opportunity.opportunity_type?.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lead Source</label>
                      <p>{opportunity.lead_source || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Estimated Amount</label>
                      <p>{opportunity.estimated_loan_amount ? `$${opportunity.estimated_loan_amount.toLocaleString()}` : 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Probability</label>
                      <p>{opportunity.probability_percentage ? `${opportunity.probability_percentage}%` : 'Not specified'}</p>
                    </div>
                  </div>

                  {opportunity.property_address && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Property Address
                        </label>
                        <p>{opportunity.property_address}</p>
                      </div>
                    </>
                  )}

                  {opportunity.notes && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Notes</label>
                        <p className="whitespace-pre-wrap">{opportunity.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes">
              <EntityNotesTab
                entityType="opportunity"
                entityId={id || ''}
                title="Opportunity Notes"
                description="Add and review notes specific to this opportunity."
              />
            </TabsContent>
            
            <TabsContent value="activity">
              <OpportunityActivityTimeline 
                opportunityId={id || ''}
                activities={activities}
                isLoading={activitiesLoading}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* To-dos */}
          <TodosWidget 
            entityType="opportunity" 
            entityId={opportunity.id} 
            showHeader={true}
            maxItems={6}
          />

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p>{opportunity.people?.first_name} {opportunity.people?.last_name}</p>
              </div>
              {opportunity.people?.email_primary && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{opportunity.people.email_primary}</p>
                </div>
              )}
              {opportunity.people?.phone_primary && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p>{opportunity.people.phone_primary}</p>
                </div>
              )}
              {opportunity.people?.company_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <p>{opportunity.people.company_name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Key Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Key Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p>{new Date(opportunity.created_at || '').toLocaleDateString()}</p>
              </div>
              {opportunity.expected_close_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expected Close</label>
                  <p>{new Date(opportunity.expected_close_date).toLocaleDateString()}</p>
                </div>
              )}
              {opportunity.last_activity_date && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                  <p>{new Date(opportunity.last_activity_date).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {opportunity.urgency_level && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Urgency</label>
                  <Badge 
                    variant={opportunity.urgency_level === 'urgent' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {opportunity.urgency_level}
                  </Badge>
                </div>
              )}
              {opportunity.lead_score && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lead Score</label>
                  <p>{opportunity.lead_score}/100</p>
                </div>
              )}
              {opportunity.referral_fee_expected && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Expected Referral Fee</label>
                  <p>${opportunity.referral_fee_expected.toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Loan Dialog */}
      <AddLoanDialog 
        open={showAddLoanDialog}
        onOpenChange={setShowAddLoanDialog}
        preselectedOpportunityId={opportunity.id}
        preselectedClientId={opportunity.client_id || undefined}
      />
      

    </div>
  );
};

export default OpportunityDetailPage;