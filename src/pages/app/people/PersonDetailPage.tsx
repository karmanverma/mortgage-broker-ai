'use client';

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Calendar,
  Star,
  Tag,
  FileText,
  Activity,
  Users,
  Loader2,
  AlertCircle,
  Edit,
  Save,
  X,
  MessageSquare,
  Linkedin,
  Facebook
} from 'lucide-react';
import TodosWidget from '@/components/todos/TodosWidget';

import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useImprovedPeople } from '@/hooks/useImprovedPeople';
import { Person, getContactTypeDisplayName, getContactTypeColor, formatPersonName, contactTypeOptions, statusOptions, communicationMethodOptions } from '@/features/people/types';
import { supabase } from '@/integrations/supabase/client';
import PersonActivityTab from '@/components/people/PersonActivityTab';
import EntityNotesTab from '@/components/ui/EntityNotesTab';

const DetailItem = ({ icon: Icon, label, value, onClick }: { 
  icon: React.ElementType, 
  label: string, 
  value: React.ReactNode,
  onClick?: () => void 
}) => {
  const isClickable = onClick || (typeof value === 'string' && (label.toLowerCase().includes('email') || label.toLowerCase().includes('phone')));
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (typeof value === 'string' && label.toLowerCase().includes('email')) {
      window.open(`mailto:${value}`);
    } else if (typeof value === 'string' && label.toLowerCase().includes('phone')) {
      window.open(`tel:${value}`);
    }
  };

  return (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div 
          className={`text-sm font-medium ${isClickable ? 'cursor-pointer hover:underline text-blue-600' : ''} truncate`}
          onClick={isClickable ? handleClick : undefined}
          title={isClickable ? `Click to ${label.toLowerCase().includes('email') ? 'email' : 'call'} ${value}` : undefined}
        >
          {value || 'N/A'}
        </div>
      </div>
    </div>
  );
};

