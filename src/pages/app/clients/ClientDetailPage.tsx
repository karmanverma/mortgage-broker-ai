'use client';

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  DollarSign,
  FileText,
  Mail,
  Phone,
  User,
  BadgeCheck,
  Activity,
  ClipboardList,
  Loader2,
  AlertCircle,
  TrendingUp,
  Home,
  Building2,
  MessageSquare,
  StickyNote
} from 'lucide-react';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Import generated types
import { Database, Tables } from '@/integrations/supabase/types';
import { mapDbClientToClient } from '@/features/clients/types';

// Import Tab Components
import PersonalInfoTab from '@/components/clients/tabs/PersonalInfoTab';
import FinancialDetailsTab from '@/components/clients/tabs/FinancialDetailsTab';
import DocumentsTab from '@/components/clients/tabs/DocumentsTab';
import NotesTab from '@/components/clients/tabs/NotesTab';
import ActivityLogTab from '@/components/clients/tabs/ActivityLogTab';
import { RelationshipsTab } from '@/components/clients/tabs/RelationshipsTab';
import { LoansTab } from '@/components/clients/tabs/LoansTab';
import { PropertiesTab } from '@/components/clients/tabs/PropertiesTab';
import { OpportunitiesTab } from '@/components/clients/tabs/OpportunitiesTab';
import { EntitiesTab } from '@/components/clients/tabs/EntitiesTab';
import { OverviewTab } from '@/components/clients/tabs/OverviewTab';
import { ClientHeader } from '@/components/clients/ClientHeader';
import { useImprovedClients } from '@/hooks/useImprovedClients';

// Define type aliases from generated types
type DbClient = Tables<"clients">;
type ClientDocument = Tables<"documents"> & { client_id: string }; // Assuming documents will be filtered by client_id
type ClientActivity = Tables<"activities"> & { client_id: string }; // Assuming activities will be filtered by client_id

// Define specific types for each tab's data prop
type PersonalInfoTabData = DbClient;
type FinancialDetailsTabData = DbClient;
type DocumentsTabData = ClientDocument[];
type ActivityLogTabData = ClientActivity[];

// Helper function to format currency (handle null/undefined)
const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Helper function to format date (handle null/undefined string or Date)
const formatDate = (date: string | Date | null | undefined, formatString = 'PPP') => {
  if (!date) return 'N/A';
  try {
    const validDate = typeof date === 'string' ? new Date(date) : date;
    // Check if date is valid after conversion
    if (isNaN(validDate.getTime())) return 'Invalid Date'; 
    return format(validDate, formatString);
  } catch {
    return 'Invalid Date';
  }
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | null | undefined;

// Update to use employment_status or another relevant field if applicationStatus is removed
const getStatusVariant = (status: string | null | undefined): BadgeVariant => {
  // Example using employment_status, adjust as needed
  switch (status?.toLowerCase()) {
    case 'employed': return 'default';
    case 'self-employed': return 'secondary';
    case 'unemployed': return 'outline';
    case 'retired': return 'secondary';
    default: return 'secondary';
  }
};

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => {
  const { toast } = useToast();
  
  const handleCopy = () => {
    if (typeof value === 'string') {
      navigator.clipboard.writeText(value);
      toast({
        title: 'Copied to clipboard',
        description: `${label} copied`,
      });
    }
  };

  // Check if the value is a phone number or email
  const isClickable = typeof value === 'string' && (label.toLowerCase().includes('email') || label.toLowerCase().includes('phone'));

  return (
    <div className="flex items-start space-x-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div 
          className={`text-sm font-medium ${isClickable ? 'cursor-pointer hover:underline' : ''} truncate`}
          onClick={isClickable ? handleCopy : undefined}
          title={isClickable ? `Click to copy ${value}` : undefined}
        >
          {value || 'N/A'}
        </div>
      </div>
    </div>
  );
};

// Define a type for the tab items to ensure proper typing
interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  component: React.FC<any>; // We'll handle type checking elsewhere
  title: string;
  description: string;
  data: any; // This will be typed properly when we assign values
}

const ClientDetailPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [dbClient, setDbClient] = useState<DbClient | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get people management functions
  const { addPersonToClient, removePersonFromClient, setPrimaryPerson, deleteClient, isDeleting } = useImprovedClients();

  const [editingTab, setEditingTab] = useState<string|null>(null);
  const [editedPersonal, setEditedPersonal] = useState<PersonalInfoTabData|null>(null);
  const [editedFinancial, setEditedFinancial] = useState<FinancialDetailsTabData|null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      if (!clientId || !user) {
        setLoading(false);
        setError('Client ID or user not found.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch Client Details
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .eq('user_id', user.id) // Ensure ownership
          .single();

        if (clientError) throw new Error(clientError.message || 'Failed to fetch client details');
        if (!clientData) throw new Error('Client not found or access denied.');
        setDbClient(clientData);

        // Fetch Related Data in parallel
        const [docsRes, activitiesRes, peopleRes] = await Promise.all([
          supabase
            .from('documents')
            .select('*')
            .eq('client_id', clientId) // Filter documents by client_id
            // RLS should handle user access check based on client ownership
            .order('created_at', { ascending: false }),
          supabase
            .from('activities')
            .select('*')
            .eq('client_id', clientId) // Filter activities by client_id
            // RLS should handle user access check based on client ownership
            .order('created_at', { ascending: false }),
          supabase
            .from('client_people')
            .select(`
              is_primary,
              relationship_type,
              relationship_notes,
              contact_preference,
              is_authorized_contact,
              people:person_id (
                id,
                first_name,
                last_name,
                email_primary,
                phone_primary,
                company_name,
                title_position
              )
            `)
            .eq('client_id', clientId)
            .eq('user_id', user.id)
            .order('is_primary', { ascending: false }),
        ]);

        if (docsRes.error) console.error('Error fetching documents:', docsRes.error.message);
        // Ensure we only set documents confirmed to be ClientDocuments
        else setDocuments((docsRes.data || []).filter(doc => doc.client_id === clientId) as ClientDocument[]);

        if (activitiesRes.error) console.error('Error fetching activities:', activitiesRes.error.message);
        // Ensure we only set activities confirmed to be ClientActivities
        else setActivities((activitiesRes.data || []).filter(act => act.client_id === clientId) as ClientActivity[]);

        if (peopleRes.error) console.error('Error fetching people:', peopleRes.error.message);
        else {
          const peopleData = peopleRes.data?.map(rel => ({
            ...rel.people,
            is_primary: rel.is_primary,
            relationship_type: rel.relationship_type,
            relationship_notes: rel.relationship_notes,
            contact_preference: rel.contact_preference,
            is_authorized_contact: rel.is_authorized_contact
          })).filter(p => p.id) || [];
          setPeople(peopleData);
        }

      } catch (err: any) {
        console.error("Error loading client page data:", err);
        setError(err.message || 'An unexpected error occurred.');
        toast({
          title: 'Error loading data',
          description: err.message,
          variant: 'destructive',
        });
        // Optionally navigate back if client data is essential and failed
        if (!dbClient) {
           // navigate('/app/clients');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId, user, toast, navigate]); 

  // Map DB client to our frontend client format when needed
  const client = dbClient ? mapDbClientToClient(dbClient) : null;

  // Helper: check if there are unsaved changes
  const hasUnsavedChanges = !!(
    (editingTab === 'overview' && editedPersonal && JSON.stringify(editedPersonal) !== JSON.stringify(dbClient)) ||
    (editingTab === 'financial' && editedFinancial && JSON.stringify(editedFinancial) !== JSON.stringify(dbClient))
  );

  // Tab change handler
  const handleTabChange = (tab: string) => {
    if (editingTab && hasUnsavedChanges) {
      setPendingTab(tab);
      setUnsavedDialogOpen(true);
    } else {
      setEditingTab(null);
      setPendingTab(null);
      setEditedPersonal(null);
      setEditedFinancial(null);
      setActiveTab(tab);
    }
  };

  // Save handler
  const handleSave = async () => {
    let result, error;
    if (editingTab === 'overview' && editedPersonal) {
      // Save personal info changes to backend
      const updateObj = { ...editedPersonal };
      delete updateObj.id; // id is used as filter, not updated
      ({ data: result, error } = await supabase
        .from('clients')
        .update(updateObj)
        .eq('id', editedPersonal.id)
        .select()
      );
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      setDbClient(result?.[0] || editedPersonal);
      setEditingTab(null);
      setEditedPersonal(null);
      toast({ title: 'Saved', description: 'Client information updated.' });
    } else if (editingTab === 'financial' && editedFinancial) {
      // Save financial info changes to backend
      const updateObj = { ...editedFinancial };
      delete updateObj.id;
      ({ data: result, error } = await supabase
        .from('clients')
        .update(updateObj)
        .eq('id', editedFinancial.id)
        .select()
      );
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      setDbClient(result?.[0] || editedFinancial);
      setEditingTab(null);
      setEditedFinancial(null);
      toast({ title: 'Saved', description: 'Financial details updated.' });
    }
    setUnsavedDialogOpen(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  // Discard handler
  const handleDiscard = () => {
    setEditingTab(null);
    setEditedPersonal(null);
    setEditedFinancial(null);
    setUnsavedDialogOpen(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
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
            <Link to="/app/clients">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients List
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

  if (!dbClient || !client) {
       // This state might be brief if error state is set correctly
       return (
        <div className="text-center py-10">
          <p className="text-lg font-medium text-muted-foreground">Client data not available.</p>
           <Button variant="outline" asChild className="mt-4">
            <Link to="/app/clients">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
            </Link>
          </Button>
        </div>
      );
  }

  // Get primary person
  const primaryPerson = people.find(p => p.is_primary);

  // Define Tab structure with dynamic visibility based on client type
  const getTabsForClientType = (clientType: string) => {
    const universalTabs = [
      {
        id: 'overview',
        label: 'Overview',
        icon: User,
        component: OverviewTab as React.FC<any>,
        title: "Client Overview",
        description: "Comprehensive client overview with contact, financial, and profile information.",
        data: { client: dbClient, primaryPerson: primaryPerson, allPeople: people }
      },
      {
        id: 'opportunities',
        label: 'Opportunities',
        icon: TrendingUp,
        component: OpportunitiesTab as React.FC<any>,
        title: "Business Opportunities",
        description: "Track potential business opportunities for this client.",
        data: { clientId: dbClient.id, clientType: clientType }
      },
      {
        id: 'relationships',
        label: 'Relationships',
        icon: User,
        component: RelationshipsTab as React.FC<any>,
        title: "Client Relationships",
        description: "Manage people associated with this client.",
        data: { clientId: dbClient.id, clientType: clientType, people: people }
      },
      {
        id: 'loans',
        label: 'Loans',
        icon: TrendingUp,
        component: LoansTab as React.FC<any>,
        title: "Loan Pipeline",
        description: "Track active and historical loans.",
        data: { clientId: dbClient.id, clientType: clientType }
      },
      {
        id: 'properties',
        label: 'Properties',
        icon: clientType === 'residential' ? Home : Building2,
        component: PropertiesTab as React.FC<any>,
        title: "Property Portfolio",
        description: "Manage properties associated with this client.",
        data: { clientId: dbClient.id, clientType: clientType }
      },
      {
        id: 'financial',
        label: 'Financial Details',
        icon: DollarSign,
        component: FinancialDetailsTab as React.FC<{data: FinancialDetailsTabData}>,
        title: "Financial Details",
        description: "View and manage financial information.",
        data: dbClient as FinancialDetailsTabData
      },
      {
        id: 'documents',
        label: 'Documents',
        icon: FileText,
        component: DocumentsTab as React.FC<any>,
        title: "Document Management",
        description: "Upload, view, and manage required client documents.",
        data: { clientId: dbClient.id }
      },

      {
        id: 'notes',
        label: 'Notes',
        icon: StickyNote,
        component: NotesTab as React.FC<{data: {clientId: string}}>,
        title: "Client Notes",
        description: "Add and review notes specific to this client.",
        data: { clientId: dbClient.id }
      },
      {
        id: 'activity',
        label: 'Activity Log',
        icon: Activity,
        component: ActivityLogTab as React.FC<{data: ActivityLogTabData}>,
        title: "Activity Log",
        description: "Track recent activities and interactions.",
        data: activities as ActivityLogTabData
      },
    ];

    // Add commercial-specific tabs
    if (clientType === 'commercial' || clientType === 'investor') {
      universalTabs.splice(-2, 0, {
        id: 'entities',
        label: 'Entities',
        icon: Building2,
        component: EntitiesTab as React.FC<any>,
        title: "Business Entities",
        description: "Manage business structure and ownership details.",
        data: { clientId: dbClient.id }
      });
    }

    return universalTabs;
  };

  const navItems = getTabsForClientType(dbClient.client_type || 'residential');

  // Handler functions for ClientHeader
  const handleDeleteClient = () => {
    if (!dbClient) return;
    
    const clientName = primaryPerson ? 
      `${primaryPerson.first_name} ${primaryPerson.last_name}` : 
      'this client';
    
    if (confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      deleteClient(dbClient.id);
      navigate('/app/clients');
    }
  };

  const handleUpdateLastContact = async () => {
    if (!dbClient) return;
    
    const { error } = await supabase
      .from('clients')
      .update({ last_contact_date: new Date().toISOString() })
      .eq('id', dbClient.id)
      .eq('user_id', user?.id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update last contact date',
        variant: 'destructive',
      });
    } else {
      setDbClient({ ...dbClient, last_contact_date: new Date().toISOString() });
      toast({
        title: 'Updated',
        description: 'Last contact date updated successfully',
      });
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
       <Button variant="outline" size="sm" asChild className="mb-4">
        <Link to="/app/clients">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients List
        </Link>
      </Button>

      {/* Enhanced Client Header */}
      <ClientHeader
        client={dbClient}
        primaryPerson={primaryPerson}
        onEdit={() => setActiveTab('overview')}
        onAddNote={() => setActiveTab('notes')}
        onSendMessage={() => setActiveTab('communications')}
        onDelete={handleDeleteClient}
        onUpdateLastContact={handleUpdateLastContact}
      />

      {/* Main Content Area with Tabs */} 
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex w-full mb-4 overflow-x-auto">
         {navItems.map((item) => (
            <TabsTrigger key={item.id} value={item.id} className="flex-shrink-0 flex items-center whitespace-nowrap px-3">
              <item.icon className="mr-1 h-4 w-4 flex-shrink-0" />
             {item.label}
           </TabsTrigger>
         ))}
       </TabsList>

       {navItems.map((item) => (
         <TabsContent key={item.id} value={item.id}>
           {/* Handle different tab types */}
           {item.id === 'overview' ? (
             <OverviewTab
               client={dbClient}
               primaryPerson={primaryPerson}
               allPeople={people}
             />
           ) : item.id === 'financial' ? (
             <FinancialDetailsTab
               data={editingTab === 'financial' && editedFinancial ? editedFinancial : dbClient}
               isEditing={editingTab === 'financial'}
               onEdit={() => { setEditingTab('financial'); setEditedFinancial(dbClient); }}
               onChange={setEditedFinancial}
               onSave={handleSave}
             />
           ) : item.id === 'opportunities' ? (
             <OpportunitiesTab
               clientId={dbClient.id}
               clientType={dbClient.client_type || 'residential'}
               primaryPerson={primaryPerson}
             />
           ) : item.id === 'relationships' ? (
             <RelationshipsTab
               clientId={dbClient.id}
               clientType={dbClient.client_type || 'residential'}
               people={people}
               onAddPerson={(personId, isPrimary, relationshipType) => 
                 addPersonToClient({ clientId: dbClient.id, personId, isPrimary, relationshipType })
               }
               onRemovePerson={(personId) => 
                 removePersonFromClient({ clientId: dbClient.id, personId })
               }
               onSetPrimary={(personId) => 
                 setPrimaryPerson({ clientId: dbClient.id, personId })
               }
             />
           ) : item.id === 'documents' ? (
             <DocumentsTab clientId={dbClient.id} />
           ) : (
             <item.component data={item.data} />
           )}
         </TabsContent>
       ))}
     </Tabs>
      <Dialog open={unsavedDialogOpen} onOpenChange={setUnsavedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
          </DialogHeader>
          <p>You have unsaved changes. Would you like to save or discard them?</p>
          <DialogFooter>
            <Button onClick={handleDiscard} variant="outline">Discard</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailPage;
