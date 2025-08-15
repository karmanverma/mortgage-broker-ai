import { useState, useCallback } from 'react';
import { PersonFormData, ContactType } from '@/features/people/types';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// Entity-specific form data types
export interface ClientFormData {
  client_type?: 'residential' | 'commercial' | 'investor';
  annual_income?: number;
  credit_score?: number;
  debt_to_income_ratio?: number;
  first_time_buyer?: boolean;
  veteran_status?: boolean;
  employment_status?: string;
  employer_name?: string;
  job_title?: string;
  marital_status?: string;
  dependents_count?: number;
  housing_situation?: string;
  date_of_birth?: string;
  // Additional client-specific fields can be added here
}

export interface LenderFormData {
  name: string;
  type: string;
  status?: string;
  notes?: string;
  // Additional lender-specific fields can be added here
}

export interface RealtorFormData {
  license_number?: string;
  license_state?: string;
  brokerage_name?: string;
  specialty_areas?: string[];
  years_experience?: number;
  performance_rating?: number;
  active_status?: boolean;
  geographic_focus?: string;
  price_range_focus?: string;
  communication_style?: string;
  technology_adoption_level?: string;
  preferred_lenders?: string[];
  commission_split_expectation?: number;
  referral_fee_standard?: number;
  marketing_co_op_available?: boolean;
  average_deals_per_month?: number;
  total_deals_closed?: number;
  total_referrals_sent?: number;
  relationship_level?: number;
  notes?: string;
  // Additional realtor-specific fields can be added here
}

// Union type for all entity form data
export type EntityFormData = ClientFormData | LenderFormData | RealtorFormData;

// Options interface for the hook
export interface PersonWithEntityCreationOptions {
  entityType: 'client' | 'lender' | 'realtor';
  personData: PersonFormData;
  entityData: EntityFormData;
  existingPersonId?: string; // For selecting existing person instead of creating new one
}

// Result interface for the hook
export interface PersonWithEntityCreationResult {
  createPersonWithEntity: (options: PersonWithEntityCreationOptions) => Promise<{
    success: boolean;
    person?: Tables<'people'>;
    entity?: Tables<'clients'> | Tables<'lenders'> | Tables<'realtors'>;
    isExistingPerson?: boolean;
    error?: string;
  }>;
  isCreating: boolean;
  error: string | null;
  clearError: () => void;
}