const PersonDetailPage = () => {
  const { personId } = useParams<{ personId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [person, setPerson] = useState<Person | null>(null);
  const [entityAssociations, setEntityAssociations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPerson, setEditedPerson] = useState<Person | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { updatePerson, isUpdating } = useImprovedPeople();

  useEffect(() => {
    const fetchPersonData = async () => {
      if (!personId || !user) {
        setLoading(false);
        setError('Person ID or user not found.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch person details
        const { data: personData, error: personError } = await supabase
          .from('people')
          .select('*')
          .eq('id', personId)
          .eq('user_id', user.id)
          .single();

        if (personError) throw new Error(personError.message || 'Failed to fetch person details');
        if (!personData) throw new Error('Person not found or access denied.');
        
        setPerson(personData);

        // Fetch entity associations
        const [clientAssociations, lenderAssociations, realtorAssociations] = await Promise.all([
          supabase
            .from('client_people')
            .select(`
              is_primary,
              relationship_type,
              clients!inner(
                id,
                client_type,
                user_id
              )
            `)
            .eq('person_id', personId)
            .eq('clients.user_id', user.id),
          supabase
            .from('lender_people')
            .select(`
              is_primary,
              relationship_type,
              lenders!inner(
                id,
                type,
                user_id
              )
            `)
            .eq('person_id', personId)
            .eq('lenders.user_id', user.id),
          supabase
            .from('realtor_people')
            .select(`
              is_primary,
              relationship_type,
              realtors!inner(
                id,
                user_id
              )
            `)
            .eq('person_id', personId)
            .eq('realtors.user_id', user.id)
        ]);

        const associations = [
          ...(clientAssociations.data || []).map(item => ({
            entity_type: 'client',
            entity_id: item.clients.id,
            client_type: item.clients.client_type,
            is_primary: item.is_primary,
            relationship_type: item.relationship_type
          })),
          ...(lenderAssociations.data || []).map(item => ({
            entity_type: 'lender',
            entity_id: item.lenders.id,
            client_type: item.lenders.type,
            is_primary: item.is_primary,
            relationship_type: item.relationship_type
          })),
          ...(realtorAssociations.data || []).map(item => ({
            entity_type: 'realtor',
            entity_id: item.realtors.id,
            client_type: 'realtor',
            is_primary: item.is_primary,
            relationship_type: item.relationship_type
          }))
        ];

        setEntityAssociations(associations);

      } catch (err: any) {
        console.error("Error loading person data:", err);
        setError(err.message || 'An unexpected error occurred.');
        toast({
          title: 'Error loading data',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPersonData();
  }, [personId, user, toast]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedPerson({ ...person! });
  };

  const handleSave = async () => {
    if (!editedPerson) return;

    try {
      await updatePerson({
        personId: editedPerson.id,
        updates: editedPerson,
        personName: formatPersonName(editedPerson)
      });
      
      setPerson(editedPerson);
      setIsEditing(false);
      setEditedPerson(null);
      
      toast({
        title: 'Success',
        description: 'Person updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update person',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedPerson(null);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'PPP');
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Button variant="outline" size="sm" asChild className="mb-4">
          <Link to="/app/people">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to People
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="text-center py-10">
        <p className="text-lg font-medium text-muted-foreground">Person data not available.</p>
        <Button variant="outline" asChild className="mt-4">
          <Link to="/app/people">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to People
          </Link>
        </Button>
      </div>
    );
  }

  const currentPerson = isEditing ? editedPerson! : person;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link to="/app/people">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to People
        </Link>
      </Button>

      {/* Person Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {person.first_name[0]}{person.last_name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{formatPersonName(person)}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getContactTypeColor(person.contact_type as any)}>
                    {getContactTypeDisplayName(person.contact_type as any)}
                  </Badge>
                  <Badge variant={person.status === 'active' ? 'default' : 'secondary'}>
                    {person.status?.charAt(0).toUpperCase() + person.status?.slice(1)}
                  </Badge>
                </div>
                {person.company_name && (
                  <p className="text-muted-foreground mt-1">{person.company_name}</p>
                )}
                {person.title_position && (
                  <p className="text-sm text-muted-foreground">{person.title_position}</p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button onClick={handleEdit} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} size="sm" disabled={isUpdating}>
                    {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">First Name</label>
                        <Input
                          value={currentPerson.first_name}
                          onChange={(e) => setEditedPerson({ ...currentPerson, first_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Name</label>
                        <Input
                          value={currentPerson.last_name}
                          onChange={(e) => setEditedPerson({ ...currentPerson, last_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Company</label>
                      <Input
                        value={currentPerson.company_name || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, company_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Title/Position</label>
                      <Input
                        value={currentPerson.title_position || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, title_position: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Type</label>
                      <Select
                        value={currentPerson.contact_type}
                        onValueChange={(value) => setEditedPerson({ ...currentPerson, contact_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {contactTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {getContactTypeDisplayName(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={currentPerson.status || 'active'}
                        onValueChange={(value) => setEditedPerson({ ...currentPerson, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <DetailItem icon={User} label="Full Name" value={formatPersonName(currentPerson)} />
                    <DetailItem icon={Building2} label="Company" value={currentPerson.company_name} />
                    <DetailItem icon={User} label="Title/Position" value={currentPerson.title_position} />
                    <DetailItem icon={Tag} label="Contact Type" value={getContactTypeDisplayName(currentPerson.contact_type as any)} />
                    <DetailItem icon={Activity} label="Status" value={currentPerson.status?.charAt(0).toUpperCase() + currentPerson.status?.slice(1)} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Primary Email</label>
                      <Input
                        type="email"
                        value={currentPerson.email_primary}
                        onChange={(e) => setEditedPerson({ ...currentPerson, email_primary: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Secondary Email</label>
                      <Input
                        type="email"
                        value={currentPerson.email_secondary || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, email_secondary: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Primary Phone</label>
                      <Input
                        value={currentPerson.phone_primary || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, phone_primary: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Secondary Phone</label>
                      <Input
                        value={currentPerson.phone_secondary || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, phone_secondary: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Preferred Communication</label>
                      <Select
                        value={currentPerson.preferred_communication_method || ''}
                        onValueChange={(value) => setEditedPerson({ ...currentPerson, preferred_communication_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {communicationMethodOptions.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method.charAt(0).toUpperCase() + method.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <DetailItem icon={Mail} label="Primary Email" value={currentPerson.email_primary} />
                    <DetailItem icon={Mail} label="Secondary Email" value={currentPerson.email_secondary} />
                    <DetailItem icon={Phone} label="Primary Phone" value={currentPerson.phone_primary} />
                    <DetailItem icon={Phone} label="Secondary Phone" value={currentPerson.phone_secondary} />
                    <DetailItem icon={MessageSquare} label="Preferred Communication" value={currentPerson.preferred_communication_method?.charAt(0).toUpperCase() + currentPerson.preferred_communication_method?.slice(1)} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Address & Social */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Address & Social
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Street Address</label>
                      <Input
                        value={currentPerson.address_street || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, address_street: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">City</label>
                        <Input
                          value={currentPerson.address_city || ''}
                          onChange={(e) => setEditedPerson({ ...currentPerson, address_city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">State</label>
                        <Input
                          value={currentPerson.address_state || ''}
                          onChange={(e) => setEditedPerson({ ...currentPerson, address_state: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">ZIP Code</label>
                      <Input
                        value={currentPerson.address_zip || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, address_zip: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">LinkedIn</label>
                      <Input
                        value={currentPerson.social_linkedin || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, social_linkedin: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Facebook</label>
                      <Input
                        value={currentPerson.social_facebook || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, social_facebook: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <DetailItem icon={MapPin} label="Street Address" value={currentPerson.address_street} />
                    <DetailItem icon={MapPin} label="City" value={currentPerson.address_city} />
                    <DetailItem icon={MapPin} label="State" value={currentPerson.address_state} />
                    <DetailItem icon={MapPin} label="ZIP Code" value={currentPerson.address_zip} />
                    <DetailItem 
                      icon={Linkedin} 
                      label="LinkedIn" 
                      value={currentPerson.social_linkedin} 
                      onClick={currentPerson.social_linkedin ? () => window.open(currentPerson.social_linkedin!, '_blank') : undefined}
                    />
                    <DetailItem 
                      icon={Facebook} 
                      label="Facebook" 
                      value={currentPerson.social_facebook}
                      onClick={currentPerson.social_facebook ? () => window.open(currentPerson.social_facebook!, '_blank') : undefined}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Relationship & Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Relationship & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium">Relationship Strength (1-10)</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={currentPerson.relationship_strength_score || 5}
                        onChange={(e) => setEditedPerson({ ...currentPerson, relationship_strength_score: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Source</label>
                      <Input
                        value={currentPerson.contact_source || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, contact_source: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={currentPerson.notes || ''}
                        onChange={(e) => setEditedPerson({ ...currentPerson, notes: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <DetailItem icon={Star} label="Relationship Strength" value={`${currentPerson.relationship_strength_score || 5}/10`} />
                    <DetailItem icon={User} label="Contact Source" value={currentPerson.contact_source} />
                    <DetailItem icon={Calendar} label="Last Contact" value={formatDate(currentPerson.last_contact_date)} />
                    <DetailItem icon={Calendar} label="Next Follow-up" value={formatDate(currentPerson.next_follow_up_date)} />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {currentPerson.tags?.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        )) || <span className="text-sm text-muted-foreground">No tags</span>}
                      </div>
                    </div>
                    {currentPerson.notes && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="text-sm">{currentPerson.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* To-dos */}
            <TodosWidget 
              entityType="person" 
              entityId={person.id} 
              showHeader={true}
              maxItems={6}
            />
          </div>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <DetailItem icon={Mail} label="Primary Email" value={person.email_primary} />
                  <DetailItem icon={Mail} label="Secondary Email" value={person.email_secondary} />
                  <DetailItem icon={Phone} label="Primary Phone" value={person.phone_primary} />
                  <DetailItem icon={Phone} label="Secondary Phone" value={person.phone_secondary} />
                </div>
                <div className="space-y-4">
                  <DetailItem icon={MapPin} label="Address" value={
                    [person.address_street, person.address_city, person.address_state, person.address_zip]
                      .filter(Boolean)
                      .join(', ') || 'N/A'
                  } />
                  <DetailItem icon={MessageSquare} label="Preferred Communication" value={person.preferred_communication_method} />
                  <DetailItem icon={Linkedin} label="LinkedIn" value={person.social_linkedin} />
                  <DetailItem icon={Facebook} label="Facebook" value={person.social_facebook} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Entity Relationships
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entityAssociations.length > 0 ? (
                <div className="space-y-4">
                  {entityAssociations.map((association, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getContactTypeColor(association.entity_type)}>
                            {association.entity_type.charAt(0).toUpperCase() + association.entity_type.slice(1)}
                          </Badge>
                          {association.is_primary && (
                            <Badge variant="outline">Primary</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {association.relationship_type || 'Contact'}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/app/${association.entity_type}s/${association.entity_id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No entity relationships found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <EntityNotesTab
            entityType="person"
            entityId={person.id}
            title="Person Notes"
            description="Add and review notes specific to this person."
          />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <PersonActivityTab personId={person.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonDetailPage;