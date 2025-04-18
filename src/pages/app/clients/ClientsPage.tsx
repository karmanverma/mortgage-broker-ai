
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X as ClearIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client directly
import { useAuth } from '@/contexts/AuthContext'; // Import auth context to get user

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ClientList from '@/components/clients/ClientList';
import AddClientForm from '@/components/clients/AddClientForm';
// Use the generated types and our mapping functions
import { Client, mapDbClientToClient, mapClientToDbClient, ClientFormData } from '@/features/clients/types';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; 
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';

// Define Client form data based on Supabase Tables Insert (adjust as needed for form)
// type ClientFormData = Omit<TablesInsert<"clients">, 'id' | 'user_id' | 'created_at' | 'updated_at'>; 

// Example options (replace or augment with data/enums if needed)
const loanTypeOptions = ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo'];
const applicationStatusOptions = ['New', 'In Review', 'Approved', 'Denied', 'Withdrawn'];

const ClientsPage = () => {
  const { user } = useAuth(); // Get the current user
  const { toast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Filters based on actual schema columns
  const [selectedEmploymentStatus, setSelectedEmploymentStatus] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      console.log('useEffect: Fetching clients triggered.'); 
      if (!user) {
        console.log('useEffect: No user found, stopping fetch.');
        setLoading(false);
        return; 
      }

      console.log('useEffect: User found:', user.id); 
      setLoading(true);
      console.log('useEffect: setLoading(true)'); 

      // --- Debug: Check supabase object --- 
      console.log('useEffect: supabase object:', supabase);
      console.log('useEffect: typeof supabase.from:', typeof supabase?.from);
      // --- End Debug --- 

      try {
        // Ensure supabase client is valid before calling .from
        if (!supabase || typeof supabase.from !== 'function') {
           console.error('useEffect: Invalid Supabase client object.', supabase);
           toast({
             title: 'Initialization Error',
             description: 'Supabase client is not available.',
             variant: 'destructive',
           });
           setClients([]);
           setLoading(false);
           return;
        }

        const { data, error, status } = await supabase
          .from('clients')
          .select('*') 
          .eq('user_id', user.id) 
          .order('created_at', { ascending: false }); 

        console.log('useEffect: Supabase query finished.', { status, error, data }); 

        if (error) {
          console.error('Error fetching clients:', error);
          toast({
            title: 'Error fetching clients',
            description: error.message,
            variant: 'destructive',
          });
          setClients([]);
        } else if (data) {
          console.log('useEffect: Setting clients data:', data); 
          // Map DB clients to our Client type
          const mappedClients = data.map(dbClient => mapDbClientToClient(dbClient));
          setClients(mappedClients);
        } else {
           console.log('useEffect: No error, but no data received.'); 
           setClients([]); 
        }
      } catch (err) {
         console.error('useEffect: Caught unexpected error during fetch:', err); 
         toast({
            title: 'Unexpected error',
            description: 'An unexpected error occurred while fetching clients.',
            variant: 'destructive',
          });
         setClients([]);
      } finally {
          console.log('useEffect: setLoading(false)'); 
          setLoading(false);
      }
    };

    fetchClients();
  }, [user, toast]); 

  const handleAddClientSuccess = (newClientData: ClientFormData) => {
     if (!user || !supabase || typeof supabase.from !== 'function') { 
      toast({ title: 'Error', description: 'User not authenticated or Supabase client not ready.', variant: 'destructive' });
      return;
    }
    
    // Map client data to DB format before inserting
    const clientToInsert = mapClientToDbClient(newClientData, user.id);
    
    // Ensure email is always provided as it's required in the database
    if (!clientToInsert.email) {
      toast({ 
        title: 'Validation Error', 
        description: 'Email is required.',
        variant: 'destructive'
      });
      return;
    }

    supabase
      .from('clients')
      .insert(clientToInsert)
      .select('*') 
      .single() 
      .then(({ data: newClient, error }) => {
        if (error) {
          console.error('Error adding client:', error);
          toast({
            title: 'Error adding client',
            description: error.message,
            variant: 'destructive',
          });
        } else if (newClient) {
          toast({
            title: 'Client Added',
            description: `${newClient.first_name} ${newClient.last_name} has been added.`,
          });
          
          // Map the new client to our format before adding to state
          const mappedNewClient = mapDbClientToClient(newClient);
          setClients(prevClients => [mappedNewClient, ...prevClients]);
          setIsAddClientDialogOpen(false);
        }
      });
  };

  // Memoized filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch =
        searchTerm === '' ||
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.phone && client.phone.includes(searchTerm));

      
      const matchesEmployment = selectedEmploymentStatus === 'all' || 
                               (client.employmentStatus === selectedEmploymentStatus);
      const matchesState = selectedState === 'all' || 
                          (client.state === selectedState);

      return matchesSearch && matchesEmployment && matchesState;
    });
  }, [clients, searchTerm, selectedEmploymentStatus, selectedState]);

  
  const uniqueEmploymentStatuses = useMemo(() => 
    Array.from(new Set(clients.map(c => c.employmentStatus))), [clients]);
  
  const uniqueStates = useMemo(() => 
    Array.from(new Set(clients.map(c => c.state).filter(Boolean))), [clients]);

  const clearFilters = () => {
     setSearchTerm('');
     setSelectedEmploymentStatus('all');
     setSelectedState('all');
  };

  const hasActiveFilters = searchTerm !== '' || selectedEmploymentStatus !== 'all' || selectedState !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */} 
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Client Management</h1>
        <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
          <DialogTrigger asChild>
             <Button>
               <Plus className="mr-2 h-4 w-4" /> Add New Client
             </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Fill in the details below.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-6 pl-1 py-4 -mr-6 -ml-1">
                
                <AddClientForm onSubmitSuccess={handleAddClientSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Controls Area */} 
      <div className="flex flex-col md:flex-row items-center gap-4">
          <Input 
            placeholder="Search name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm w-full md:w-auto"
          />
          {/* Employment Status Filter */}
          <Select value={selectedEmploymentStatus} onValueChange={setSelectedEmploymentStatus}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by Employment..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employment</SelectItem>
              {uniqueEmploymentStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           {/* State Filter */}
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by State..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Clear Filters Button */} 
          {hasActiveFilters && (
             <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                <ClearIcon className="mr-2 h-4 w-4" /> Clear Filters
             </Button>
          )}
      </div>

      {/* Client List Component - Conditionally render based on loading state */} 
      {loading ? (
        <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading clients...</span>
        </div>
      ) : (
        <ClientList clients={filteredClients} /> 
      )}
    </div>
  );
};

export default ClientsPage;
