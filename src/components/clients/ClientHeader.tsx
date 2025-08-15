import React from 'react';
import { 
  Building2, 
  Home, 
  TrendingUp, 
  Calendar, 
  Phone, 
  Mail, 
  Edit, 
  MessageSquare, 
  Trash2,
  StickyNote,
  Crown,
  User
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

type Client = Tables<'clients'>;
type Person = Tables<'people'> & { 
  is_primary?: boolean; 
  relationship_type?: string;
};

interface ClientHeaderProps {
  client: Client;
  primaryPerson?: Person;
  onEdit: () => void;
  onAddNote: () => void;
  onSendMessage: () => void;
  onDelete: () => void;
  onUpdateLastContact: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  client,
  primaryPerson,
  onEdit,
  onAddNote,
  onSendMessage,
  onDelete,
  onUpdateLastContact,
}) => {
  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case 'residential': return Home;
      case 'commercial': return Building2;
      case 'investor': return TrendingUp;
      default: return User;
    }
  };

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'residential': return 'bg-blue-100 text-blue-800';
      case 'commercial': return 'bg-green-100 text-green-800';
      case 'investor': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'prospect': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    try {
      return format(new Date(date), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const ClientTypeIcon = getClientTypeIcon(client.client_type || 'residential');

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          {/* Left Section - Client Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <ClientTypeIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <CardTitle className="text-2xl lg:text-3xl font-bold">
                  {primaryPerson ? 
                    `${primaryPerson.first_name} ${primaryPerson.last_name}` : 
                    'No Primary Contact'
                  }
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getClientTypeColor(client.client_type || 'residential')}>
                    <ClientTypeIcon className="h-3 w-3 mr-1" />
                    {(client.client_type || 'residential').charAt(0).toUpperCase() + 
                     (client.client_type || 'residential').slice(1)} Client
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(client.client_status || 'active')}>
                    {(client.client_status || 'active').charAt(0).toUpperCase() + 
                     (client.client_status || 'active').slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Client Number</p>
                <p className="font-medium">{client.client_number || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date Added</p>
                <p className="font-medium">{formatDate(client.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Contact</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{formatDate(client.last_contact_date)}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onUpdateLastContact}
                    className="h-6 px-2 text-xs"
                  >
                    Update
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Primary Contact & Actions */}
          <div className="lg:w-80">
            {/* Primary Contact Card */}
            {primaryPerson && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={`${primaryPerson.first_name} ${primaryPerson.last_name}`} />
                      <AvatarFallback>
                        {getInitials(primaryPerson.first_name, primaryPerson.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">Primary Contact</p>
                        <Crown className="h-3 w-3 text-yellow-600" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {primaryPerson.relationship_type?.replace('_', ' ') || 'Client'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    {primaryPerson.email_primary && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{primaryPerson.email_primary}</span>
                      </div>
                    )}
                    {primaryPerson.phone_primary && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{primaryPerson.phone_primary}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
              </Button>
              <Button variant="outline" size="sm" onClick={onAddNote}>
                <StickyNote className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button variant="outline" size="sm" onClick={onSendMessage}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Client
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};