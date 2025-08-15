# People-Client-Lender Integration Requirements

## Introduction

This specification addresses the critical issues in the current people management system and establishes a scalable architecture for integrating people with all business entities (clients, lenders, realtors). The system currently fails to properly create and link entity records when people are created from different contexts, leading to orphaned person records and broken user workflows. The enhanced architecture will create a unified people management system that serves as the foundation for all business relationships, with indirect connections to opportunities and loan pipelines through their respective entity relationships.

## Current State Analysis

### Database Structure Issues
1. **Multiple Relationship Patterns**: The system uses both direct foreign keys (`clients.people_id`, `lenders.people_id`, `realtors.people_id`) and junction tables (`client_people`, `lender_people`)
2. **Inconsistent Data Flow**: Person creation doesn't automatically trigger client/lender/realtor creation
3. **Broken Callback Chain**: The `usePersonWithEntityCreation` hook isn't properly integrated with form components
4. **Missing Junction Table**: Realtors lack a junction table for many-to-many relationships like clients and lenders have
5. **Query Complexity**: Multiple foreign key relationships to `people` table cause Supabase query ambiguity

### User Flow Problems
1. **Orphaned Records**: Creating person from client/lender/realtor forms only creates person record
2. **Manual Linking Required**: Users must manually create client/lender/realtor records after person creation
3. **Inconsistent UX**: Different behavior between people page and entity-specific forms
4. **Missing Person Selection**: No ability to select existing person when creating new client/lender/realtor
5. **Data Integrity Issues**: Missing relationships between people and their business entities

## Requirements

### Requirement 1: Unified Person-Entity Creation

**User Story:** As a mortgage broker, I want to create a person from any context (people page, client form, lender form, realtor form) and have the appropriate business entity automatically created based on the contact type.

#### Acceptance Criteria
1. WHEN I create a person with contact_type "client" from any form THEN a client record SHALL be automatically created and linked
2. WHEN I create a person with contact_type "lender" from any form THEN a lender record SHALL be automatically created and linked
3. WHEN I create a person with contact_type "realtor" from any form THEN a realtor record SHALL be automatically created and linked
4. WHEN creating from entity-specific forms THEN the contact type SHALL be pre-selected and hidden
5. WHEN creating from people page THEN the contact type SHALL be selectable and visible
6. WHEN a person has multiple roles THEN they SHALL be able to exist as multiple entity types simultaneously
7. WHEN creating a client/lender/realtor and a person already exists THEN the user SHALL be able to select the existing person and continue with entity-specific fields
8. WHEN selecting an existing person for entity creation THEN only the entity-specific fields SHALL be required for completion

### Requirement 2: Scalable Multi-Entity Architecture

**User Story:** As a system architect, I want a scalable data model that supports all business entities (clients, lenders, realtors) with consistent patterns and ensures data integrity across the entire system.

#### Acceptance Criteria
1. WHEN a person is created THEN it SHALL have a single, authoritative record in the people table
2. WHEN business entities (clients, lenders, realtors) are created THEN they SHALL reference the people table via foreign key
3. WHEN multiple people are associated with an entity THEN junction tables SHALL be used for many-to-many relationships
4. WHEN querying entities THEN the system SHALL efficiently join with people data without ambiguity
5. WHEN a person is deleted THEN all related entity records SHALL be handled according to cascade rules
6. WHEN new entity types are added THEN they SHALL follow the same people-centric pattern

### Requirement 3: Indirect Entity Relationships

**User Story:** As a mortgage broker, I want opportunities and loan pipelines to be connected to people through their associated business entities, enabling comprehensive relationship tracking.

#### Acceptance Criteria
1. WHEN an opportunity is created for a client THEN it SHALL be linked to the client's associated people
2. WHEN a loan is created THEN it SHALL be connected to people through the client relationship
3. WHEN viewing a person's profile THEN I SHALL see all related opportunities and loans through their entity connections
4. WHEN searching for opportunities or loans THEN I SHALL be able to filter by associated people
5. WHEN a person's entity relationship changes THEN their opportunity and loan connections SHALL be updated accordingly

### Requirement 4: Robust Error Handling

