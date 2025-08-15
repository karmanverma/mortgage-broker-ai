import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersonWithEntityCreation } from '../usePersonWithEntityCreation';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock the toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn()
}));

describe('usePersonWithEntityCreation - Existing Person Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle existing person selection for client creation', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const optionsWithExistingPerson = {
      entityType: 'client' as const,
      personData: {
        // Person data not required when using existing person
        first_name: '',
        last_name: '',
        email_primary: '',
        contact_type: 'client' as const,
      },
      entityData: {
        client_type: 'residential' as const,
        annual_income: 75000,
        credit_score: 720,
      },
      existingPersonId: 'existing-person-123'
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(optionsWithExistingPerson);
      expect(response.success).toBe(true);
      expect(response.isExistingPerson).toBe(true);
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle existing person selection for lender creation', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const optionsWithExistingPerson = {
      entityType: 'lender' as const,
      personData: {
        first_name: '',
        last_name: '',
        email_primary: '',
        contact_type: 'lender' as const,
      },
      entityData: {
        name: 'Test Bank',
        type: 'Commercial Bank',
        status: 'active',
      },
      existingPersonId: 'existing-person-456'
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(optionsWithExistingPerson);
      expect(response.success).toBe(true);
      expect(response.isExistingPerson).toBe(true);
    });
  });

  it('should handle existing person selection for realtor creation', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const optionsWithExistingPerson = {
      entityType: 'realtor' as const,
      personData: {
        first_name: '',
        last_name: '',
        email_primary: '',
        contact_type: 'realtor' as const,
      },
      entityData: {
        license_number: 'RE123456',
        license_state: 'CA',
        brokerage_name: 'Test Realty',
        years_experience: 5,
      },
      existingPersonId: 'existing-person-789'
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(optionsWithExistingPerson);
      expect(response.success).toBe(true);
      expect(response.isExistingPerson).toBe(true);
    });
  });

  it('should create new person when existingPersonId is not provided', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const optionsWithNewPerson = {
      entityType: 'client' as const,
      personData: {
        first_name: 'John',
        last_name: 'Doe',
        email_primary: 'john@example.com',
        contact_type: 'client' as const,
      },
      entityData: {
        client_type: 'residential' as const,
        annual_income: 75000,
        credit_score: 720,
      }
      // No existingPersonId provided
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(optionsWithNewPerson);
      expect(response.success).toBe(true);
      expect(response.isExistingPerson).toBeFalsy();
    });
  });

  it('should skip person data validation when using existing person', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const optionsWithInvalidPersonDataButExistingPerson = {
      entityType: 'client' as const,
      personData: {
        // Invalid person data - but should be ignored when using existing person
        first_name: '',
        last_name: '',
        email_primary: 'invalid-email',
        contact_type: 'client' as const,
      },
      entityData: {
        client_type: 'residential' as const,
        annual_income: 75000,
        credit_score: 720,
      },
      existingPersonId: 'existing-person-123'
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(optionsWithInvalidPersonDataButExistingPerson);
      expect(response.success).toBe(true); // Should succeed despite invalid person data
      expect(response.isExistingPerson).toBe(true);
    });
  });

  it('should still validate entity data when using existing person', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const optionsWithInvalidEntityData = {
      entityType: 'client' as const,
      personData: {
        first_name: '',
        last_name: '',
        email_primary: '',
        contact_type: 'client' as const,
      },
      entityData: {
        annual_income: -1000, // Invalid - negative income
        credit_score: 900, // Invalid - too high
      },
      existingPersonId: 'existing-person-123'
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(optionsWithInvalidEntityData);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Validation failed');
    });
  });
});