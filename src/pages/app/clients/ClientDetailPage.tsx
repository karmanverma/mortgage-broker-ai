
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
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';

// Import generated types
import { Database, Tables } from '@/integrations/supabase/types';
import { mapDbClientToClient } from '@/features/clients/types';

// Import Tab Components
import PersonalInfoTab from '@/components/clients/tabs/PersonalInfoTab';
import FinancialDetailsTab from '@/components/clients/tabs/FinancialDetailsTab';
import DocumentsTab from '@/components/clients/tabs/DocumentsTab';
import NotesTab from '@/components/clients/tabs/NotesTab';
import ActivityLogTab from '@/components/clients/tabs/ActivityLogTab';

// Define type aliases from generated types
type DbClient = Tables<"clients">;
type ClientNote = Tables<"client_notes">;
type ClientDocument = Tables<"documents"> & { client_id: string }; // Assuming documents will be filtered by client_id
type ClientActivity = Tables<"activities"> & { client_id: string }; // Assuming activities will be filtered by client_id

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

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
  <div className="flex items-start space-x-3">
    <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value || 'N/A'}</p>
    </div>
  </div>
);

const ClientDetailPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [dbClient, setDbClient] = useState<DbClient | null>(null);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const [notesRes, docsRes, activitiesRes] = await Promise.all([
          supabase
            .from('client_notes')
            .select('*')
            .eq('client_id', clientId)
            .eq('user_id', user.id) // Ensure note ownership matches user
            .order('created_at', { ascending: false }),
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
        ]);

        if (notesRes.error) console.error('Error fetching notes:', notesRes.error.message);
        else setNotes(notesRes.data || []);

        if (docsRes.error) console.error('Error fetching documents:', docsRes.error.message);
        // Ensure we only set documents confirmed to be ClientDocuments
        else setDocuments((docsRes.data || []).filter(doc => doc.client_id === clientId) as ClientDocument[]);

        if (activitiesRes.error) console.error('Error fetching activities:', activitiesRes.error.message);
        // Ensure we only set activities confirmed to be ClientActivities
        else setActivities((activitiesRes.data || []).filter(act => act.client_id === clientId) as ClientActivity[]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
       <div className="container mx-auto max-w-4xl p-4">
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

  // Define Tab structure using data
  const navItems = [
    {
      id: 'personal',
      label: 'Personal Info',
      icon: User,
      component: PersonalInfoTab,
      title: "Personal Information",
      description: "View and manage personal details.",
      data: dbClient // Pass the raw DB client data that the components expect
    },
    {
      id: 'financial',
      label: 'Financial Details',
      icon: DollarSign,
      component: FinancialDetailsTab,
      title: "Financial Details",
      description: "View and manage financial information.",
      data: dbClient // Pass the raw DB client data that the components expect
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      component: DocumentsTab,
      title: "Document Management",
      description: "Upload, view, and manage required client documents.",
      data: documents // Pass the fetched documents array
    },
    {
      id: 'notes',
      label: 'Notes',
      icon: ClipboardList,
      component: NotesTab,
      title: "Client Notes",
      description: "Add and review notes specific to this client.",
      data: { notes: notes, clientId: dbClient.id, userId: user?.id } // Pass notes array and IDs
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: Activity,
      component: ActivityLogTab,
      title: "Activity Log",
      description: "Track recent activities and interactions.",
      data: activities // Pass the fetched activities array
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
       <Button variant="outline" size="sm" asChild className="mb-4">
        <Link to="/app/clients">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients List
        </Link>
      </Button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar with Client Overview */}
        <aside className="w-full lg:w-1/4 xl:w-1/5 space-y-4 flex-shrink-0">
           <Card>
            <CardHeader>
              <CardTitle className="text-xl">{dbClient.first_name} {dbClient.last_name}</CardTitle>
              <CardDescription>Client Overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
               <DetailItem icon={Mail} label="Email" value={dbClient.email} />
               <DetailItem icon={Phone} label="Phone" value={dbClient.phone} />
               {/* Use employment_status or another field for the badge */}
               <div className="flex items-center space-x-3">
                   <BadgeCheck className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                   <div className="flex-1">
                       <p className="text-sm text-muted-foreground">Status</p>
                       <Badge variant={getStatusVariant(dbClient.employment_status)} className="mt-1">
                           {dbClient.employment_status || 'N/A'}
                       </Badge>
                   </div>
               </div>
               <DetailItem icon={CalendarDays} label="Date Added" value={formatDate(dbClient.created_at)} />
               <DetailItem icon={CalendarDays} label="Last Updated" value={formatDate(dbClient.updated_at)} />
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Area with Tabs */} 
        <main className="flex-1 min-w-0">
           <Tabs defaultValue="personal" className="w-full">
             <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-4">
               {navItems.map((item) => (
                 <TabsTrigger key={item.id} value={item.id} className="flex-1">
                   <item.icon className="mr-2 h-4 w-4" />
                   {item.label}
                 </TabsTrigger>
               ))}
             </TabsList>

             {navItems.map((item) => (
               <TabsContent key={item.id} value={item.id}>
                 {/* Render the specific tab component, passing the relevant data */}
                 <item.component data={item.data} />
               </TabsContent>
             ))}
           </Tabs>
        </main>
      </div>
    </div>
  );
};

export default ClientDetailPage;
