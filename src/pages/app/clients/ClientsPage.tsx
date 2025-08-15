import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { useNavigate } from 'react-router-dom';
import { useImprovedClients, ClientWithPeople } from '@/hooks/useImprovedClients';
import { Client } from '@/features/clients/types';
import EnhancedAddClientForm from '@/components/clients/EnhancedAddClientForm';
import { PersonDisplay } from '@/components/people/PersonDisplay';
import { PeopleManager } from '@/components/people/PeopleManager';
import ClientsList from '@/components/clients/ClientsList';

const ClientsPage = () => {
  const navigate = useNavigate();
  const { 
    clients, 
    isLoading, 
    error,
    addPersonToClient,
    removePersonFromClient,
    setPrimaryPerson,
    deleteClient,
    isDeleting,
  } = useImprovedClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [expandedPeople, setExpandedPeople] = useState<Record<string, boolean>>({});
  const [managingPeopleFor, setManagingPeopleFor] = useState<string | null>(null);

  // No need for manual fetchClients call - data is automatically managed

  const filteredClients = clients.filter(client => {
    const matchesSearch = searchTerm === '' || 
      `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleClientClick = (clientId: string) => {
    navigate(`/app/clients/${clientId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const togglePeopleExpanded = (clientId: string) => {
    setExpandedPeople(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  const handleManagePeople = (clientId: string) => {
    setManagingPeopleFor(clientId);
  };

  const handleDeleteClient = (client: Client) => {
    if (confirm(`Are you sure you want to delete ${client.firstName} ${client.lastName}?`)) {
      deleteClient(client.id);
    }
  };

  const currentClient = managingPeopleFor ? clients.find(c => c.id === managingPeopleFor) : null;

  return (
    <div className="p-6">
      <PageHeader
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search clients..."
        filters={[
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'inactive', label: 'Inactive' }
            ],
            placeholder: 'Filter by status'
          }
        ]}
        viewMode={view}
        onViewModeChange={setView}
        viewOptions={['grid', 'list']}
        onAddClick={() => setIsAddClientOpen(true)}
        addButtonText="Add Client"
        addButtonIcon={<Plus className="h-4 w-4" />}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-6 text-red-500">
          <p>Error loading clients: {error.message}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
            Retry
          </Button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">No clients found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? "Try adjusting your search or filters"
              : "Get started by adding your first client"}
          </p>
          <Button onClick={() => setIsAddClientOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Client
          </Button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card 
              key={client.id} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleClientClick(client.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className={getStatusColor(client.status || 'active')}>
                    {client.status || 'Active'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleClientClick(client.id);
                      }}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        // Edit functionality
                      }}>
                        Edit Client
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(client);
                        }}
                        disabled={isDeleting}
                      >
                        Delete Client
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={client.avatarUrl || ''} alt={`${client.firstName} ${client.lastName}`} />
                    <AvatarFallback>{getInitials(client.firstName, client.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{client.firstName} {client.lastName}</h3>
                    <p className="text-sm text-gray-500">{client.email}</p>
                  </div>
                </div>
                
                {/* People Information */}
                <div className="border-t pt-3">
                  <PersonDisplay
                    people={(client as ClientWithPeople).people || []}
                    showExpanded={expandedPeople[client.id]}
                    onToggleExpanded={() => togglePeopleExpanded(client.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManagePeople(client.id);
                    }}
                    className="mt-2 h-6 text-xs"
                  >
                    Manage People
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <ClientsList
          clients={filteredClients}
          isLoading={isLoading}
          error={error?.message || null}
          onClientClick={(client) => handleClientClick(client.id)}
          onDeleteClient={handleDeleteClient}
          isDeleting={isDeleting}
        />
      )}

      {/* Add Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client by selecting a person and adding client-specific information.
            </DialogDescription>
          </DialogHeader>
          <EnhancedAddClientForm 
            onSubmitSuccess={() => setIsAddClientOpen(false)}
            onCancel={() => setIsAddClientOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* People Management Dialog */}
      {currentClient && (
        <Dialog open={!!managingPeopleFor} onOpenChange={() => setManagingPeopleFor(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Manage People for {currentClient.firstName} {currentClient.lastName}</DialogTitle>
              <DialogDescription>
                Add, remove, or manage people associated with this client.
              </DialogDescription>
            </DialogHeader>
            <PeopleManager
              entityType="client"
              entityId={currentClient.id}
              entityName={`${currentClient.firstName} ${currentClient.lastName}`}
              people={(currentClient as ClientWithPeople).people || []}
              onAddPerson={(personId, isPrimary, relationshipType) => 
                addPersonToClient({ clientId: currentClient.id, personId, isPrimary, relationshipType })
              }
              onRemovePerson={(personId) => 
                removePersonFromClient({ clientId: currentClient.id, personId })
              }
              onSetPrimary={(personId) => 
                setPrimaryPerson({ clientId: currentClient.id, personId })
              }
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ClientsPage;
