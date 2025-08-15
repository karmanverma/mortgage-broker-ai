import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  MapPin, 
  Calendar, 
  Building, 
  User, 
  FileText,
  Percent,
  Clock
} from "lucide-react";

import { useImprovedLoans, Loan } from '@/hooks/useImprovedLoans';

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

interface LoanDetailDialogProps {
  loan: Loan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function LoanDetailDialog({ loan, open, onOpenChange }: LoanDetailDialogProps) {
  const { updateLoan, isUpdating } = useImprovedLoans();

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
      updateLoan({ 
        id: loan.id, 
        updates: {
          ...data,
          estimated_closing_date: data.estimated_closing_date || null,
        }
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating loan:', error);
    }
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Loan Details</span>
            <Badge className={`${statusColors[loan.loan_status as keyof typeof statusColors]}`}>
              {statusLabels[loan.loan_status as keyof typeof statusLabels]}
            </Badge>
            {loan.priority_level && (
              <Badge className={`${priorityColors[loan.priority_level as keyof typeof priorityColors]}`}>
                {loan.priority_level}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Loan Overview */}
          <div className="lg:col-span-1 space-y-4">
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

          {/* Right Column - Editable Form */}
          <div className="lg:col-span-2">
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

                {/* Loan Number */}
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

                {/* Financial Details */}
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

                {/* Property Address */}
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

                {/* Dates */}
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

                {/* Notes */}
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
                    onClick={() => onOpenChange(false)}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}