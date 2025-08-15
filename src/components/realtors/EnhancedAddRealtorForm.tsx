import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { usePersonWithEntityCreation } from '@/hooks/usePersonWithEntityCreation';
import { Person } from '@/features/people/types';
import { PersonSelector } from '@/components/people/PersonSelector';

// Enhanced realtor form schema with person and entity data
const personDataSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email_primary: z.string().email("Invalid email format"),
  phone_primary: z.string().optional(),
  company_name: z.string().optional(),
  contact_type: z.literal('realtor'),
});

const realtorDataSchema = z.object({
  license_number: z.string().optional(),
  license_state: z.string().optional(),
  brokerage_name: z.string().optional(),
  years_experience: z.preprocess(
    (a) => a === '' ? undefined : parseInt(z.string().parse(a), 10),
    z.number().min(0).optional()
  ),
  performance_rating: z.preprocess(
    (a) => a === '' ? undefined : parseInt(z.string().parse(a), 10),
    z.number().min(1).max(10).optional()
  ),
  active_status: z.boolean().default(true),
  notes: z.string().optional(),
});

const enhancedRealtorFormSchema = z.object({
  useExistingPerson: z.boolean().default(false),
  existingPersonId: z.string().optional(),
  personData: personDataSchema.optional(),
  realtorData: realtorDataSchema,
});

type EnhancedRealtorFormData = z.infer<typeof enhancedRealtorFormSchema>;

interface EnhancedAddRealtorFormProps {
  isOpen: boolean;
  onClose: () => void;
  stateOptions?: string[];
}

export const EnhancedAddRealtorForm: React.FC<EnhancedAddRealtorFormProps> = ({
  isOpen,
  onClose,
  stateOptions = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'],
}) => {
  const { createPersonWithEntity, isCreating, error } = usePersonWithEntityCreation();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [useExistingPerson, setUseExistingPerson] = useState(false);

  const form = useForm<EnhancedRealtorFormData>({
    resolver: zodResolver(enhancedRealtorFormSchema),
    defaultValues: {
      useExistingPerson: false,
      existingPersonId: '',
      personData: {
        first_name: '',
        last_name: '',
        email_primary: '',
        phone_primary: '',
        company_name: '',
        contact_type: 'realtor',
      },
      realtorData: {
        license_number: '',
        license_state: '',
        brokerage_name: '',
        years_experience: undefined,
        performance_rating: undefined,
        active_status: true,
        notes: '',
      },
    },
  });

  const onSubmit = async (data: EnhancedRealtorFormData) => {
    if (data.useExistingPerson && !data.existingPersonId) {
      form.setError('existingPersonId', { message: 'Please select a person' });
      return;
    }

    if (!data.useExistingPerson && !data.personData) {
      form.setError('personData', { message: 'Person data is required' });
      return;
    }

    try {
      const result = await createPersonWithEntity({
        entityType: 'realtor',
        personData: data.personData!,
        entityData: data.realtorData,
        existingPersonId: data.useExistingPerson ? data.existingPersonId : undefined,
      });

      if (result.success) {
        handleClose();
      }
    } catch (error) {
      console.error('Failed to create realtor:', error);
    }
  };

  const handlePersonSelect = (person: Person | null) => {
    setSelectedPerson(person);
    if (person) {
      form.setValue('existingPersonId', person.id);
      form.clearErrors('existingPersonId');
      
      // Auto-fill brokerage name if available
      if (person.company_name && !form.getValues('realtorData.brokerage_name')) {
        form.setValue('realtorData.brokerage_name', person.company_name);
      }
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
  };

  const handleClose = () => {
    form.reset();
    setSelectedPerson(null);
    setUseExistingPerson(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Realtor</DialogTitle>
          <DialogDescription>
            Select a person and enter realtor details. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Person Selection Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-medium">Contact Person</h3>
              
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
                          contactType="realtor"
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
                          <Input placeholder="John" {...field} />
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
                          <Input placeholder="Doe" {...field} />
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
                          <Input type="email" placeholder="john@realty.com" {...field} />
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

            {/* Realtor Information Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-medium">Realtor Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="realtorData.license_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. RE123456" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="realtorData.license_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License State</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stateOptions.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="realtorData.brokerage_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brokerage Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Century 21" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="realtorData.years_experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 5" 
                          {...field} 
                          value={field.value || ''}
                          min="0"
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
                  name="realtorData.performance_rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance Rating (1-10)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g. 8" 
                          {...field} 
                          value={field.value || ''}
                          min="1"
                          max="10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="realtorData.active_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'true')} 
                        defaultValue={field.value ? 'true' : 'false'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="realtorData.notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional information about this realtor..."
                        className="resize-y min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Realtor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};