**User Story:** As a user, I want clear feedback when person/entity creation fails and the ability to recover from errors.

#### Acceptance Criteria
1. WHEN person creation succeeds but entity creation fails THEN the user SHALL receive a warning with recovery options
2. WHEN database constraints are violated THEN the user SHALL receive clear, actionable error messages
3. WHEN network errors occur THEN the system SHALL retry operations and provide status updates
4. WHEN partial failures occur THEN the system SHALL maintain data consistency and provide rollback options

### Requirement 4: Scalable Architecture

**User Story:** As a system administrator, I want an architecture that can scale to handle thousands of users and millions of records efficiently.

#### Acceptance Criteria
1. WHEN the system grows THEN database queries SHALL maintain sub-100ms response times
2. WHEN concurrent users create records THEN the system SHALL handle race conditions gracefully
3. WHEN the data model evolves THEN migrations SHALL be backward compatible
4. WHEN new entity types are added THEN the system SHALL accommodate them without major refactoring

### Requirement 5: Audit and Compliance

**User Story:** As a compliance officer, I want complete audit trails of all person and entity creation, modification, and deletion activities.

#### Acceptance Criteria
1. WHEN any person or entity record is created THEN an activity log SHALL be generated
2. WHEN records are modified THEN the changes SHALL be tracked with timestamps and user attribution
3. WHEN records are deleted THEN the deletion SHALL be logged with reason codes
4. WHEN compliance reports are needed THEN the system SHALL provide complete audit trails
5. WHEN data retention policies apply THEN the system SHALL enforce them automatically

## Data Model Questions

### 1. Relationship Strategy
**Question:** Should we standardize on junction tables for all entity-person relationships or maintain direct foreign keys?

**Current State:** Mixed approach with both `clients.people_id` and `client_people` table

**Recommendation Needed:** Choose one consistent approach

### 2. Contact Type Enforcement
**Question:** Should contact_type be enforced at the database level or application level?

**Current State:** Application-level enum validation only

**Options:**
- Database CHECK constraints
- Application-level validation
- Hybrid approach with both

### 3. Cascade Behavior
**Question:** What should happen when a person is deleted who has associated business entities?

**Options:**
- CASCADE: Delete all related entities
- RESTRICT: Prevent deletion if entities exist
- SET NULL: Keep entities but remove person reference
- SOFT DELETE: Mark as deleted but preserve data

### 4. Primary Contact Designation
**Question:** How should we handle primary contact designation for entities with multiple people?

**Current State:** `is_primary` flag in junction tables

**Considerations:**
- Only one primary per entity
- What happens when primary person is deleted
- How to handle promotion of new primary

### 5. Performance Optimization
**Question:** What indexing strategy should we implement for optimal query performance?

**Current Needs:**
- Fast person lookups by contact_type
- Efficient entity-person joins
- Quick search across names and emails
- Optimal filtering and sorting

## Suggested Implementation Approach

### Phase 1: Database Normalization
1. Standardize relationship patterns
2. Add proper indexes and constraints
3. Implement cascade rules
4. Create migration scripts

### Phase 2: Hook Refactoring
1. Create unified person-entity creation hook
2. Implement proper error handling and rollback
3. Add comprehensive logging
4. Ensure callback chain integrity

### Phase 3: UI/UX Consistency
1. Standardize form behaviors across contexts
2. Implement proper loading and error states
3. Add user feedback and recovery options
4. Ensure accessibility compliance

### Phase 4: Testing and Validation
1. Comprehensive unit tests for all hooks
2. Integration tests for complete user flows
3. Performance testing under load
4. Data integrity validation

## Success Metrics

1. **Functional Success:**
   - 100% of person creations result in appropriate entity creation
   - Zero orphaned person records
   - All user flows complete successfully

2. **Performance Success:**
   - Database queries complete in <100ms
   - UI operations feel instantaneous (<200ms perceived)
   - No memory leaks or performance degradation

3. **User Experience Success:**
   - Consistent behavior across all forms
   - Clear error messages and recovery paths
   - Intuitive workflow that matches user mental models

4. **Technical Success:**
   - Clean, maintainable code architecture
   - Comprehensive test coverage (>90%)
   - Proper error handling and logging
   - Scalable data model design