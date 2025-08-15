import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonSelector } from '../PersonSelector';
import { Person, ContactType } from '@/features/people/types';

// Mock the hooks
vi.mock('@/hooks/useImprovedPeople', () => ({
  useImprovedPeople: vi.fn(() => ({
    people: mockPeople,
    isLoading: false,
    addPerson: vi.fn()
  }))
}));

// Mock the AddPersonForm component
vi.mock('../AddPersonForm', () => ({
  default: ({ onSubmitSuccess, onCancel }: any) => (
    <div data-testid="add-person-form">
      <button onClick={() => onSubmitSuccess(mockPeople[0])}>Submit</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

const mockPeople: Person[] = [
  {
    id: '1',
    user_id: 'user1',
    contact_type: 'client',
    first_name: 'John',
    last_name: 'Doe',
    email_primary: 'john@example.com',
    phone_primary: '555-0123',
    company_name: 'Acme Corp',
    title_position: 'Manager',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    user_id: 'user1',
    contact_type: 'lender',
    first_name: 'Jane',
    last_name: 'Smith',
    email_primary: 'jane@bank.com',
    phone_primary: '555-0456',
    company_name: 'Big Bank',
    title_position: 'Loan Officer',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('PersonSelector', () => {
  const mockOnPersonSelect = vi.fn();
  const mockOnPersonCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with placeholder text', () => {
    render(
      <PersonSelector
        onPersonSelect={mockOnPersonSelect}
        placeholder="Select a person"
      />
    );

    expect(screen.getByText('Select a person')).toBeInTheDocument();
  });

  it('handles person selection', () => {
    render(
      <PersonSelector
        onPersonSelect={mockOnPersonSelect}
      />
    );

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('John Doe'));

    expect(mockOnPersonSelect).toHaveBeenCalledWith(mockPeople[0]);
  });

  it('handles clear selection when allowClear is true', () => {
    render(
      <PersonSelector
        selectedPersonId="1"
        onPersonSelect={mockOnPersonSelect}
        allowClear={true}
      />
    );

    const clearButtons = screen.getAllByRole('button');
    const clearButton = clearButtons.find(button => 
      button.querySelector('svg')?.classList.contains('lucide-x')
    );
    
    if (clearButton) {
      fireEvent.click(clearButton);
      expect(mockOnPersonSelect).toHaveBeenCalledWith(null);
    }
  });

  it('opens create person dialog', () => {
    render(
      <PersonSelector
        onPersonSelect={mockOnPersonSelect}
      />
    );

    fireEvent.click(screen.getByText('New'));
    expect(screen.getByTestId('add-person-form')).toBeInTheDocument();
  });
});