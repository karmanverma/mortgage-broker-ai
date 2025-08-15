# Implementation Plan

- [x] 1. Database Schema Updates and Core Infrastructure
  - Create realtor_people junction table with proper constraints and indexes
  - Add performance indexes for people-entity relationships
  - Create database function for atomic person-entity creation operations
  - Update RLS policies for new realtor_people table
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 2. Core Hook Development
- [ ] 2.1 Implement usePersonWithEntityCreation hook foundation
  - Write TypeScript interfaces for PersonWithEntityCreationOptions and PersonWithEntityCreationResult
  - Implement basic hook structure with state management for isCreating and error states
  - Create utility functions for data validation and transformation
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

- [ ] 2.2 Add transaction management and error handling
  - Implement atomic person-entity creation with proper rollback on failure
  - Add comprehensive error handling for constraint violations and network errors
  - Create error recovery mechanisms with user-friendly error messages
  - Write unit tests for error scenarios and transaction rollback
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 2.3 Implement existing person selection functionality
  - Add support for existingPersonId parameter in hook
  - Implement logic to skip person creation when existing person is selected
  - Add validation to ensure selected person matches expected contact_type
  - Write unit tests for existing person selection scenarios
  - _Requirements: 1.7, 1.8_

- [ ] 3. Person Selector Component
- [ ] 3.1 Create PersonSelector base component
  - Build searchable dropdown component for person selection
  - Implement filtering by contact_type and user_id
  - Add loading states and empty states for better UX
  - Create TypeScript interfaces for PersonSelectorProps
  - _Requirements: 1.7, 1.8_

- [ ] 3.2 Add advanced search and filtering capabilities
  - Implement fuzzy search across name, email, and company fields
  - Add recent contacts prioritization in search results
  - Create keyboard navigation support for accessibility
  - Write unit tests for search functionality and edge cases
  - _Requirements: 1.7, 1.8_

- [ ] 4. Enhanced Entity Form Components
- [ ] 4.1 Update EnhancedAddClientForm component
  - Integrate PersonSelector component for existing person selection
  - Add conditional rendering to show/hide person fields when existing person is selected
  - Implement form validation that adapts based on person selection mode
  - Update form submission to use usePersonWithEntityCreation hook
  - _Requirements: 1.1, 1.4, 1.5, 1.7, 1.8_

- [ ] 4.2 Update EnhancedAddLenderForm component
  - Integrate PersonSelector component with lender-specific contact_type filtering
  - Add conditional field rendering for existing vs new person creation
  - Implement proper form state management for person selection changes
  - Update form submission logic to handle both creation modes
  - _Requirements: 1.2, 1.4, 1.5, 1.7, 1.8_

- [ ] 4.3 Update realtor form components (create if needed)
  - Create or update realtor form component with PersonSelector integration
  - Implement realtor-specific field validation and form logic
  - Add support for realtor contact_type filtering in person selection
  - Ensure consistent UX patterns across all entity forms
  - _Requirements: 1.3, 1.4, 1.5, 1.7, 1.8_

- [ ] 5. People Page Integration
- [ ] 5.1 Update AddPersonForm for multi-entity creation
  - Add contact_type selection with visible dropdown on people page
  - Implement conditional entity creation based on selected contact_type
  - Update form to automatically create corresponding entity records
  - Add proper validation for contact_type specific requirements
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6_

- [ ] 5.2 Update PeopleList and PeopleManager components
  - Display entity associations for each person (client, lender, realtor badges)
  - Add filtering and sorting by contact_type and entity associations
  - Implement bulk operations for managing person-entity relationships
  - Update person detail views to show all associated entity information
  - _Requirements: 3.3, 3.4_

- [ ] 6. Improved Hooks Integration
- [ ] 6.1 Update useImprovedClients hook
  - Integrate with new person-entity creation workflow
  - Ensure optimistic updates work correctly with person data
  - Add support for querying clients with their associated people data
  - Update error handling to work with new transaction-based approach
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_

- [ ] 6.2 Update useImprovedLenders hook
  - Integrate with person-entity creation system
  - Add support for lender-people relationship queries
  - Implement optimistic updates for lender creation with person data
  - Ensure consistency with other improved hooks patterns
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_

