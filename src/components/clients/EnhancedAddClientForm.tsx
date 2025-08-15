import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
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

import {
  employmentStatusOptions,
  loanTypeOptions,
  creditScoreRangeOptions,
  applicationStatusOptions,
} from '@/features/clients/types';
import { usePersonWithEntityCreation } from '@/hooks/usePersonWithEntityCreation';
import { Person } from '@/features/people/types';
import { PersonSelector } from '@/components/people/PersonSelector';

// Enhanced client form schema with person and entity data
const personDataSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email_primary: z.string().email("Invalid email format"),
  phone_primary: z.string().optional(),
  company_name: z.string().optional(),
  contact_type: z.literal('client'),
});

const clientDataSchema = z.object({
  client_type: z.enum(['residential', 'commercial', 'investor']).optional(),
  employment_status: z.enum(employmentStatusOptions).optional(),
  employer_name: z.string().optional(),
  job_title: z.string().optional(),
  annual_income: z.preprocess(
    (a) => a === '' ? undefined : parseInt(z.string().parse(a), 10),
    z.number().positive({ message: "Annual income must be positive" }).optional()
  ),
  credit_score: z.preprocess(
    (a) => a === '' ? undefined : parseInt(z.string().parse(a), 10),
    z.number().min(300).max(850).optional()
  ),
  notes: z.string().optional(),
});

const createEnhancedClientFormSchema = (useExistingPerson: boolean) => {
  return z.object({
    useExistingPerson: z.boolean().default(false),
    existingPersonId: useExistingPerson ? z.string().min(1, "Please select a person") : z.string().optional(),
    personData: useExistingPerson ? personDataSchema.optional() : personDataSchema,
    clientData: clientDataSchema,
  });
};

const enhancedClientFormSchema = z.object({
  useExistingPerson: z.boolean().default(false),
  existingPersonId: z.string().optional(),
  personData: personDataSchema.optional(),
  clientData: clientDataSchema,
});

type EnhancedClientFormData = z.infer<typeof enhancedClientFormSchema>;

interface EnhancedAddClientFormProps {
  onSubmitSuccess?: (data: EnhancedClientFormData) => void;
  onCancel?: () => void;
}

const EnhancedAddClientForm: React.FC<EnhancedAddClientFormProps> = ({ 
  onSubmitSuccess, 
  onCancel 
}) => {
  const { createPersonWithEntity, isCreating, error } = usePersonWithEntityCreation();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [useExistingPerson, setUseExistingPerson] = useState(false);

  const form = useForm<EnhancedClientFormData>({
    resolver: zodResolver(createEnhancedClientFormSchema(useExistingPerson)),
    defaultValues: {
      useExistingPerson: false,
      existingPersonId: '',
      personData: {
        first_name: '',
        last_name: '',
        email_primary: '',
        phone_primary: '',
        company_name: '',
        contact_type: 'client',
      },
      clientData: {
        client_type: 'residential',
        employment_status: 'Employed',
        employer_name: '',
        job_title: '',
        annual_income: undefined,
        credit_score: undefined,
        notes: '',
      },
    },
  });

  const onSubmit = async (data: EnhancedClientFormData) => {
    console.log('[EnhancedAddClientForm] Form submission started');
    console.log('[EnhancedAddClientForm] Form submission data:', data);
    console.log('[EnhancedAddClientForm] useExistingPerson:', useExistingPerson);
    console.log('[EnhancedAddClientForm] selectedPerson:', selectedPerson);
    
    if (data.useExistingPerson && !data.existingPersonId) {
      form.setError('existingPersonId', { message: 'Please select a person' });
      return;
    }

    if (!data.useExistingPerson) {
      // Validate required person fields when creating new person
      const personData = data.personData;
      if (!personData?.first_name) {
        form.setError('personData.first_name', { message: 'First name is required' });
        return;
      }
      if (!personData?.last_name) {
        form.setError('personData.last_name', { message: 'Last name is required' });
        return;
      }
      if (!personData?.email_primary) {
        form.setError('personData.email_primary', { message: 'Email is required' });
        return;
      }
    }

    try {
      const result = await createPersonWithEntity({
        entityType: 'client',
        personData: data.personData || {
          first_name: '',
          last_name: '',
          email_primary: '',
          contact_type: 'client'
        },
        entityData: data.clientData,
        existingPersonId: data.useExistingPerson ? data.existingPersonId : undefined,
      });

      console.log('[EnhancedAddClientForm] Creation result:', result);

      if (result.success) {
        // Reset form after successful submission
        form.reset();
        setSelectedPerson(null);
        setUseExistingPerson(false);
        
        if (onSubmitSuccess) {
          onSubmitSuccess(data);
        }
      }
    } catch (error) {
      console.error('[EnhancedAddClientForm] Failed to create client:', error);
      // Show error to user
      form.setError('root', { message: error instanceof Error ? error.message : 'Unknown error occurred' });
    }
  };

  const handlePersonSelect = (person: Person | null) => {
    setSelectedPerson(person);
    if (person) {
      form.setValue('existingPersonId', person.id);
      form.clearErrors('existingPersonId');
    } else {
      form.setValue('existingPersonId', '');
    }
  };

  const handleUseExistingPersonChange = (useExisting: boolean) => {
    setUseExistingPerson(useExisting);
    form.setValue('useExistingPerson', useExisting);
    if (!useExisting) {
      setSelectedPerson(null);
      form.setValue('existingPersonId', '');
    }
    // Update form resolver with new schema
    form.clearErrors();
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => {
        e.preventDefault();
        console.log('[EnhancedAddClientForm] Form submitted manually');
        onSubmit(form.getValues());
      }} className="space-y-6">
        {/* Person Selection Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Person Information</h3>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useExistingPerson"
              checked={useExistingPerson}
              onChange={(e) => handleUseExistingPersonChange(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="useExistingPerson" className="text-sm font-medium">
              Use existing person
            </label>
          </div>

          {useExistingPerson ? (
            <FormField
              control={form.control}
              name="existingPersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Person</FormLabel>
                  <FormControl>
                    <PersonSelector
                      selectedPersonId={field.value}
                      onPersonSelect={handlePersonSelect}
                      contactType="client"
                      placeholder="Select an existing person"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="personData.first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} required={!useExistingPerson} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personData.last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} required={!useExistingPerson} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personData.email_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} required={!useExistingPerson} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="personData.phone_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="555-0123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Employment Information Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Employment Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientData.employment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employmentStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientData.annual_income"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Income</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 75000" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientData.employer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientData.job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Client Information Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Client Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientData.client_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="investor">Investor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientData.credit_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Score</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 720" 
                      {...field} 
                      value={field.value || ''}
                      min="300"
                      max="850"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Additional Information</h3>
          
          <FormField
            control={form.control}
            name="clientData.notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes about this client..." 
                    className="resize-y min-h-[80px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {form.formState.errors.root && (
          <div className="text-red-600 text-sm">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isCreating}
            onClick={() => {
              console.log('[EnhancedAddClientForm] Submit button clicked');
              console.log('[EnhancedAddClientForm] Form errors:', form.formState.errors);
              console.log('[EnhancedAddClientForm] Form values:', form.getValues());
              console.log('[EnhancedAddClientForm] Form is valid:', form.formState.isValid);
            }}
          >
            {isCreating ? 'Creating Client...' : 'Create Client'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EnhancedAddClientForm;