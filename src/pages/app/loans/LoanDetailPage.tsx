import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Edit, Trash2, DollarSign, Calendar, User, MapPin, Building, FileText, Percent, Clock } from 'lucide-react';
import TodosWidget from '@/components/todos/TodosWidget';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useImprovedLoans, Loan } from '@/hooks/useImprovedLoans';

import { useLoanActivities } from '@/hooks/useLoanActivities';
import LoanActivityTimeline from '@/components/loans/LoanActivityTimeline';
import EntityNotesTab from '@/components/ui/EntityNotesTab';
import { toast } from '@/components/ui/use-toast';

// Loan update form schema
const loanUpdateSchema = z.object({
  loan_status: z.enum([
    'application',
    'processing',
    'underwriting',
    'conditional_approval',
    'clear_to_close',
    'funded',
    'denied'
  ]),
  priority_level: z.enum(['low', 'medium', 'high', 'urgent']),
  loan_number: z.string().optional(),
  loan_amount: z.preprocess(
    (a) => a === '' ? undefined : parseFloat(z.string().parse(a)),
    z.number().positive().optional()
  ),
  property_address: z.string().optional(),
  property_value: z.preprocess(
    (a) => a === '' ? undefined : parseFloat(z.string().parse(a)),
    z.number().positive().optional()
  ),
  down_payment: z.preprocess(
    (a) => a === '' ? undefined : parseFloat(z.string().parse(a)),
    z.number().min(0).optional()
  ),
  interest_rate: z.preprocess(
    (a) => a === '' ? undefined : parseFloat(z.string().parse(a)),
    z.number().min(0).max(100).optional()
  ),
  loan_term: z.preprocess(
    (a) => a === '' ? undefined : parseInt(z.string().parse(a), 10),
    z.number().positive().optional()
  ),
  monthly_payment: z.preprocess(
    (a) => a === '' ? undefined : parseFloat(z.string().parse(a)),
    z.number().min(0).optional()
  ),
  estimated_closing_date: z.string().optional(),
  notes: z.string().optional(),
});

type LoanUpdateData = z.infer<typeof loanUpdateSchema>;

const statusLabels = {
  application: 'Application',
  processing: 'Processing',
  underwriting: 'Underwriting',
  conditional_approval: 'Conditional Approval',
  clear_to_close: 'Clear to Close',
  funded: 'Funded',
  denied: 'Denied',
};

const statusColors = {
  application: 'bg-blue-100 text-blue-800',
  processing: 'bg-yellow-100 text-yellow-800',
  underwriting: 'bg-orange-100 text-orange-800',
  conditional_approval: 'bg-purple-100 text-purple-800',
  clear_to_close: 'bg-green-100 text-green-800',
  funded: 'bg-emerald-100 text-emerald-800',
  denied: 'bg-red-100 text-red-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const loanTypeLabels = {
  conventional: 'Conventional',
  fha: 'FHA',
  va: 'VA',
  usda: 'USDA',
  jumbo: 'Jumbo',
  commercial: 'Commercial',
  hard_money: 'Hard Money',
};

const loanPurposeLabels = {
  purchase: 'Purchase',
  refinance: 'Refinance',
  cash_out_refinance: 'Cash-Out Refinance',
  investment: 'Investment',
};

const LoanDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loans, updateLoan, deleteLoan, isUpdating, isLoading } = useImprovedLoans();

  const { data: activities = [], isLoading: activitiesLoading } = useLoanActivities(id);
  const [isEditing, setIsEditing] = useState(false);

  const loan = loans.find(l => l.id === id);

  const form = useForm<LoanUpdateData>({
    resolver: zodResolver(loanUpdateSchema),
    values: loan ? {
      loan_status: loan.loan_status as any,
      priority_level: loan.priority_level as any || 'medium',
      loan_number: loan.loan_number || '',
      loan_amount: loan.loan_amount || undefined,
      property_address: loan.property_address || '',
      property_value: loan.property_value || undefined,
      down_payment: loan.down_payment || undefined,
      interest_rate: loan.interest_rate || undefined,
      loan_term: loan.loan_term || undefined,
      monthly_payment: loan.monthly_payment || undefined,
      estimated_closing_date: loan.estimated_closing_date || '',
      notes: loan.notes || '',
    } : undefined,
  });

  const onSubmit = async (data: LoanUpdateData) => {
    if (!loan) return;

    try {
      await updateLoan({ 
        id: loan.id, 
        updates: {
          ...data,
          estimated_closing_date: data.estimated_closing_date || null,
        }
      });
      setIsEditing(false);
      toast({
        title: "Loan Updated",
        description: "Loan details have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating loan:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update loan. Please try again.",
      });
    }
  };

  const handleDeleteLoan = () => {
    if (!loan) return;
    
    const loanName = loan.loan_number || `Loan #${loan.id.slice(-6)}`;
    
    if (confirm(`Are you sure you want to delete ${loanName}? This action cannot be undone.`)) {
      deleteLoan(loan.id);
      navigate('/app/loans');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading loan...</div>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-muted-foreground">Loan not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/app/loans')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Loans
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>Loan Details</span>
              <Badge className={`${statusColors[loan.loan_status as keyof typeof statusColors]}`}>
                {statusLabels[loan.loan_status as keyof typeof statusLabels]}
              </Badge>
              {loan.priority_level && (
                <Badge className={`${priorityColors[loan.priority_level as keyof typeof priorityColors]}`}>
                  {loan.priority_level}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">
              {loan.loan_number || 'Loan'} - {loanTypeLabels[loan.loan_type as keyof typeof loanTypeLabels]}
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
            onClick={handleDeleteLoan} 
            disabled={isUpdating}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Loan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Loan Overview */}
        <div className="lg:col-span-1 space-y-4">
          {/* To-dos */}
          <TodosWidget 
            entityType="loan" 
            entityId={loan.id} 
            showHeader={true}
            maxItems={6}
          />

          {/* Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">
                  {loan.clients?.people?.first_name} {loan.clients?.people?.last_name}
                </span>
              </div>
              {loan.clients?.people?.email_primary && (
                <div className="text-muted-foreground">
                  {loan.clients?.people.email_primary}
                </div>
              )}
              {loan.clients?.people?.phone_primary && (
                <div className="text-muted-foreground">
                  {loan.clients?.people.phone_primary}
                </div>
              )}
              <Badge variant="outline" className="text-xs">
                {loan.clients?.client_type}
              </Badge>
            </CardContent>
          </Card>

          {/* Loan Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Loan Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">
                  {loanTypeLabels[loan.loan_type as keyof typeof loanTypeLabels]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purpose:</span>
                <span className="font-medium">
                  {loanPurposeLabels[loan.loan_purpose as keyof typeof loanPurposeLabels]}
                </span>
              </div>
              {loan.loan_amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium text-green-600">
                    ${loan.loan_amount.toLocaleString()}
                  </span>
                </div>
              )}
              {loan.interest_rate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate:</span>
                  <span className="font-medium">{loan.interest_rate}%</span>
                </div>
              )}
              {loan.loan_term && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term:</span>
                  <span className="font-medium">{loan.loan_term} years</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lender Info */}
          {loan.lenders && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Lender
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="font-medium">{loan.lenders.name}</div>
                <div className="text-muted-foreground capitalize">{loan.lenders.type}</div>
              </CardContent>
            </Card>
          )}

          {/* Opportunity Link */}
          {loan.opportunities && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Related Opportunity</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="font-medium">
                  {loan.opportunities.people?.first_name} {loan.opportunities.people?.last_name}
                </div>
                <div className="text-muted-foreground capitalize">
                  {loan.opportunities.opportunity_type?.replace('_', ' ')}
                </div>
                <Badge variant="outline" className="text-xs mt-1">
                  {loan.opportunities.stage}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Loan Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Status and Priority */}
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="loan_status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Loan Status</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="application">Application</SelectItem>
                                    <SelectItem value="processing">Processing</SelectItem>
                                    <SelectItem value="underwriting">Underwriting</SelectItem>
                                    <SelectItem value="conditional_approval">Conditional Approval</SelectItem>
                                    <SelectItem value="clear_to_close">Clear to Close</SelectItem>
                                    <SelectItem value="funded">Funded</SelectItem>
                                    <SelectItem value="denied">Denied</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="priority_level"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority Level</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="loan_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loan Number</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="loan_amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Loan Amount</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="property_value"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Property Value</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="down_payment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Down Payment</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="interest_rate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Interest Rate (%)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="loan_term"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Term (years)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="property_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="estimated_closing_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estimated Closing Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="monthly_payment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Monthly Payment</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button 
                            variant="outline" 
                            type="button" 
                            onClick={() => setIsEditing(false)}
                            disabled={isUpdating}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isUpdating}>
                            {isUpdating ? "Updating..." : "Update Loan"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Loan Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Basic Loan Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Loan Number</label>
                        <p className="font-medium">{loan.loan_number || 'Not assigned'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <Badge className={statusColors[loan.loan_status as keyof typeof statusColors]}>
                          {statusLabels[loan.loan_status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                        <p>{loanTypeLabels[loan.loan_type as keyof typeof loanTypeLabels]}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                        <p>{loanPurposeLabels[loan.loan_purpose as keyof typeof loanPurposeLabels]}</p>
                      </div>
                      {loan.priority_level && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Priority</label>
                          <Badge className={priorityColors[loan.priority_level as keyof typeof priorityColors]}>
                            {loan.priority_level}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Financial Details */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financial Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {loan.loan_amount && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Loan Amount</label>
                            <p className="font-medium text-green-600">${loan.loan_amount.toLocaleString()}</p>
                          </div>
                        )}
                        {loan.property_value && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Property Value</label>
                            <p className="font-medium">${loan.property_value.toLocaleString()}</p>
                          </div>
                        )}
                        {loan.down_payment && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Down Payment</label>
                            <p className="font-medium">${loan.down_payment.toLocaleString()}</p>
                          </div>
                        )}
                        {loan.interest_rate && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Interest Rate</label>
                            <p className="font-medium">{loan.interest_rate}%</p>
                          </div>
                        )}
                        {loan.loan_term && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Loan Term</label>
                            <p>{loan.loan_term} years</p>
                          </div>
                        )}
                        {loan.monthly_payment && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Monthly Payment</label>
                            <p className="font-medium">${loan.monthly_payment.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property Information */}
                    {loan.property_address && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Property Information
                          </h4>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Address</label>
                            <p>{loan.property_address}</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Timeline Information */}
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Timeline
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {loan.estimated_closing_date && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Estimated Closing</label>
                            <p>{new Date(loan.estimated_closing_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Created</label>
                          <p>{new Date(loan.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                          <p>{new Date(loan.updated_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notes */}
                    {loan.notes && (
                      <>
                        <Separator />
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Notes</label>
                          <p className="whitespace-pre-wrap mt-2 p-3 bg-muted rounded-md">{loan.notes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="notes">
              <EntityNotesTab
                entityType="loan"
                entityId={id || ''}
                title="Loan Notes"
                description="Add and review notes specific to this loan."
              />
            </TabsContent>
            
            <TabsContent value="activity">
              <LoanActivityTimeline 
                loanId={id || ''}
                activities={activities}
                isLoading={activitiesLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LoanDetailPage;