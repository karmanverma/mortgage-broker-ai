import React, { useState } from 'react';
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { useImprovedLoans } from '@/hooks/useImprovedLoans';
import { useImprovedClients } from '@/hooks/useImprovedClients';
import { useImprovedOpportunities } from '@/hooks/useImprovedOpportunities';
import { useImprovedLenders } from '@/hooks/useImprovedLenders';

// Simplified loan form schema
const loanFormSchema = z.object({
  loan_type: z.string().min(1, "Loan type is required"),
  loan_purpose: z.string().min(1, "Loan purpose is required"),
  loan_status: z.string().default('application'),
  priority_level: z.string().default('medium'),
  client_id: z.string().optional(),
  opportunity_id: z.string().optional(),
  lender_id: z.string().optional(),
  loan_amount: z.number().optional(),
  property_address: z.string().optional(),
  notes: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

interface AddLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedOpportunityId?: string;
  preselectedClientId?: string;
}

export function AddLoanDialog({ 
  open, 
  onOpenChange, 
  preselectedOpportunityId,
  preselectedClientId 
}: AddLoanDialogProps) {
  const { addLoan, isAdding } = useImprovedLoans();
  const { clients } = useImprovedClients();
  const { opportunities, updateOpportunity } = useImprovedOpportunities();
  const { lenders } = useImprovedLenders();
  const [creationMode, setCreationMode] = useState<'opportunity' | 'client' | 'person'>('opportunity');

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      loan_type: '',
      loan_purpose: '',
      loan_status: 'application',
      priority_level: 'medium',
      opportunity_id: preselectedOpportunityId || '',
      client_id: preselectedClientId || '',
      lender_id: '',
      property_address: '',
      notes: '',
    },
  });
  
  // Set creation mode and populate form when dialog opens
  React.useEffect(() => {
    if (open && preselectedOpportunityId) {
      setCreationMode('opportunity');
      form.setValue('opportunity_id', preselectedOpportunityId);
      
      const opp = opportunities.find(o => o.id === preselectedOpportunityId);
      if (opp) {
        if (opp.client_id) form.setValue('client_id', opp.client_id);
        if (opp.estimated_loan_amount) form.setValue('loan_amount', opp.estimated_loan_amount);
        if (opp.property_address) form.setValue('property_address', opp.property_address);
        
        // Set loan purpose based on opportunity type
        if (opp.opportunity_type?.includes('purchase')) {
          form.setValue('loan_purpose', 'purchase');
        } else if (opp.opportunity_type?.includes('refinance')) {
          form.setValue('loan_purpose', 'refinance');
        }
      }
    }
  }, [open, preselectedOpportunityId, form, opportunities]);

  const onSubmit = (data: LoanFormData) => {
    console.log('[AddLoanDialog] Form submitted with data:', data);
    
    // Ensure we have the required fields
    if (!data.loan_type || !data.loan_purpose) {
      console.error('[AddLoanDialog] Missing required fields');
      return;
    }
    
    // For opportunity mode, ensure client_id is set
    if (creationMode === 'opportunity' && data.opportunity_id) {
      const selectedOpp = opportunities.find(o => o.id === data.opportunity_id);
      if (selectedOpp?.client_id) {
        data.client_id = selectedOpp.client_id;
      }
    }
    
    // Create the loan data
    const loanData = {
      loan_type: data.loan_type,
      loan_purpose: data.loan_purpose,
      loan_status: data.loan_status,
      priority_level: data.priority_level,
      client_id: data.client_id || null,
      opportunity_id: data.opportunity_id || null,
      lender_id: data.lender_id || null,
      loan_amount: data.loan_amount || null,
      property_address: data.property_address || null,
      notes: data.notes || null,
    };
    
    console.log('[AddLoanDialog] Calling addLoan with:', loanData);
    
    // Call the mutation
    addLoan(loanData);
    
    // Update opportunity stage if converting
    if (creationMode === 'opportunity' && data.opportunity_id) {
      setTimeout(() => {
        updateOpportunity({ 
          id: data.opportunity_id!, 
          updates: { stage: 'converted' } 
        });
      }, 1000);
    }
    
    // Close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Opportunity to Loan</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Loan Type */}
            <FormField
              control={form.control}
              name="loan_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="conventional">Conventional</SelectItem>
                      <SelectItem value="fha">FHA</SelectItem>
                      <SelectItem value="va">VA</SelectItem>
                      <SelectItem value="usda">USDA</SelectItem>
                      <SelectItem value="jumbo">Jumbo</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loan Purpose */}
            <FormField
              control={form.control}
              name="loan_purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Purpose *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="refinance">Refinance</SelectItem>
                      <SelectItem value="cash_out_refinance">Cash-Out Refinance</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loan Amount */}
            <FormField
              control={form.control}
              name="loan_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter loan amount" 
                      value={field.value?.toString() || ''} 
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lender */}
            <FormField
              control={form.control}
              name="lender_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lender (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {lenders.map((lender) => (
                        <SelectItem key={lender.id} value={lender.id}>
                          {lender.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Property Address */}
            <FormField
              control={form.control}
              name="property_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter property address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this loan..."
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
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isAdding}
                onClick={() => {
                  console.log('[AddLoanDialog] Submit button clicked');
                  console.log('[AddLoanDialog] Form values:', form.getValues());
                  console.log('[AddLoanDialog] Form errors:', form.formState.errors);
                }}
              >
                {isAdding ? "Creating..." : "Create Loan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}