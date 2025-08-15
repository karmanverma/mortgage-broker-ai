import React, { useState } from 'react';
import { Plus, User, Crown, MoreHorizontal, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage, EnhancedAvatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tables } from '@/integrations/supabase/types';
import PersonSelector from './PersonSelector';

type Person = Tables<'people'> & { 
  is_primary?: boolean; 
  relationship_type?: string;
};

interface PeopleManagerProps {
  entityType: 'client' | 'lender';
  entityId: string;
  entityName: string;
  people: Person[];
  onAddPerson: (personId: string, isPrimary?: boolean, relationshipType?: string) => void;
  onRemovePerson: (personId: string) => void;
  onSetPrimary: (personId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const PeopleManager: React.FC<PeopleManagerProps> = ({
  entityType,
  entityId,
  entityName,
  people,
  onAddPerson,
  onRemovePerson,
  onSetPrimary,
  isLoading = false,
  className = '',
}) => {
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const primaryPerson = people.find(p => p.is_primary);
  const otherPeople = people.filter(p => !p.is_primary);



  const getRelationshipColor = (type?: string) => {
    switch (type) {
      case 'primary_client':
      case 'primary_contact':
        return 'bg-blue-100 text-blue-800';
      case 'spouse':
        return 'bg-purple-100 text-purple-800';
      case 'co_applicant':
        return 'bg-green-100 text-green-800';
      case 'contact':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePersonSelected = (personId: string) => {
    const isPrimary = people.length === 0; // First person becomes primary
    const relationshipType = entityType === 'client' ? 'client' : 'contact';
    onAddPerson(personId, isPrimary, relationshipType);
    setIsAddPersonOpen(false);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            People ({people.length})
          </CardTitle>
          <Dialog open={isAddPersonOpen} onOpenChange={setIsAddPersonOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Person
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Person to {entityName}</DialogTitle>
                <DialogDescription>
                  Select an existing person or create a new one to link to this {entityType}.
                </DialogDescription>
              </DialogHeader>
              <PersonSelector
                onPersonSelect={(person) => handlePersonSelected(person.id)}
                placeholder="Select a person to add"
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {people.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No people linked to this {entityType}</p>
            <p className="text-sm">Add a person to get started</p>
          </div>
        ) : (
          <>
            {/* Primary Person */}
            {primaryPerson && (
              <div className="p-3 border rounded-lg bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <EnhancedAvatar
                      size="lg"
                      data={{
                        email: primaryPerson.email_primary,
                        first_name: primaryPerson.first_name,
                        last_name: primaryPerson.last_name,
                        display_name: `${primaryPerson.first_name} ${primaryPerson.last_name}`
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {primaryPerson.first_name} {primaryPerson.last_name}
                        </p>
                        <Crown className="h-4 w-4 text-yellow-600" />
                        <Badge variant="secondary" className="text-xs">
                          Primary
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{primaryPerson.email_primary}</p>
                      {primaryPerson.relationship_type && (
                        <Badge className={`text-xs ${getRelationshipColor(primaryPerson.relationship_type)}`}>
                          {primaryPerson.relationship_type.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onRemovePerson(primaryPerson.id)}
                      >
                        Remove Person
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* Other People - Collapsed/Expanded View */}
            {otherPeople.length > 0 && (
              <>
                {!isExpanded && otherPeople.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(true)}
                    className="w-full justify-center text-gray-600"
                  >
                    Show {otherPeople.length} more {otherPeople.length === 1 ? 'person' : 'people'}
                  </Button>
                )}

                {isExpanded && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">Other People</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(false)}
                        className="text-xs text-gray-500"
                      >
                        Collapse
                      </Button>
                    </div>
                    {otherPeople.map((person) => (
                      <div key={person.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <EnhancedAvatar
                              size="md"
                              data={{
                                email: person.email_primary,
                                first_name: person.first_name,
                                last_name: person.last_name,
                                display_name: `${person.first_name} ${person.last_name}`
                              }}
                            />
                            <div>
                              <p className="font-medium text-sm">
                                {person.first_name} {person.last_name}
                              </p>
                              <p className="text-xs text-gray-600">{person.email_primary}</p>
                              {person.relationship_type && (
                                <Badge className={`text-xs ${getRelationshipColor(person.relationship_type)}`}>
                                  {person.relationship_type.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onSetPrimary(person.id)}>
                                Set as Primary
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => onRemovePerson(person.id)}
                              >
                                Remove Person
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};