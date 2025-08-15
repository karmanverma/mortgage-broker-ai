# Single Pages Implementation Plan: Realtors & Lenders

## Overview
Create dedicated single-page views for realtors and lenders similar to the existing client detail page, with comprehensive tabs, edit functionality, and delete operations.

## Current State Analysis

### Existing Client Detail Page Structure
- **Route**: `/app/clients/:id`
- **File**: `src/pages/app/clients/ClientDetailPage.tsx`
- **Features**:
  - Personal Information tab
  - Financial Details tab
  - Documents tab
  - Activities tab
  - Notes tab
  - Edit/Delete functionality
  - People management

## Implementation Plan

### 1. Realtor Detail Page

#### 1.1 Create RealtorDetailPage Component
**File**: `src/pages/app/realtors/RealtorDetailPage.tsx`

**Features**:
- **Header Section**: Name, photo, status, primary contact info
- **Action Buttons**: Edit, Delete, Manage People
- **Tab Navigation**:
  - **Profile Tab**: License info, brokerage, specialties, experience
  - **Performance Tab**: Ratings, referrals, deals closed, relationship level
  - **People Tab**: Associated contacts and relationships
  - **Activities Tab**: Communication history, meetings, calls
  - **Notes Tab**: Internal notes and observations
  - **Documents Tab**: Contracts, agreements, certifications

#### 1.2 Create Realtor Tab Components
**Files**:
- `src/components/realtors/tabs/RealtorProfileTab.tsx`
- `src/components/realtors/tabs/RealtorPerformanceTab.tsx`
- `src/components/realtors/tabs/RealtorPeopleTab.tsx`
- `src/components/realtors/tabs/RealtorActivitiesTab.tsx`
- `src/components/realtors/tabs/RealtorNotesTab.tsx`
- `src/components/realtors/tabs/RealtorDocumentsTab.tsx`

#### 1.3 Create Edit Realtor Form
**File**: `src/components/realtors/EditRealtorForm.tsx`
- Modal/dialog form for editing realtor details
- Form validation with Zod
- Integration with useImprovedRealtors hook

#### 1.4 Add Routing
**Update**: `src/App.tsx` or routing configuration
- Add route: `/app/realtors/:id`

### 2. Lender Detail Page

#### 2.1 Create LenderDetailPage Component
**File**: `src/pages/app/lenders/LenderDetailPage.tsx`

**Features**:
- **Header Section**: Institution name, logo, type, status
- **Action Buttons**: Edit, Delete, Manage People, Manage Documents
- **Tab Navigation**:
  - **Institution Tab**: Company details, type, status, contact info
  - **People Tab**: Associated contacts and relationships
  - **Products Tab**: Loan products, rates, requirements
  - **Documents Tab**: Rate sheets, guidelines, agreements
  - **Activities Tab**: Communication history, applications
  - **Notes Tab**: Internal notes and relationship details

#### 2.2 Create Lender Tab Components
**Files**:
- `src/components/lenders/tabs/LenderInstitutionTab.tsx`
- `src/components/lenders/tabs/LenderPeopleTab.tsx`
- `src/components/lenders/tabs/LenderProductsTab.tsx`
- `src/components/lenders/tabs/LenderDocumentsTab.tsx`
- `src/components/lenders/tabs/LenderActivitiesTab.tsx`
- `src/components/lenders/tabs/LenderNotesTab.tsx`

#### 2.3 Enhance Edit Lender Form
**Update**: `src/components/lenders/EditLenderForm.tsx`
- Ensure comprehensive editing capabilities
- Add validation and error handling

#### 2.4 Add Routing
**Update**: `src/App.tsx` or routing configuration
- Add route: `/app/lenders/:id`

## Detailed Component Specifications

### Realtor Detail Page Structure

```typescript
interface RealtorDetailPageProps {
  // Route parameter
  realtorId: string;
}

// Tab structure
const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'people', label: 'People', icon: Users },
  { id: 'activities', label: 'Activities', icon: Activity },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'documents', label: 'Documents', icon: Folder }
];
```

### Lender Detail Page Structure

```typescript
interface LenderDetailPageProps {
  // Route parameter
  lenderId: string;
}

// Tab structure
const tabs = [
  { id: 'institution', label: 'Institution', icon: Building },
  { id: 'people', label: 'People', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'documents', label: 'Documents', icon: Folder },
  { id: 'activities', label: 'Activities', icon: Activity },
  { id: 'notes', label: 'Notes', icon: FileText }
];
```

## Database Schema Considerations

### Realtor-Specific Fields
- `license_number`
- `license_state`
- `brokerage_name`
- `specialty_areas` (array)
- `years_experience`
- `performance_rating`
- `relationship_level`
- `total_referrals_sent`
- `total_deals_closed`

### Lender-Specific Fields
- `name` (institution name)
- `type` (bank, credit union, etc.)
- `status`
- `website`
- `headquarters_address`
- `loan_products` (array)
- `minimum_credit_score`
- `maximum_ltv`