- [ ] 6.3 Update useImprovedRealtors hook (create if needed)
  - Create or update realtor hook to support person-entity integration
  - Implement realtor-people relationship management
  - Add support for realtor_people junction table operations
  - Ensure consistent API with other improved hooks
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.6_

- [ ] 7. Indirect Relationship Implementation
- [ ] 7.1 Update opportunities to show people connections
  - Modify opportunity queries to include people data through client relationships
  - Update opportunity display components to show associated people information
  - Implement filtering and searching opportunities by associated people
  - Add people context to opportunity activity tracking
  - _Requirements: 3.1, 3.3, 3.4_

- [ ] 7.2 Update loans to show people connections
  - Modify loan queries to include people data through client relationships
  - Update loan display components to show all associated people (client, lender, realtor)
  - Implement comprehensive people-based filtering for loan pipeline
  - Add people context to loan status updates and communications
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 8. Data Migration and Consistency
- [ ] 8.1 Create data migration scripts
  - Write migration to populate realtor_people junction table for existing realtors
  - Create script to ensure all existing entities have proper people relationships
  - Implement data validation to identify and fix orphaned records
  - Add migration rollback procedures for safe deployment
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 8.2 Implement data consistency checks
  - Create database triggers to maintain referential integrity
  - Add validation functions to prevent orphaned person records
  - Implement cascade rules for person deletion scenarios
  - Write automated tests to verify data consistency after operations
  - _Requirements: 2.5, 4.4_

- [ ] 9. Comprehensive Testing Suite
- [ ] 9.1 Write unit tests for core functionality
  - Test usePersonWithEntityCreation hook with all entity types
  - Test PersonSelector component with various search scenarios
  - Test form components with both new and existing person selection
  - Test error handling and recovery mechanisms
  - _Requirements: 1.1, 1.2, 1.3, 1.7, 1.8, 4.1, 4.2, 4.3, 4.4_

- [ ] 9.2 Write integration tests for complete workflows
  - Test end-to-end person-entity creation from all form contexts
  - Test data consistency across person-entity relationships
  - Test indirect relationship queries for opportunities and loans
  - Test concurrent user scenarios and race condition handling
  - _Requirements: 1.6, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9.3 Write performance tests
  - Test query performance with large datasets (>1000 people, >500 entities)
  - Test concurrent creation scenarios with multiple users
  - Verify sub-100ms query response times for all person-entity operations
  - Test memory usage and potential leaks in long-running sessions
  - _Requirements: 2.6, 4.4_

- [ ] 10. User Experience and Accessibility
- [ ] 10.1 Implement consistent loading and error states
  - Add loading spinners and skeleton screens for all person-entity operations
  - Implement consistent error message display across all forms
  - Add success notifications with clear action confirmations
  - Ensure all loading states are accessible with proper ARIA labels
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 10.2 Add accessibility compliance
  - Ensure PersonSelector component meets WCAG 2.1 AA standards
  - Add proper keyboard navigation for all form interactions
  - Implement screen reader support for person selection workflows
  - Test with assistive technologies and fix identified issues
  - _Requirements: 1.7, 1.8_

- [ ] 11. Documentation and Training
- [ ] 11.1 Create developer documentation
  - Document usePersonWithEntityCreation hook API and usage patterns
  - Create code examples for implementing person-entity forms
  - Document database schema changes and migration procedures
  - Write troubleshooting guide for common integration issues
  - _Requirements: 2.6_

- [ ] 11.2 Create user documentation
  - Write user guide for person selection workflows
  - Create help documentation for entity creation processes
  - Document new features and workflow changes for end users
  - Create training materials for different user personas
  - _Requirements: 1.4, 1.5, 1.6_

- [ ] 12. Performance Monitoring and Optimization
- [ ] 12.1 Implement performance monitoring
  - Add performance metrics tracking for person-entity operations
  - Implement query performance monitoring with alerting
  - Create dashboards for monitoring system health and usage patterns
  - Set up automated performance regression testing
  - _Requirements: 2.6, 4.4_

- [ ] 12.2 Optimize database queries and indexes
  - Analyze query execution plans and optimize slow queries
  - Add additional indexes based on actual usage patterns
  - Implement query result caching where appropriate
  - Monitor and optimize memory usage for large result sets
  - _Requirements: 2.4, 2.6_