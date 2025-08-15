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

describe('usePersonWithEntityCreation - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle validation errors correctly', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const invalidOptions = {
      entityType: 'client' as const,
      personData: {
        first_name: '', // Invalid - empty
        last_name: 'Doe',
        email_primary: 'invalid-email', // Invalid format
        contact_type: 'client' as const,
      },
      entityData: {
        annual_income: -1000, // Invalid - negative
        credit_score: 900, // Invalid - too high
      }
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(invalidOptions);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Validation failed');
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should handle authentication errors', async () => {
    // Mock unauthenticated user
    vi.mocked(require('@/contexts/AuthContext').useAuth).mockReturnValue({
      user: null
    });

    const { result } = renderHook(() => usePersonWithEntityCreation());

    const validOptions = {
      entityType: 'client' as const,
      personData: {
        first_name: 'John',
        last_name: 'Doe',
        email_primary: 'john@example.com',
        contact_type: 'client' as const,
      },
      entityData: {
        annual_income: 75000,
        credit_score: 720,
      }
    };

    await act(async () => {
      const response = await result.current.createPersonWithEntity(validOptions);
      expect(response.success).toBe(false);
      expect(response.error).toBe('User not authenticated');
    });
  });

  it('should clear errors when clearError is called', () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    // Simulate an error state
    act(() => {
      result.current.createPersonWithEntity({
        entityType: 'client',
        personData: { first_name: '', last_name: '', email_primary: '', contact_type: 'client' },
        entityData: {}
      });
    });

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle different entity types correctly', async () => {
    const { result } = renderHook(() => usePersonWithEntityCreation());

    const entityTypes = ['client', 'lender', 'realtor'] as const;

    for (const entityType of entityTypes) {
      const options = {
        entityType,
        personData: {
          first_name: 'John',
          last_name: 'Doe',
          email_primary: 'john@example.com',
          contact_type: entityType,
        },
        entityData: entityType === 'lender' ? { name: 'Test Bank', type: 'Bank' } : {}
      };

      await act(async () => {
        const response = await result.current.createPersonWithEntity(options);
        expect(response.success).toBe(true);
      });
    }
  });
});