## Implementation Steps

### Phase 1: Realtor Detail Page (Week 1)
1. **Day 1-2**: Create RealtorDetailPage component with basic layout
2. **Day 3-4**: Implement Profile and Performance tabs
3. **Day 5**: Add People and Activities tabs
4. **Day 6**: Implement Notes and Documents tabs
5. **Day 7**: Add edit/delete functionality and testing

### Phase 2: Lender Detail Page (Week 2)
1. **Day 1-2**: Create LenderDetailPage component with basic layout
2. **Day 3-4**: Implement Institution and People tabs
3. **Day 5**: Add Products and Documents tabs
4. **Day 6**: Implement Activities and Notes tabs
5. **Day 7**: Add edit/delete functionality and testing

### Phase 3: Integration & Polish (Week 3)
1. **Day 1-2**: Update navigation and routing
2. **Day 3-4**: Add breadcrumbs and back navigation
3. **Day 5**: Implement search and filtering within tabs
4. **Day 6**: Add responsive design and mobile optimization
5. **Day 7**: Final testing and bug fixes

## Navigation Updates

### Update List Pages
- Add click handlers to navigate to detail pages
- Update existing "View Details" actions

### Add Breadcrumbs
- Implement breadcrumb navigation
- Show: Home > Realtors > [Realtor Name]
- Show: Home > Lenders > [Lender Name]

### Back Navigation
- Add back button to return to list view
- Maintain filter state when returning

## Reusable Components

### Tab Layout Component
**File**: `src/components/ui/detail-page-layout.tsx`
- Reusable layout for all detail pages
- Consistent header, tabs, and content structure

### Entity Header Component
**File**: `src/components/ui/entity-header.tsx`
- Reusable header with photo, name, status
- Action buttons (Edit, Delete, etc.)

### Notes Tab Component
**File**: `src/components/ui/notes-tab.tsx`
- Reusable notes functionality
- Add, edit, delete notes
- Timestamp and user attribution

## Testing Strategy

### Unit Tests
- Test each tab component individually
- Test edit/delete functionality
- Test navigation and routing

### Integration Tests
- Test full user workflows
- Test data loading and error states
- Test responsive design

### User Acceptance Tests
- Test with real data scenarios
- Verify all CRUD operations work
- Test performance with large datasets

## Success Metrics

### Functionality
- ✅ All tabs load correctly
- ✅ Edit functionality works for all fields
- ✅ Delete functionality with confirmation
- ✅ Navigation works seamlessly
- ✅ Data persistence across tabs

### Performance
- ✅ Page loads in <2 seconds
- ✅ Tab switching is instantaneous
- ✅ No memory leaks during navigation

### User Experience
- ✅ Consistent design with client pages
- ✅ Intuitive navigation
- ✅ Responsive on all devices
- ✅ Accessible to screen readers

## Files to Create/Modify

### New Files (Realtors)
- `src/pages/app/realtors/RealtorDetailPage.tsx`
- `src/components/realtors/tabs/RealtorProfileTab.tsx`
- `src/components/realtors/tabs/RealtorPerformanceTab.tsx`
- `src/components/realtors/tabs/RealtorPeopleTab.tsx`
- `src/components/realtors/tabs/RealtorActivitiesTab.tsx`
- `src/components/realtors/tabs/RealtorNotesTab.tsx`
- `src/components/realtors/tabs/RealtorDocumentsTab.tsx`
- `src/components/realtors/EditRealtorForm.tsx`

### New Files (Lenders)
- `src/pages/app/lenders/LenderDetailPage.tsx`
- `src/components/lenders/tabs/LenderInstitutionTab.tsx`
- `src/components/lenders/tabs/LenderPeopleTab.tsx`
- `src/components/lenders/tabs/LenderProductsTab.tsx`
- `src/components/lenders/tabs/LenderDocumentsTab.tsx`
- `src/components/lenders/tabs/LenderActivitiesTab.tsx`
- `src/components/lenders/tabs/LenderNotesTab.tsx`

### Modified Files
- `src/App.tsx` (routing)
- `src/pages/app/realtors/RealtorsPage.tsx` (navigation)
- `src/pages/app/Lenders.tsx` (navigation)
- `src/components/realtors/RealtorsList.tsx` (click handlers)
- `src/components/lenders/LendersListUnified.tsx` (click handlers)

## Dependencies

### Required Hooks
- `useImprovedRealtors` (existing)
- `useImprovedLenders` (existing)
- `useImprovedActivities` (existing)
- `useImprovedNotes` (may need to create)

### UI Components
- Tabs component (existing)
- Card components (existing)
- Form components (existing)
- Dialog components (existing)

This plan provides a comprehensive roadmap for implementing single-page views for both realtors and lenders, following the established patterns from the client detail page while adding entity-specific functionality.