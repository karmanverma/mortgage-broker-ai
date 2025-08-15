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

import { useImprovedOpportunities } from '@/hooks/useImprovedOpportunities';
import { useImprovedClients } from '@/hooks/useImprovedClients';
import { usePersonWithEntityCreation } from '@/hooks/usePersonWithEntityCreation';
import { Person } from '@/features/people/types';
import PersonSelector from '@/components/people/PersonSelector';
import { useToast } from '@/hooks/use-toast';

// Opportunity form schema
const opportunityFormSchema = z.object({
  opportunity_type: z.enum([
    'residential_purchase',
    'residential_refinance', 
    'commercial_purchase',
    'commercial_refinance',
    'investment_property'
  ], {
    required_error: "Opportunity type is required",
  }),
  stage: z.enum([
    'inquiry',
    'contacted', 
    'qualified',
    'nurturing',
    'ready_to_apply',
    'converted',
    'lost'
  ]).default('inquiry'),
  lead_source: z.string().optional(),
  estimated_loan_amount: z.preprocess(
    (a) => a === '' ? undefined : parseFloat(z.string().parse(a)),
    z.number().positive({ message: "Amount must be positive" }).optional()
  ),
  property_address: z.string().optional(),
  property_type: z.string().optional(),
  urgency_level: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  probability_percentage: z.preprocess(
    (a) => a === '' ? undefined : parseInt(z.string().parse(a), 10),
    z.number().min(0).max(100).optional()
  ),
  expected_close_date: z.string().optional(),
  lead_score: z.preprocess(
    (a) => a === '' ? undefined : parseInt(z.string().parse(a), 10),
    z.number().min(0).max(100).optional()
  ),
  referral_fee_expected: z.preprocess(
    (a) => a === '' ? undefined : parseFloat(z.string().parse(a)),
    z.number().min(0).optional()
  ),
  notes: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunityFormSchema>;

interface AddOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedClientId?: string;
  preselectedPersonId?: string;
}

export function AddOpportunityDialog({ open, onOpenChange, preselectedClientId, preselectedPersonId }: AddOpportunityDialogProps) {
  const { addOpportunity, isAdding } = useImprovedOpportunities();
  const { clients } = useImprovedClients();
  const { createPersonWithEntity, isCreating } = usePersonWithEntityCreation();
  const { toast } = useToast();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Set preselected person when dialog opens
  React.useEffect(() => {
    if (open && preselectedPersonId && !selectedPerson) {
      // Find person from clients data
      const preselectedPerson = clients
        .flatMap(c => c.people || [])
        .find(p => p.id === preselectedPersonId);
      
      if (preselectedPerson) {
        setSelectedPerson(preselectedPerson);
      }
    }
  }, [open, preselectedPersonId, clients, selectedPerson]);

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: {
      stage: 'inquiry',
    },
  });

  const handlePersonSelect = (person: Person | null) => {
    setSelectedPerson(person);
  };

  const handlePersonCreated = (person: Person) => {
    console.log('New person created:', person);
    setSelectedPerson(person);
  };

  const onSubmit = async (data: OpportunityFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Selected person:', selectedPerson);
    
    if (!selectedPerson) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select or create a person first.",
      });
      return;
    }
    
    try {
      // Use preselected client or find existing client
      let clientId = preselectedClientId;
      
      if (!clientId) {
        const existingClient = clients.find(client => 
          client.people?.some(person => person.id === selectedPerson.id) ||
          client.primary_person?.id === selectedPerson.id
        );
        clientId = existingClient?.id;
      }

      // If no client found and no preselected client, create client record
      if (!clientId) {
        console.log('Person is not a client, creating client record first');
        
        const clientResult = await createPersonWithEntity({
          entityType: 'client',
          personData: {
            contact_type: 'client',
            first_name: selectedPerson.first_name,
            last_name: selectedPerson.last_name,
            email_primary: selectedPerson.email_primary,
            phone_primary: selectedPerson.phone_primary,
          },
          entityData: {
            client_type: 'residential',
            employment_status: 'Employed',
          },
          existingPersonId: selectedPerson.id
        });
        
        if (!clientResult.success) {
          throw new Error(clientResult.error || 'Failed to create client');
        }
        
        clientId = clientResult.entity?.id;
      }

      // Create the opportunity
      const opportunityData = {
        people_id: selectedPerson.id,
        opportunity_type: data.opportunity_type,
        stage: data.stage || 'inquiry',
        lead_source: data.lead_source || null,
        estimated_loan_amount: data.estimated_loan_amount || null,
        property_address: data.property_address || null,
        property_type: data.property_type || null,
        urgency_level: data.urgency_level || null,
        probability_percentage: data.probability_percentage || null,
        expected_close_date: data.expected_close_date || null,
        lead_score: data.lead_score || null,
        referral_fee_expected: data.referral_fee_expected || null,
        notes: data.notes || null,
        client_id: clientId,
      };

      console.log('Creating opportunity with data:', opportunityData);
      addOpportunity(opportunityData);
      
      // Reset form and close dialog
      form.reset();
      setSelectedPerson(null);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create opportunity. Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Opportunity</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={(e) => {
            e.preventDefault();
            console.log('[AddOpportunityDialog] Form submitted manually');
            console.log('[AddOpportunityDialog] Form values:', form.getValues());
            console.log('[AddOpportunityDialog] Form errors:', form.formState.errors);
            onSubmit(form.getValues());
          }} className="space-y-6">
            {/* Person Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Person</label>
              <PersonSelector
                selectedPersonId={selectedPerson?.id}
                onPersonSelect={handlePersonSelect}
                onPersonCreated={handlePersonCreated}
                contactType="client"
                placeholder="Select or create a contact person"
              />
              {!selectedPerson && (
                <p className="text-sm text-destructive">
                  Please select or create a person
                </p>
              )}
            </div>

            <Separator />

            {/* Opportunity Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="opportunity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opportunity Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="residential_purchase">Residential Purchase</SelectItem>
                        <SelectItem value="residential_refinance">Residential Refinance</SelectItem>
                        <SelectItem value="commercial_purchase">Commercial Purchase</SelectItem>
                        <SelectItem value="commercial_refinance">Commercial Refinance</SelectItem>
                        <SelectItem value="investment_property">Investment Property</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="inquiry">New Lead</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="nurturing">Nurturing</SelectItem>
                        <SelectItem value="ready_to_apply">Ready to Apply</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lead_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Website, Referral, Cold Call" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimated_loan_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Loan Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
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
                name="probability_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        placeholder="50" 
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
                    <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expected_close_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referral_fee_expected"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Referral Fee</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
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
                      placeholder="Additional notes about this opportunity..."
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
                disabled={isAdding || isCreating}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isAdding || isCreating || !selectedPerson}
                onClick={() => {
                  console.log('[AddOpportunityDialog] Submit button clicked');
                  console.log('[AddOpportunityDialog] Selected person:', selectedPerson);
                  console.log('[AddOpportunityDialog] Form valid:', form.formState.isValid);
                }}
              >
                {(isAdding || isCreating) ? "Creating..." : "Add Opportunity"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}