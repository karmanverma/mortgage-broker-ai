
import { z } from 'zod';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

// Options for Select components
export const employmentStatusOptions = [
  "Employed",
  "Self-Employed",
  "Unemployed",
  "Retired",
] as const;

export const loanTypeOptions = [
  "Conventional",
  "FHA",
  "VA",
  "Other",
] as const;

export const creditScoreRangeOptions = [
  "<600",
  "600-650",
  "651-700",
  "701-750",
  "751+",
] as const;

export const applicationStatusOptions = [
  "New",
  "In Review",
  "Approved",
  "Closed",
] as const;

// Zod schema for form validation
export const clientFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }).optional().or(z.literal('')), // Allow empty string or valid phone
  // dateOfBirth: z.date({ // Removed Date of Birth
  //   required_error: "Date of birth is required",
  //   invalid_type_error: "Invalid date format",
  // }),
  streetAddress: z.string().min(1, { message: "Street address is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(2, { message: "State abbreviation is required" }).max(2),
  zipCode: z.string().min(5, { message: "ZIP code must be 5 digits" }).max(5),
  employmentStatus: z.enum(employmentStatusOptions, {
    required_error: "Employment status is required",
  }),
  annualIncome: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive({ message: "Annual income must be positive" })
  ),
  loanAmountSought: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive({ message: "Loan amount must be positive" })
  ),
  loanType: z.enum(loanTypeOptions, {
    required_error: "Loan type is required",
  }),
  creditScoreRange: z.enum(creditScoreRangeOptions, {
    required_error: "Credit score range is required",
  }),
  applicationStatus: z.enum(applicationStatusOptions, {
    required_error: "Application status is required",
  }),
  notes: z.string().optional(),
});

// TypeScript type derived from the schema
export type ClientFormData = z.infer<typeof clientFormSchema>;

// Client type including generated fields and additional properties used in ClientsPage
export type Client = ClientFormData & {
  id: string; 
  dateAdded: Date;
  // Add missing properties used in ClientsPage
  status?: string;
  avatarUrl?: string;
};

// Add a utility function to map between Supabase DB format and our frontend format
export const mapDbClientToClient = (dbClient: Tables<"clients">): Client => {
  return {
    id: dbClient.id,
    firstName: dbClient.first_name,
    lastName: dbClient.last_name,
    email: dbClient.email,
    phone: dbClient.phone || '',
    streetAddress: dbClient.address_line1 || '',
    city: dbClient.city || '',
    state: dbClient.state || '',
    zipCode: dbClient.zip_code || '',
    employmentStatus: (dbClient.employment_status as any) || 'Employed',
    annualIncome: dbClient.annual_income || 0,
    loanAmountSought: 0, // This needs to be added to the DB or retrieved from another source
    loanType: 'Conventional' as const, // This needs to be added to the DB or retrieved from another source
    creditScoreRange: '<600' as const, // This will need mapping from actual credit_score
    applicationStatus: 'New' as const, // This needs to be added to the DB or retrieved from another source
    notes: '',
    dateAdded: new Date(dbClient.created_at),
    // Map additional properties
    status: dbClient.status || 'active'
  };
};

// Add a utility function to map from our frontend format to Supabase DB format
export const mapClientToDbClient = (client: ClientFormData, userId: string): TablesInsert<"clients"> => {
  // Ensure we're providing required fields for the database insert
  return {
    first_name: client.firstName,
    last_name: client.lastName,
    email: client.email, // This is required by the database
    phone: client.phone,
    address_line1: client.streetAddress,
    city: client.city,
    state: client.state,
    zip_code: client.zipCode,
    employment_status: client.employmentStatus,
    annual_income: client.annualIncome,
    user_id: userId,
    // Map other fields as needed
  };
};