// Validation utility functions
const validatePersonData = (personData: PersonFormData, existingPersonId?: string): string[] => {
  const errors: string[] = [];
  
  // If using existing person, skip person data validation
  if (existingPersonId) {
    return errors;
  }
  
  if (!personData.first_name?.trim()) {
    errors.push('First name is required');
  }
  
  if (!personData.last_name?.trim()) {
    errors.push('Last name is required');
  }
  
  if (!personData.email_primary?.trim()) {
    errors.push('Primary email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personData.email_primary)) {
    errors.push('Invalid email format');
  }
  
  if (!personData.contact_type) {
    errors.push('Contact type is required');
  }
  
  return errors;
};

// Validation for existing person selection
const validateExistingPersonSelection = async (existingPersonId: string, expectedContactType: string, userId: string): Promise<string[]> => {
  const errors: string[] = [];
  
  try {
    console.log(`[validateExistingPersonSelection] Validating person ${existingPersonId} for contact type ${expectedContactType}`);
    
    const { data: person, error } = await supabase
      .from('people')
      .select('contact_type')
      .eq('id', existingPersonId)
      .eq('user_id', userId)
      .single();
    
    if (error || !person) {
      errors.push('Selected person not found');
    } else if (person.contact_type !== expectedContactType) {
      errors.push(`Selected person has contact type '${person.contact_type}' but expected '${expectedContactType}'`);
    }
    
  } catch (error) {
    errors.push('Failed to validate selected person');
  }
  
  return errors;
};

const validateEntityData = (entityType: string, entityData: EntityFormData): string[] => {
  const errors: string[] = [];
  
  switch (entityType) {
    case 'client':
      // Client-specific validation
      const clientData = entityData as ClientFormData;
      if (clientData.annual_income !== undefined && clientData.annual_income < 0) {
        errors.push('Annual income cannot be negative');
      }
      if (clientData.credit_score !== undefined && (clientData.credit_score < 300 || clientData.credit_score > 850)) {
        errors.push('Credit score must be between 300 and 850');
      }
      break;
      
    case 'lender':
      // Lender-specific validation
      const lenderData = entityData as LenderFormData;
      if (!lenderData.name?.trim()) {
        errors.push('Lender name is required');
      }
      if (!lenderData.type?.trim()) {
        errors.push('Lender type is required');
      }
      break;
      
    case 'realtor':
      // Realtor-specific validation
      const realtorData = entityData as RealtorFormData;
      if (realtorData.years_experience !== undefined && realtorData.years_experience < 0) {
        errors.push('Years of experience cannot be negative');
      }
      if (realtorData.performance_rating !== undefined && (realtorData.performance_rating < 1 || realtorData.performance_rating > 10)) {
        errors.push('Performance rating must be between 1 and 10');
      }
      if (realtorData.commission_split_expectation !== undefined && (realtorData.commission_split_expectation < 0 || realtorData.commission_split_expectation > 100)) {
        errors.push('Commission split expectation must be between 0 and 100');
      }
      if (realtorData.referral_fee_standard !== undefined && realtorData.referral_fee_standard < 0) {
        errors.push('Referral fee cannot be negative');
      }
      if (realtorData.average_deals_per_month !== undefined && realtorData.average_deals_per_month < 0) {
        errors.push('Average deals per month cannot be negative');
      }
      if (realtorData.total_deals_closed !== undefined && realtorData.total_deals_closed < 0) {
        errors.push('Total deals closed cannot be negative');
      }
      if (realtorData.total_referrals_sent !== undefined && realtorData.total_referrals_sent < 0) {
        errors.push('Total referrals sent cannot be negative');
      }
      if (realtorData.relationship_level !== undefined && (realtorData.relationship_level < 1 || realtorData.relationship_level > 10)) {
        errors.push('Relationship level must be between 1 and 10');
      }
      break;
  }
  
  return errors;
};

// Data transformation utilities
const transformPersonDataForDatabase = (personData: PersonFormData, userId: string): TablesInsert<'people'> => {
  return {
    user_id: userId,
    contact_type: personData.contact_type,
    first_name: personData.first_name,
    last_name: personData.last_name,
    company_name: personData.company_name || null,
    title_position: personData.title_position || null,
    email_primary: personData.email_primary,
    email_secondary: personData.email_secondary || null,
    phone_primary: personData.phone_primary || null,
    phone_secondary: personData.phone_secondary || null,
    address_street: personData.address_street || null,
    address_city: personData.address_city || null,
    address_state: personData.address_state || null,
    address_zip: personData.address_zip || null,
    preferred_communication_method: personData.preferred_communication_method || null,
    last_contact_date: personData.last_contact_date?.toISOString() || null,
    next_follow_up_date: personData.next_follow_up_date?.toISOString() || null,
    relationship_strength_score: personData.relationship_strength_score || 5,
    contact_source: personData.contact_source || null,
    tags: personData.tags || [],
    notes: personData.notes || null,
    status: personData.status || 'active',
    social_linkedin: null, // Will be added in future iterations
    social_facebook: null, // Will be added in future iterations
  };
};

const transformClientDataForDatabase = (
  clientData: ClientFormData, 
  peopleId: string, 
  userId: string
): TablesInsert<'clients'> => {
  return {
    user_id: userId,
    people_id: peopleId,
    client_type: clientData.client_type || null,
    annual_income: clientData.annual_income || null,
    credit_score: clientData.credit_score || null,
    debt_to_income_ratio: clientData.debt_to_income_ratio || null,
    first_time_buyer: clientData.first_time_buyer || null,
    veteran_status: clientData.veteran_status || null,
    employment_status: clientData.employment_status || null,
    employer_name: clientData.employer_name || null,
    job_title: clientData.job_title || null,
    marital_status: clientData.marital_status || null,
    dependents_count: clientData.dependents_count || null,
    housing_situation: clientData.housing_situation || null,
    date_of_birth: clientData.date_of_birth || null,
    // Set default values for required fields that aren't in the form
    client_status: 'active',
    status: 'active',
  };
};

const transformLenderDataForDatabase = (
  lenderData: LenderFormData, 
  peopleId: string, 
  userId: string
): TablesInsert<'lenders'> => {
  return {
    user_id: userId,
    people_id: peopleId,
    name: lenderData.name,
    type: lenderData.type,
    status: lenderData.status || 'active',
    notes: lenderData.notes || null,
  };
};

const transformRealtorDataForDatabase = (
  realtorData: RealtorFormData, 
  peopleId: string, 
  userId: string
): TablesInsert<'realtors'> => {
  return {
    user_id: userId,
    people_id: peopleId,
    license_number: realtorData.license_number || null,
    license_state: realtorData.license_state || null,
    brokerage_name: realtorData.brokerage_name || null,
    specialty_areas: realtorData.specialty_areas || null,
    years_experience: realtorData.years_experience || null,
    performance_rating: realtorData.performance_rating || null,
    active_status: realtorData.active_status ?? true, // Default to active
    geographic_focus: realtorData.geographic_focus || null,
    price_range_focus: realtorData.price_range_focus || null,
    communication_style: realtorData.communication_style || null,
    technology_adoption_level: realtorData.technology_adoption_level || null,
    preferred_lenders: realtorData.preferred_lenders || null,
    commission_split_expectation: realtorData.commission_split_expectation || null,
    referral_fee_standard: realtorData.referral_fee_standard || null,
    marketing_co_op_available: realtorData.marketing_co_op_available || null,
    average_deals_per_month: realtorData.average_deals_per_month || null,
    total_deals_closed: realtorData.total_deals_closed || null,
    total_referrals_sent: realtorData.total_referrals_sent || null,
    relationship_level: realtorData.relationship_level || null,
    notes: realtorData.notes || null,
  };
};

// Error handling utility
const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    // Handle specific database error codes
    if (error.message.includes('23505')) {
      return 'A person with this email already exists. Please use a different email or select the existing person.';
    }
    if (error.message.includes('23503')) {
      return 'Invalid reference data provided. Please check your input and try again.';
    }
    if (error.message.includes('23514')) {
      return 'Data validation failed. Please check your input values.';
    }
    if (error.message.includes('42501')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('connection')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

// Transaction management function
interface TransactionOptions {
  entityType: 'client' | 'lender' | 'realtor';
  personData: PersonFormData;
  entityData: EntityFormData;
  existingPersonId?: string;
  userId: string;
}

const createPersonWithEntityTransaction = async (options: TransactionOptions) => {
  const { entityType, personData, entityData, existingPersonId, userId } = options;
  
  try {
    let personId: string;
    let personRecord: any = null;
    
    if (existingPersonId) {
      // Use existing person - fetch existing person data
      personId = existingPersonId;
      console.log(`[createPersonWithEntityTransaction] Using existing person: ${existingPersonId}`);
      
      const { data: existingPerson, error: fetchError } = await supabase
        .from('people')
        .select('*')
        .eq('id', existingPersonId)
        .eq('user_id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      personRecord = existingPerson;
      
    } else {
      // Create new person
      const personDataForDb = transformPersonDataForDatabase(personData, userId);
      console.log('[createPersonWithEntityTransaction] Creating new person');
      
      const { data: createdPerson, error: personError } = await supabase
        .from('people')
        .insert(personDataForDb)
        .select('*')
        .single();
      
      if (personError) throw personError;
      personId = createdPerson.id;
      personRecord = createdPerson;
    }
    
    // Prepare entity data with the correct person ID
    let entityDataForDb;
    let entityRecord;
    
    switch (entityType) {
      case 'client':
        entityDataForDb = transformClientDataForDatabase(
          entityData as ClientFormData, 
          personId, 
          userId
        );
        
        console.log(`[createPersonWithEntityTransaction] Creating client entity`);
        const { data: createdClient, error: clientError } = await supabase
          .from('clients')
          .insert(entityDataForDb)
          .select('*')
          .single();
        
        if (clientError) throw clientError;
        entityRecord = createdClient;
        
        // Create client_people junction entry
        const { error: clientJunctionError } = await supabase
          .from('client_people')
          .insert({
            client_id: createdClient.id,
            person_id: personId,
            user_id: userId,
            is_primary: true,
            relationship_type: 'primary_client'
          });
        
        if (clientJunctionError) throw clientJunctionError;
        break;
        
      case 'lender':
        entityDataForDb = transformLenderDataForDatabase(
          entityData as LenderFormData, 
          personId, 
          userId
        );
        
        console.log(`[createPersonWithEntityTransaction] Creating lender entity`);
        const { data: createdLender, error: lenderError } = await supabase
          .from('lenders')
          .insert(entityDataForDb)
          .select('*')
          .single();
        
        if (lenderError) throw lenderError;
        entityRecord = createdLender;
        
        // Create lender_people junction entry
        const { error: lenderJunctionError } = await supabase
          .from('lender_people')
          .insert({
            lender_id: createdLender.id,
            person_id: personId,
            user_id: userId,
            is_primary: true,
            relationship_type: 'contact'
          });
        
        if (lenderJunctionError) throw lenderJunctionError;
        break;
        
      case 'realtor':
        entityDataForDb = transformRealtorDataForDatabase(
          entityData as RealtorFormData, 
          personId, 
          userId
        );
        
        console.log(`[createPersonWithEntityTransaction] Creating realtor entity`);
        const { data: createdRealtor, error: realtorError } = await supabase
          .from('realtors')
          .insert(entityDataForDb)
          .select('*')
          .single();
        
        if (realtorError) throw realtorError;
        entityRecord = createdRealtor;
        
        // Create realtor_people junction entry
        const { error: realtorJunctionError } = await supabase
          .from('realtor_people')
          .insert({
            realtor_id: createdRealtor.id,
            person_id: personId,
            user_id: userId,
            is_primary: true,
            relationship_type: 'contact'
          });
        
        if (realtorJunctionError) throw realtorJunctionError;
        break;
        
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }

    console.log(`[createPersonWithEntityTransaction] Successfully created ${entityType} with person`);

    return {
      success: true,
      person: personRecord,
      entity: entityRecord,
      isExistingPerson: !!existingPersonId
    };
    
  } catch (error) {
    console.error('[createPersonWithEntityTransaction] Error:', error);
    throw error;
  }
};



// Main hook implementation
export function usePersonWithEntityCreation(): PersonWithEntityCreationResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createPersonWithEntity = useCallback(async (options: PersonWithEntityCreationOptions) => {
    const { entityType, personData, entityData, existingPersonId } = options;
    
    setIsCreating(true);
    setError(null);

    try {
      // Validate input data
      const personErrors = validatePersonData(personData, existingPersonId);
      const entityErrors = validateEntityData(entityType, entityData);
      
      // If using existing person, validate the selection
      let existingPersonErrors: string[] = [];
      if (existingPersonId) {
        existingPersonErrors = await validateExistingPersonSelection(existingPersonId, entityType, user.id);
      }
      
      const allErrors = [...personErrors, ...entityErrors, ...existingPersonErrors];
      
      if (allErrors.length > 0) {
        throw new Error(`Validation failed: ${allErrors.join(', ')}`);
      }

      // Check user authentication
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use database function for atomic transaction
      const result = await createPersonWithEntityTransaction({
        entityType,
        personData,
        entityData,
        existingPersonId,
        userId: user.id
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create person with entity');
      }

      const successMessage = result.isExistingPerson 
        ? `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} created with existing person`
        : `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} created successfully`;
      
      toast({
        title: "Success",
        description: successMessage,
      });

      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['people'] });
      
      if (entityType === 'client') {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      } else if (entityType === 'lender') {
        queryClient.invalidateQueries({ queryKey: ['lenders'] });
      } else if (entityType === 'realtor') {
        queryClient.invalidateQueries({ queryKey: ['realtors'] });
      }

      return result;

    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsCreating(false);
    }
  }, [user]);

  return {
    createPersonWithEntity,
    isCreating,
    error,
    clearError,
  };
}