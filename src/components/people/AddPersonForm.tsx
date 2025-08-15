import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus } from 'lucide-react';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  personFormSchema,
  PersonFormData,
  contactTypeOptions,
  communicationMethodOptions,
  statusOptions,
  getContactTypeDisplayName
} from '@/features/people/types';
import { useImprovedPeople } from '@/hooks/useImprovedPeople';
import { usePersonWithEntityCreation } from '@/hooks/usePersonWithEntityCreation';

interface AddPersonFormProps {
  onSubmitSuccess?: (data: PersonFormData) => void;
  onCancel?: () => void;
  defaultContactType?: string;
  hideContactType?: boolean;
  customAddPerson?: (data: any) => void; // Allow passing custom addPerson function
  autoCreateEntity?: boolean; // Whether to auto-create entity based on contact_type
}

const AddPersonForm: React.FC<AddPersonFormProps> = ({ 
  onSubmitSuccess, 
  onCancel,
  defaultContactType,
  hideContactType = false,
  customAddPerson,
  autoCreateEntity = true
}) => {
  const { addPerson: defaultAddPerson, isAdding } = useImprovedPeople();
  const { createPersonWithEntity, isCreating } = usePersonWithEntityCreation();
  const addPerson = customAddPerson || defaultAddPerson;
  const [tagInput, setTagInput] = useState('');
  const [createEntityForContactType, setCreateEntityForContactType] = useState(autoCreateEntity);

  const form = useForm<PersonFormData>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      contact_type: defaultContactType as any || 'client',
      first_name: '',
      last_name: '',
      company_name: '',
      title_position: '',
      email_primary: '',
      email_secondary: '',
      phone_primary: '',
      phone_secondary: '',
      address_street: '',
      address_city: '',
      address_state: '',
      address_zip: '',
      social_linkedin: '',
      social_facebook: '',
      preferred_communication_method: undefined,
      last_contact_date: undefined,
      next_follow_up_date: undefined,
      relationship_strength_score: 5,
      contact_source: '',
      tags: [],
      notes: '',
      status: 'active',
    },
  });

  const watchedTags = form.watch('tags');

  const onSubmit = async (data: PersonFormData) => {
    console.log('[AddPersonForm] Submitting person data:', data);
    console.log('[AddPersonForm] Auto-create entity:', createEntityForContactType);
    console.log('[AddPersonForm] Contact type:', data.contact_type);
    
    // Check if we should create an entity based on contact type
    const shouldCreateEntity = createEntityForContactType && 
      ['client', 'lender', 'realtor'].includes(data.contact_type);
    
    if (shouldCreateEntity) {
      try {
        // Use person-entity creation for supported contact types
        const result = await createPersonWithEntity({
          entityType: data.contact_type as 'client' | 'lender' | 'realtor',
          personData: data,
          entityData: getDefaultEntityData(data.contact_type),
        });
        
        if (result.success && onSubmitSuccess) {
          onSubmitSuccess(data);
        }
      } catch (error) {
        console.error('[AddPersonForm] Failed to create person with entity:', error);
      }
    } else {
      // Use regular person creation for other contact types or when disabled
      console.log('[AddPersonForm] Using regular person creation');
      addPerson(data);
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
    }
  };
  
  // Helper function to get default entity data based on contact type
  const getDefaultEntityData = (contactType: string) => {
    switch (contactType) {
      case 'client':
        return {
          client_type: 'residential' as const,
          employment_status: 'Employed',
        };
      case 'lender':
        return {
          name: form.getValues('company_name') || `${form.getValues('first_name')} ${form.getValues('last_name')}`,
          type: 'Bank',
          status: 'active',
        };
      case 'realtor':
        return {
          brokerage_name: form.getValues('company_name'),
          active_status: true,
        };
      default:
        return {};
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !watchedTags.includes(tagInput.trim())) {
      const newTags = [...watchedTags, tagInput.trim()];
      form.setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter(tag => tag !== tagToRemove);
    form.setValue('tags', newTags);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!hideContactType && (
              <FormField
                control={form.control}
                name="contact_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contact type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getContactTypeDisplayName(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {!hideContactType && autoCreateEntity && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createEntity"
                  checked={createEntityForContactType}
                  onChange={(e) => setCreateEntityForContactType(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="createEntity" className="text-sm font-medium">
                  Auto-create {form.watch('contact_type')} record
                </label>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="status"
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
                          {status.charAt(0).toUpperCase() + status.slice(1)}
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
              name="first_name"
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
              name="last_name"
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title_position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title/Position</FormLabel>
                  <FormControl>
                    <Input placeholder="Senior Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email_primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email_secondary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.personal@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone_primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone_secondary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 987-6543" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="preferred_communication_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Communication Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {communicationMethodOptions.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Address</h3>
          
          <FormField
            control={form.control}
            name="address_street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="address_city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Anytown" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address_state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} maxLength={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address_zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="90210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Social Media & Additional Info Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Social Media & Additional Info</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="social_linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn Profile</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="social_facebook"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Profile</FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contact_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Source</FormLabel>
                  <FormControl>
                    <Input placeholder="Referral, Website, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="relationship_strength_score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Strength (1-10): {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-full"
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
              name="last_contact_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Contact Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="next_follow_up_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Follow-up Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <FormLabel>Tags</FormLabel>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {watchedTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes about this person..." 
                    className="resize-y min-h-[80px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isAdding || isCreating}>
            {(isAdding || isCreating) ? 'Creating...' : 'Create Person'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddPersonForm;