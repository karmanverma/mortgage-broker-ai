import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MoreHorizontal, Edit, Trash2, Mail, Phone } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useImprovedPeople } from '@/hooks/useImprovedPeople';
import { useImprovedClients } from '@/hooks/useImprovedClients';
import { useImprovedLenders } from '@/hooks/useImprovedLenders';
import { useImprovedRealtors } from '@/hooks/useImprovedRealtors';
import {
  Person,
  PersonFilters,
  contactTypeOptions,
  statusOptions,
  getContactTypeDisplayName,
  getContactTypeColor,
  formatPersonName,
  getPrimaryContact
} from '@/features/people/types';
import AddPersonForm from './AddPersonForm';
import PeopleListUnified from './PeopleListUnified';

const PeopleList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactTypeFilter, setContactTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  
  const { 
    people, 
    isLoading, 
    error, 
    deletePerson, 
    isDeleting 
  } = useImprovedPeople(); // Remove filters parameter to avoid server-side filtering
  
  // Get entity data to show associations
  const { clients } = useImprovedClients();
  const { lenders } = useImprovedLenders();
  const { realtors } = useImprovedRealtors();
  
  // Helper function to get entity associations for a person
  const getPersonEntityAssociations = (personId: string) => {
    const associations = [];
    
    if (clients.some(client => client.people_id === personId)) {
      associations.push('client');
    }
    if (lenders.some(lender => lender.people_id === personId)) {
      associations.push('lender');
    }
    if (realtors.some(realtor => realtor.people_id === personId)) {
      associations.push('realtor');
    }
    
    return associations;
  };
  
  // Client-side filtering (like other pages)
  const filteredPeople = people.filter(person => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      `${person.first_name} ${person.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.email_primary && person.email_primary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.company_name && person.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Contact type filter
    const matchesContactType = contactTypeFilter === 'all' || person.contact_type === contactTypeFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
    
    // Entity filter
    const matchesEntity = entityFilter === 'all' || (() => {
      const associations = getPersonEntityAssociations(person.id);
      return associations.includes(entityFilter);
    })();
    
    return matchesSearch && matchesContactType && matchesStatus && matchesEntity;
  });

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
  };

  const handleContactTypeFilter = (contact_type: string) => {
    setContactTypeFilter(contact_type);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const handleDeletePerson = (person: Person) => {
    if (confirm(`Are you sure you want to delete ${formatPersonName(person)}?`)) {
      deletePerson({ 
        personId: person.id, 
        personName: formatPersonName(person) 
      });
    }
  };

  const handleAddSuccess = () => {
    setShowAddDialog(false);
  };

  // Helper function to get initials for avatar
  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Error loading people: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        searchValue={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search by name, email, or company..."
        filters={[
          {
            value: contactTypeFilter,
            onValueChange: handleContactTypeFilter,
            options: [
              { value: 'all', label: 'All Types' },
              ...contactTypeOptions.map(type => ({
                value: type,
                label: getContactTypeDisplayName(type)
              }))
            ],
            placeholder: 'Contact Type'
          },
          {
            value: statusFilter,
            onValueChange: handleStatusFilter,
            options: [
              { value: 'all', label: 'All Status' },
              ...statusOptions.map(status => ({
                value: status,
                label: status.charAt(0).toUpperCase() + status.slice(1)
              }))
            ],
            placeholder: 'Status'
          },
          {
            value: entityFilter,
            onValueChange: setEntityFilter,
            options: [
              { value: 'all', label: 'All Entities' },
              { value: 'client', label: 'Clients' },
              { value: 'lender', label: 'Lenders' },
              { value: 'realtor', label: 'Realtors' }
            ],
            placeholder: 'Entity'
          }
        ]}
        onAddClick={() => setShowAddDialog(true)}
        addButtonText="Add Person"
        addButtonIcon={<Plus className="h-4 w-4" />}
      />

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredPeople.length} of {people.length} people
      </div>

      {/* People Table */}
      <PeopleListUnified
        people={filteredPeople}
        isLoading={isLoading}
        error={error?.message || null}
        onEditPerson={setSelectedPerson}
        onDeletePerson={handleDeletePerson}
        isDeleting={isDeleting}
        getPersonEntityAssociations={getPersonEntityAssociations}
      />

      {/* Add Person Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Person</DialogTitle>
          </DialogHeader>
          <AddPersonForm 
            onSubmitSuccess={handleAddSuccess}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Person Dialog - TODO: Implement EditPersonForm */}
      {selectedPerson && (
        <Dialog open={!!selectedPerson} onOpenChange={() => setSelectedPerson(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Person</DialogTitle>
            </DialogHeader>
            <div className="p-4 text-center text-muted-foreground">
              Edit functionality coming soon...
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PeopleList;