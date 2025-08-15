import React, { useState } from 'react';
import { Plus, Crown, User, Phone, Mail, MoreHorizontal, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage, EnhancedAvatar } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tables } from '@/integrations/supabase/types';
import { PeopleManager } from '@/components/people/PeopleManager';

type Person = Tables<'people'> & { 
  is_primary?: boolean; 
  relationship_type?: string;
  relationship_notes?: string;
  contact_preference?: string;
  is_authorized_contact?: boolean;
};

interface RelationshipsTabProps {
  clientId: string;
  clientType: string;
  people: Person[];
  onAddPerson: (personId: string, isPrimary?: boolean, relationshipType?: string) => void;
  onRemovePerson: (personId: string) => void;
  onSetPrimary: (personId: string) => void;
  onUpdateRelationship?: (personId: string, updates: any) => void;
}

export const RelationshipsTab: React.FC<RelationshipsTabProps> = ({
  clientId,
  clientType,
  people,
  onAddPerson,
  onRemovePerson,
  onSetPrimary,
  onUpdateRelationship,
}) => {
  const [isManagePeopleOpen, setIsManagePeopleOpen] = useState(false);

  const getRelationshipColor = (type?: string) => {
    switch (type) {
      case 'primary_client':
        return 'bg-blue-100 text-blue-800';
      case 'co_borrower':
        return 'bg-green-100 text-green-800';
      case 'spouse':
        return 'bg-purple-100 text-purple-800';
      case 'business_partner':
        return 'bg-orange-100 text-orange-800';
      case 'investor_partner':
        return 'bg-indigo-100 text-indigo-800';
      case 'guarantor':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRelationshipDisplayName = (type?: string) => {
    switch (type) {
      case 'primary_client': return 'Primary Client';
      case 'co_borrower': return 'Co-Borrower';
      case 'spouse': return 'Spouse';
      case 'business_partner': return 'Business Partner';
      case 'investor_partner': return 'Investor Partner';
      case 'family_member': return 'Family Member';
      case 'guarantor': return 'Guarantor';
      case 'property_manager': return 'Property Manager';
      case 'accountant': return 'Accountant';
      case 'attorney': return 'Attorney';
      default: return 'Contact';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const primaryPerson = people.find(p => p.is_primary);
  const otherPeople = people.filter(p => !p.is_primary);

  const getRelevantRelationships = () => {
    switch (clientType) {
      case 'residential':
        return ['co_borrower', 'spouse', 'family_member', 'guarantor'];
      case 'commercial':
        return ['business_partner', 'guarantor', 'accountant', 'attorney', 'property_manager'];
      case 'investor':
        return ['investor_partner', 'business_partner', 'accountant', 'attorney', 'property_manager'];
      default:
        return ['co_borrower', 'spouse', 'business_partner'];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Client Relationships</h3>
          <p className="text-sm text-muted-foreground">
            Manage people associated with this {clientType} client
          </p>
        </div>
        <Button onClick={() => setIsManagePeopleOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Person
        </Button>
      </div>

      {/* Primary Contact */}
      {primaryPerson && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              Primary Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="" alt={`${primaryPerson.first_name} ${primaryPerson.last_name}`} />
                  <AvatarFallback>
                    {getInitials(primaryPerson.first_name, primaryPerson.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">
                      {primaryPerson.first_name} {primaryPerson.last_name}
                    </h4>
                    <Badge className={getRelationshipColor(primaryPerson.relationship_type)}>
                      {getRelationshipDisplayName(primaryPerson.relationship_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {primaryPerson.email_primary && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {primaryPerson.email_primary}
                      </div>
                    )}
                    {primaryPerson.phone_primary && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {primaryPerson.phone_primary}
                      </div>
                    )}
                  </div>
                  {primaryPerson.company_name && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {primaryPerson.company_name}
                      {primaryPerson.title_position && ` • ${primaryPerson.title_position}`}
                    </p>
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
                  <DropdownMenuItem onClick={() => setIsManagePeopleOpen(true)}>
                    Edit Relationship
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onRemovePerson(primaryPerson.id)}
                  >
                    Remove Person
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Relationships */}
      {otherPeople.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Other Relationships ({otherPeople.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {otherPeople.map((person) => (
                <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={`${person.first_name} ${person.last_name}`} />
                      <AvatarFallback>
                        {getInitials(person.first_name, person.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-sm">
                          {person.first_name} {person.last_name}
                        </h5>
                        <Badge variant="secondary" className={getRelationshipColor(person.relationship_type)}>
                          {getRelationshipDisplayName(person.relationship_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {person.email_primary && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {person.email_primary}
                          </div>
                        )}
                        {person.phone_primary && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {person.phone_primary}
                          </div>
                        )}
                      </div>
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
                      <DropdownMenuItem onClick={() => setIsManagePeopleOpen(true)}>
                        Edit Relationship
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {people.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No relationships added</h3>
            <p className="text-muted-foreground mb-4">
              Add people associated with this {clientType} client to manage relationships effectively.
            </p>
            <Button onClick={() => setIsManagePeopleOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Person
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manage People Dialog */}
      <Dialog open={isManagePeopleOpen} onOpenChange={setIsManagePeopleOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Manage Client Relationships</DialogTitle>
            <DialogDescription>
              Add, remove, or manage people associated with this {clientType} client.
            </DialogDescription>
          </DialogHeader>
          <PeopleManager
            entityType="client"
            entityId={clientId}
            entityName="Client"
            people={people}
            onAddPerson={onAddPerson}
            onRemovePerson={onRemovePerson}
            onSetPrimary={onSetPrimary}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};