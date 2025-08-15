import { z } from 'zod';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Contact type options
export const contactTypeOptions = [
  'client',
  'lender', 
  'realtor',
  'investor',
  'vendor',
  'referral_source',
  'other'
] as const;

export type ContactType = typeof contactTypeOptions[number];

// Communication method options
export const communicationMethodOptions = [
  'email',
  'phone', 
  'text',
  'linkedin'
] as const;

export type CommunicationMethod = typeof communicationMethodOptions[number];

// Status options
export const statusOptions = [
  'active',
  'inactive',
  'prospect'
] as const;

export type PersonStatus = typeof statusOptions[number];

// Zod schema for person form validation
export const personFormSchema = z.object({
  contact_type: z.enum(contactTypeOptions, {
    required_error: "Contact type is required",
  }),
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  company_name: z.string().optional(),
  title_position: z.string().optional(),
  email_primary: z.string().email({ message: "Invalid email address" }),
  email_secondary: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  phone_primary: z.string().optional(),
  phone_secondary: z.string().optional(),
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zip: z.string().optional(),
  social_linkedin: z.string().url({ message: "Invalid LinkedIn URL" }).optional().or(z.literal('')),
  social_facebook: z.string().url({ message: "Invalid Facebook URL" }).optional().or(z.literal('')),
  preferred_communication_method: z.enum(communicationMethodOptions).optional(),
  last_contact_date: z.date().optional(),
  next_follow_up_date: z.date().optional(),
  relationship_strength_score: z.number().min(1).max(10).default(5),
  contact_source: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  status: z.enum(statusOptions).default('active'),
});

// TypeScript type derived from the schema
export type PersonFormData = z.infer<typeof personFormSchema>;

// Person type with database fields
export type Person = Tables<'people'>;

// New person data for creation
export type NewPersonData = Omit<TablesInsert<'people'>, 'user_id' | 'id' | 'created_at' | 'updated_at'>;

// Person update data
export type PersonUpdateData = TablesUpdate<'people'>;

// Helper function to get contact type display name
export const getContactTypeDisplayName = (type: ContactType): string => {
  const displayNames: Record<ContactType, string> = {
    client: 'Client',
    lender: 'Lender',
    realtor: 'Realtor',
    investor: 'Investor', 
    vendor: 'Vendor',
    referral_source: 'Referral Source',
    other: 'Other'
  };
  return displayNames[type];
};

// Helper function to get contact type color for badges
export const getContactTypeColor = (type: ContactType): string => {
  const colors: Record<ContactType, string> = {
    client: 'bg-blue-100 text-blue-800',
    lender: 'bg-green-100 text-green-800',
    realtor: 'bg-purple-100 text-purple-800',
    investor: 'bg-yellow-100 text-yellow-800',
    vendor: 'bg-orange-100 text-orange-800',
    referral_source: 'bg-pink-100 text-pink-800',
    other: 'bg-gray-100 text-gray-800'
  };
  return colors[type];
};

// Helper function to format person name
export const formatPersonName = (person: Person): string => {
  return `${person.first_name} ${person.last_name}`.trim();
};

// Helper function to get primary contact info
export const getPrimaryContact = (person: Person): string => {
  if (person.email_primary) return person.email_primary;
  if (person.phone_primary) return person.phone_primary;
  return 'No contact info';
};

// Search/filter types
export interface PersonFilters {
  search?: string;
  contact_type?: ContactType;
  status?: PersonStatus;
  tags?: string[];
}

// Person with related data for detailed views
export interface PersonWithRelations extends Person {
  clients?: Tables<'clients'>[];
  lenders?: Tables<'lenders'>[];
}