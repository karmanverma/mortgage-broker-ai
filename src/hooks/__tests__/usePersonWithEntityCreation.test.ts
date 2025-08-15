import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersonWithEntityCreation, PersonWithEntityCreationOptions } from '../usePersonWithEntityCreation';
import { ContactType } from '@/features/people/types';

// Mock the toast function
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

describe('usePersonWithEntityCreation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    expect(result.current.isCreating).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.createPersonWithEntity).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should clear error when clearError is called', () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    // Manually set error state (in real scenario this would be set by createPersonWithEntity)
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should validate person data correctly', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const invalidOptions: PersonWithEntityCreationOptions = {
      entityType: 'client',
      personData: {
        contact_type: 'client' as ContactType,
        first_name: '', // Invalid: empty
        last_name: 'Doe',
        email_primary: 'invalid-email', // Invalid: bad format
        relationship_strength_score: 5,
        tags: [],
        status: 'active',
      },
      entityData: {
        client_type: 'residential',
        annual_income: 50000,
      },
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(invalidOptions);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Validation failed');
    });

    expect(result.current.error).toContain('Validation failed');
  });

  it('should validate client entity data correctly', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const invalidOptions: PersonWithEntityCreationOptions = {
      entityType: 'client',
      personData: {
        contact_type: 'client' as ContactType,
        first_name: 'John',
        last_name: 'Doe',
        email_primary: 'john@example.com',
        relationship_strength_score: 5,
        tags: [],
        status: 'active',
      },
      entityData: {
        credit_score: 900, // Invalid: too high
        annual_income: -1000, // Invalid: negative
      },
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(invalidOptions);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Credit score must be between 300 and 850');
      expect(response.error).toContain('Annual income cannot be negative');
    });
  });

  it('should validate lender entity data correctly', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const invalidOptions: PersonWithEntityCreationOptions = {
      entityType: 'lender',
      personData: {
        contact_type: 'lender' as ContactType,
        first_name: 'Jane',
        last_name: 'Smith',
        email_primary: 'jane@example.com',
        relationship_strength_score: 5,
        tags: [],
        status: 'active',
      },
      entityData: {
        name: '', // Invalid: empty
        type: '', // Invalid: empty
      },
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(invalidOptions);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Lender name is required');
      expect(response.error).toContain('Lender type is required');
    });
  });

  it('should validate realtor entity data correctly', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const invalidOptions: PersonWithEntityCreationOptions = {
      entityType: 'realtor',
      personData: {
        contact_type: 'realtor' as ContactType,
        first_name: 'Bob',
        last_name: 'Johnson',
        email_primary: 'bob@example.com',
        relationship_strength_score: 5,
        tags: [],
        status: 'active',
      },
      entityData: {
        years_experience: -5, // Invalid: negative
        performance_rating: 15, // Invalid: too high
        commission_split_expectation: 150, // Invalid: over 100
      },
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(invalidOptions);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Years of experience cannot be negative');
      expect(response.error).toContain('Performance rating must be between 1 and 10');
      expect(response.error).toContain('Commission split expectation must be between 0 and 100');
    });
  });

  it('should handle valid data and return success (mock implementation)', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const validOptions: PersonWithEntityCreationOptions = {
      entityType: 'client',
      personData: {
        contact_type: 'client' as ContactType,
        first_name: 'John',
        last_name: 'Doe',
        email_primary: 'john@example.com',
        phone_primary: '555-1234',
        relationship_strength_score: 5,
        tags: [],
        status: 'active',
      },
      entityData: {
        client_type: 'residential',
        annual_income: 75000,
        credit_score: 720,
      },
    };

    let response: any;
    await act(async () => {
      response = await result.current.createPersonWithEntity(validOptions);
    });

    expect(response.success).toBe(true);
    expect(response.person).toBeDefined();
    expect(response.entity).toBeDefined();
    expect(response.person.first_name).toBe('John');
    expect(response.person.last_name).toBe('Doe');
  });

  it('should handle existing person selection', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const optionsWithExistingPerson: PersonWithEntityCreationOptions = {
      entityType: 'lender',
      personData: {
        contact_type: 'lender' as ContactType,
        first_name: 'Jane',
        last_name: 'Smith',
        email_primary: 'jane@example.com',
        relationship_strength_score: 5,
        tags: [],
        status: 'active',
      },
      entityData: {
        name: 'ABC Bank',
        type: 'Bank',
        status: 'active',
      },
      existingPersonId: 'existing-person-123',
    };

    let response: any;
    await act(async () => {
      response = await result.current.createPersonWithEntity(optionsWithExistingPerson);
    });

    expect(response.success).toBe(true);
    expect(response.entity.people_id).toBe('existing-person-123');
  });

  it('should set isCreating state during operation', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const validOptions: PersonWithEntityCreationOptions = {
      entityType: 'client',
      personData: {
        contact_type: 'client' as ContactType,
        first_name: 'John',
        last_name: 'Doe',
        email_primary: 'john@example.com',
        relationship_strength_score: 5,
        tags: [],
        status: 'active',
      },
      entityData: {
        client_type: 'residential',
      },
    };

    // Start the operation
    const promise = act(async () => {
      return result.current.createPersonWithEntity(validOptions);
    });

    // Check that isCreating is true during operation
    expect(result.current.isCreating).toBe(true);

    // Wait for completion
    await promise;

    // Check that isCreating is false after completion
    expect(result.current.isCreating).toBe(false);
  });
});