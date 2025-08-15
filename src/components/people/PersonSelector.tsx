import React, { useState, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useImprovedPeople } from '@/hooks/useImprovedPeople';
import {
  Person,
  ContactType,
  formatPersonName,
  getContactTypeColor,
  getContactTypeDisplayName
} from '@/features/people/types';
import AddPersonForm from './AddPersonForm';

export interface PersonSelectorProps {
  selectedPersonId?: string;
  onPersonSelect: (person: Person | null) => void;
  contactType?: ContactType;
  placeholder?: string;
  className?: string;
  onPersonCreated?: (person: Person) => void;
  disabled?: boolean;
  allowClear?: boolean;
}

export const PersonSelector: React.FC<PersonSelectorProps> = ({
  selectedPersonId,
  onPersonSelect,
  contactType,
  placeholder = "Select a person",
  className,
  onPersonCreated,
  disabled = false,
  allowClear = true
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const queryClient = useQueryClient();
  
  // Use improved people hook with proper filtering
  const { people, isLoading, addPerson } = useImprovedPeople(
    {
      search: searchTerm || undefined,
      contact_type: contactType,
      status: 'active' // Only show active people
    },
    {
      onPersonCreated: (person) => {
        console.log('[PersonSelector] Person created:', person);
        
        // Force refresh of all people queries
        queryClient.invalidateQueries({ queryKey: ['people'] });
        
        // Auto-select the newly created person
        onPersonSelect(person);
        
        // Call the external callback
        if (onPersonCreated) {
          onPersonCreated(person);
        }
        
        // Close the dialog
        setShowCreateDialog(false);
      }
    }
  );

  // Memoize filtered people for performance
  const filteredPeople = useMemo(() => {
    return people.filter(person => 
      !contactType || person.contact_type === contactType
    );
  }, [people, contactType]);

  const selectedPerson = filteredPeople.find(p => p.id === selectedPersonId);

  const handleCreateSuccess = (personData: any) => {
    console.log('[PersonSelector] Person creation success:', personData);
    // The person should already be selected via the onPersonCreated callback
    setShowCreateDialog(false);
    // Clear search to show all people including the new one
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onPersonSelect(null);
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Select 
              value={selectedPersonId || ''} 
              onValueChange={(value) => {
                const person = filteredPeople.find(p => p.id === value);
                if (person) onPersonSelect(person);
              }}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search people..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                {isLoading ? (
                  <div className="p-2 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : filteredPeople.length === 0 ? (
                  <SelectItem value="no-results" disabled>
                    {searchTerm ? 'No people found' : contactType ? `No ${contactType}s available` : 'No people available'}
                  </SelectItem>
                ) : (
                  filteredPeople.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{formatPersonName(person)}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {person.email_primary}
                            {person.company_name && ` • ${person.company_name}`}
                          </div>
                        </div>
                        <Badge className={getContactTypeColor(person.contact_type as ContactType)}>
                          {getContactTypeDisplayName(person.contact_type as ContactType)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {/* Clear button */}
            {allowClear && selectedPersonId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                onClick={handleClearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowCreateDialog(true)}
            className="shrink-0"
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>

        {/* Selected Person Preview */}
        {selectedPerson && (
          <Card className="border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{formatPersonName(selectedPerson)}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedPerson.email_primary}
                    {selectedPerson.phone_primary && ` • ${selectedPerson.phone_primary}`}
                  </div>
                  {selectedPerson.company_name && (
                    <div className="text-sm text-muted-foreground">
                      {selectedPerson.company_name}
                      {selectedPerson.title_position && ` • ${selectedPerson.title_position}`}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getContactTypeColor(selectedPerson.contact_type as ContactType)}>
                    {getContactTypeDisplayName(selectedPerson.contact_type as ContactType)}
                  </Badge>
                  {allowClear && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleClearSelection}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Empty state when no person selected */}
        {!selectedPerson && !isLoading && (
          <div className="text-sm text-muted-foreground text-center py-2">
            {contactType ? `Select an existing ${contactType} or create a new one` : 'Select an existing person or create a new one'}
          </div>
        )}
      </div>

      {/* Create Person Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create New {contactType ? getContactTypeDisplayName(contactType) : 'Person'}
            </DialogTitle>
          </DialogHeader>
          <AddPersonForm 
            onSubmitSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
            defaultContactType={contactType || 'client'}
            hideContactType={!!contactType}
            customAddPerson={addPerson}
            autoCreateEntity={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PersonSelector;