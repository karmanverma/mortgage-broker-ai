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

// Enhanced lender form schema with person and entity data
const personDataSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email_primary: z.string().email("Invalid email format"),
  phone_primary: z.string().optional(),
  company_name: z.string().optional(),
  contact_type: z.literal('lender'),
});

const lenderDataSchema = z.object({
  name: z.string().min(1, { message: "Lender name is required" }),
  type: z.string().min(1, { message: "Lender type is required" }),
  status: z.string().default("active"),
  notes: z.string().optional(),
});

const enhancedLenderFormSchema = z.object({
  useExistingPerson: z.boolean().default(false),
  existingPersonId: z.string().optional(),
  personData: personDataSchema.optional(),
  lenderData: lenderDataSchema,
});

type EnhancedLenderFormData = z.infer<typeof enhancedLenderFormSchema>;

interface EnhancedAddLenderFormProps {
  isOpen: boolean;
  onClose: () => void;
  lenderTypes: string[];
  statusOptions: string[];
}

export const EnhancedAddLenderForm: React.FC<EnhancedAddLenderFormProps> = ({
  isOpen,
  onClose,
  lenderTypes,
  statusOptions,
}) => {
  const { createPersonWithEntity, isCreating, error } = usePersonWithEntityCreation();
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [useExistingPerson, setUseExistingPerson] = useState(false);

  const form = useForm<EnhancedLenderFormData>({
    resolver: zodResolver(enhancedLenderFormSchema),
    defaultValues: {
      useExistingPerson: false,
      existingPersonId: '',
      personData: {
        first_name: '',
        last_name: '',
        email_primary: '',
        phone_primary: '',
        company_name: '',
        contact_type: 'lender',
      },
      lenderData: {
        name: '',
        type: '',
        status: 'active',
        notes: '',
      },
    },
  });

  const onSubmit = async (data: EnhancedLenderFormData) => {
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
        entityType: 'lender',
        personData: data.personData!,
        entityData: data.lenderData,
        existingPersonId: data.useExistingPerson ? data.existingPersonId : undefined,
      });

      if (result.success) {
        handleClose();
      }
    } catch (error) {
      console.error('Failed to create lender:', error);
    }
  };

  const handlePersonSelect = (person: Person | null) => {
    setSelectedPerson(person);
    if (person) {
      form.setValue('existingPersonId', person.id);
      form.clearErrors('existingPersonId');
      
      // Auto-fill company name if available
      if (person.company_name && !form.getValues('lenderData.name')) {
        form.setValue('lenderData.name', person.company_name);
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lender</DialogTitle>
          <DialogDescription>
            Select a person and enter lender details. All fields marked with * are required.
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
                          contactType="lender"
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
                          <Input type="email" placeholder="john@bank.com" {...field} />
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

            {/* Lender Information Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="text-lg font-medium">Lender Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lenderData.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lender Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. First National Bank" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lenderData.type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lender Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select lender type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lenderTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="lenderData.status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((status) => (
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
                name="lenderData.notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional information about this lender..."
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
                {isCreating ? "Creating..." : "Create Lender"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};