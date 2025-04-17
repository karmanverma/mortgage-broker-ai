'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// import { format } from 'date-fns'; // No longer needed
// import { CalendarIcon } from 'lucide-react'; // No longer needed

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover"; // No longer needed
// import { Calendar } from "@/components/ui/calendar"; // No longer needed
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  clientFormSchema,
  employmentStatusOptions,
  loanTypeOptions,
  creditScoreRangeOptions,
  applicationStatusOptions,
  ClientFormData // Use the exported form data type
} from '@/features/clients/types';

interface AddClientFormProps {
  onSubmitSuccess?: (data: ClientFormData) => void;
}

const AddClientForm: React.FC<AddClientFormProps> = ({ onSubmitSuccess }) => {
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      // dateOfBirth: undefined, // Removed
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      employmentStatus: undefined,
      annualIncome: undefined,
      loanAmountSought: undefined,
      loanType: undefined,
      creditScoreRange: undefined,
      applicationStatus: 'New',
      notes: '',
    },
  });

  const onSubmit = (data: ClientFormData) => {
    console.log('Client Form Submitted:', data);
    if (onSubmitSuccess) {
      onSubmitSuccess(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Overall grid for sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basic Info Section */}
          <div className="space-y-4 p-4 border rounded-lg md:col-span-2">
            <h3 className="text-lg font-medium mb-4">Basic Info</h3>
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
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
                name="lastName"
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
            {/* Contact Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(123) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             {/* Removed Date of Birth Field */}
          </div>

          {/* Address Section */} 
          <div className="space-y-4 p-4 border rounded-lg md:col-span-2">
             <h3 className="text-lg font-medium mb-4">Current Address</h3>
              <FormField
              control={form.control}
              name="streetAddress"
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
             {/* City/State/Zip Row */} 
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="col-span-2"> {/* City full width */}
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
                name="state"
                render={({ field }) => (
                  <FormItem className="col-span-1"> {/* State half width */} 
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
                name="zipCode"
                render={({ field }) => (
                  <FormItem className="col-span-1"> {/* Zip half width */} 
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="90210" {...field} maxLength={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          {/* Financial & Loan Information Section */} 
          <div className="space-y-4 p-4 border rounded-lg md:col-span-2">
            <h3 className="text-lg font-medium mb-4">Financial & Loan Information</h3>
             {/* Changed grid columns: 2 default, 3 on md+ */} 
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               <FormField
                control={form.control}
                name="employmentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>{employmentStatusOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="annualIncome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Income</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 75000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loanAmountSought"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Amount Sought</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 300000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loanType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>{loanTypeOptions.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="creditScoreRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Score Range</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>{creditScoreRangeOptions.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="applicationStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                      <SelectContent>{applicationStatusOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="Add notes..." className="resize-y min-h-[80px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
             {form.formState.isSubmitting ? 'Saving...' : 'Save Client'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddClientForm;
