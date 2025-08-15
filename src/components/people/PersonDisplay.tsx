import React from 'react';
import { User, Users, Crown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage, EnhancedAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';

type Person = Tables<'people'> & { 
  is_primary?: boolean; 
  relationship_type?: string;
};

interface PersonDisplayProps {
  people: Person[];
  showExpanded?: boolean;
  onToggleExpanded?: () => void;
  compact?: boolean;
}

export const PersonDisplay: React.FC<PersonDisplayProps> = ({
  people,
  showExpanded = false,
  onToggleExpanded,
  compact = false,
}) => {
  const primaryPerson = people.find(p => p.is_primary);
  const otherPeople = people.filter(p => !p.is_primary);



  if (people.length === 0) {
    return (
      <div className="flex items-center text-gray-500">
        <User className="h-4 w-4 mr-2" />
        <span className="text-sm">No contacts</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {primaryPerson && (
          <div className="flex items-center space-x-2">
            <EnhancedAvatar
              size="md"
              data={{
                email: primaryPerson.email_primary,
                first_name: primaryPerson.first_name,
                last_name: primaryPerson.last_name,
                display_name: `${primaryPerson.first_name} ${primaryPerson.last_name}`
              }}
            />
            <span className="text-sm font-medium">
              {primaryPerson.first_name} {primaryPerson.last_name}
            </span>
            <Crown className="h-3 w-3 text-yellow-600" />
          </div>
        )}
        {otherPeople.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            +{otherPeople.length} more
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Primary Person */}
      {primaryPerson && (
        <div className="flex items-center space-x-3">
          <EnhancedAvatar
            size="md"
            data={{
              email: primaryPerson.email_primary,
              first_name: primaryPerson.first_name,
              last_name: primaryPerson.last_name,
              display_name: `${primaryPerson.first_name} ${primaryPerson.last_name}`
            }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">
                {primaryPerson.first_name} {primaryPerson.last_name}
              </p>
              <Crown className="h-4 w-4 text-yellow-600" />
              <Badge variant="secondary" className="text-xs">
                Primary
              </Badge>
            </div>
            <p className="text-xs text-gray-600">{primaryPerson.email_primary}</p>
          </div>
        </div>
      )}

      {/* Other People Toggle */}
      {otherPeople.length > 0 && (
        <>
          {!showExpanded ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpanded}
              className="h-6 text-xs text-gray-600 p-0"
            >
              <Users className="h-3 w-3 mr-1" />
              Show {otherPeople.length} more {otherPeople.length === 1 ? 'person' : 'people'}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="h-6 text-xs text-gray-600 p-0"
              >
                Hide additional people
              </Button>
              {otherPeople.map((person) => (
                <div key={person.id} className="flex items-center space-x-3 pl-4">
                  <EnhancedAvatar
                    size="sm"
                    data={{
                      email: person.email_primary,
                      first_name: person.first_name,
                      last_name: person.last_name,
                      display_name: `${person.first_name} ${person.last_name}`
                    }}
                  />
                  <div>
                    <p className="font-medium text-xs">
                      {person.first_name} {person.last_name}
                    </p>
                    <p className="text-xs text-gray-600">{person.email_primary}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};