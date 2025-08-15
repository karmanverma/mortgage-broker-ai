import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BarChart4,
  Building,
  Clock,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddLenderForm } from "@/components/lenders/AddLenderForm";
import { useImprovedLenders } from "@/hooks/useImprovedLenders";
import TodosWidget from "@/components/todos/TodosWidget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

const fetchActivities = async (userId: string) => {
  console.log("Attempting to fetch activities...");
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      lender:lenders(name, people_id, people:people_id(first_name, last_name)),
      client:clients(people_id, people:people_id(first_name, last_name)),
      document:documents(name)
    `)
    .eq('user_id', userId)
    .limit(5)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching activities:", error);
    throw error;
  }
  console.log("Fetched activities data:", data);
  return data;
};

const fetchClients = async (userId: string) => {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching clients count:", error);
    throw error;
  }
  return count;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [isAddLenderOpen, setIsAddLenderOpen] = useState(false);

  // Mock data for lender types and status options (should come from API in production)
  const lenderTypes = ["Bank", "Credit Union", "Mortgage Broker", "Private Lender", "Other"];
  const statusOptions = ["Active", "Pending", "Inactive"];

  const {
    lenders: allLenders,
    isLoading: isLoadingLenders,
    error: lendersError,
  } = useImprovedLenders();

  // Get first 4 lenders for dashboard display
  const lenders = allLenders?.slice(0, 4) || [];

  const {
    data: activities,
    isLoading: isLoadingActivities,
    error: activitiesError,
    refetch: refetchActivities
  } = useQuery({
    queryKey: ['activities', user?.id],
    queryFn: () => user ? fetchActivities(user.id) : Promise.resolve([]),
    enabled: !!user,
  });
  
  // Set up real-time subscription for activities
  useEffect(() => {
    if (!user) return;
    
    const subscription = supabase
      .channel('activities-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activities',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Refetch activities when a new one is added
        refetchActivities();
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, refetchActivities]);

  const {
    data: clientsCount,
    isLoading: isLoadingClients,
    error: clientsError,
  } = useQuery({
    queryKey: ['clientsCount', user?.id],
    queryFn: () => user ? fetchClients(user.id) : Promise.resolve(0),
    enabled: !!user,
  });

  React.useEffect(() => {
    // Lender errors are now handled automatically by useImprovedLenders
    if (activitiesError) {
      console.error("Dashboard activitiesError effect:", activitiesError);
      toast({
        variant: "destructive",
        title: "Error fetching activities",
        description: activitiesError.message,
      });
    }
    if (clientsError) {
      toast({
        variant: "destructive",
        title: "Error fetching clients count",
        description: clientsError.message,
      });
    }
  }, [activitiesError, clientsError]);

  if (isLoadingLenders || isLoadingActivities || isLoadingClients) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        {/* <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1> Removed main page title as it is now in header */}
      </div>

      {/* Top Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Lenders</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{allLenders?.length ?? 0}</div><p className="text-xs text-muted-foreground">Active lenders</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Clients</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{clientsCount ?? 0}</div><p className="text-xs text-muted-foreground">Managed clients</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Documents</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">154</div><p className="text-xs text-muted-foreground">2.1 GB used</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. Rate</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">4.35%</div><p className="text-xs text-red-500">+0.15%</p></CardContent></Card>
      </div>

      {/* Middle Section: Activity & Lenders */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>Latest actions and updates</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {isLoadingActivities ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : activitiesError ? (
              <div className="p-4 bg-red-50 text-red-500 rounded-md">
                <p>Error loading activities. Please try refreshing.</p>
              </div>
            ) : activities && activities.length > 0 ? activities.map((activity: any) => {
              // Determine icon and text based on activity type
              let avatarContent = 'A';
              
              if (activity.action_type?.includes('client')) {
                const clientPerson = activity.client?.people;
                avatarContent = clientPerson ? getInitials(`${clientPerson.first_name} ${clientPerson.last_name}`) : 'C';
              } else if (activity.action_type?.includes('lender')) {
                const lenderPerson = activity.lender?.people;
                avatarContent = lenderPerson ? getInitials(`${lenderPerson.first_name} ${lenderPerson.last_name}`) : 
                              activity.lender?.name ? getInitials(activity.lender.name) : 'L';
              } else if (activity.action_type?.includes('document')) {
                avatarContent = 'D';
              }
              
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-2 hover:bg-muted/30 rounded-md transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className={`
                      ${activity.action_type?.includes('client') ? 'bg-blue-100 text-blue-600' : ''}
                      ${activity.action_type?.includes('lender') ? 'bg-purple-100 text-purple-600' : ''}
                      ${activity.action_type?.includes('document') ? 'bg-amber-100 text-amber-600' : ''}
                    `}>
                      {avatarContent}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description || 'Activity'}
                    </p>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                      {activity.client?.people && (
                        <Badge variant="outline" className="px-1 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                          {activity.client.people.first_name} {activity.client.people.last_name}
                        </Badge>
                      )}
                      {activity.lender && (
                        <Badge variant="outline" className="px-1 py-0 h-4 bg-purple-50 text-purple-600 border-purple-200">
                          {activity.lender.people ? 
                            `${activity.lender.people.first_name} ${activity.lender.people.last_name}` : 
                            activity.lender.name
                          }
                        </Badge>
                      )}
                      {activity.document?.name && (
                        <Badge variant="outline" className="px-1 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
                          {activity.document.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              );
            }) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No recent activity.</p>
                <p className="text-xs text-muted-foreground mt-1">Activities will appear here as you work with clients and lenders.</p>
              </div>
            )}
          </CardContent>
          <CardFooter><Button variant="link" size="sm" className="ml-auto">View all activity</Button></CardFooter>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Lenders</CardTitle>
              <CardDescription>Recent lender relationships</CardDescription>
            </div>
            <Dialog open={isAddLenderOpen} onOpenChange={setIsAddLenderOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Lender</DialogTitle>
                  <DialogDescription>Enter lender details below</DialogDescription>
                </DialogHeader>
                <AddLenderForm 
                  isOpen={isAddLenderOpen} 
                  onClose={() => setIsAddLenderOpen(false)} 
                  lenderTypes={lenderTypes}
                  statusOptions={statusOptions}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingLenders ? (
              <p>Loading...</p>
            ) : lendersError ? (
              <p className="text-red-500">Error loading lenders.</p>
            ) : lenders && lenders.length > 0 ? (
              <div className="space-y-4">
                {lenders.map((lender: any) => (
                  <div key={lender.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {lender.primary_person ? 
                            getInitials(`${lender.primary_person.first_name} ${lender.primary_person.last_name}`) : 
                            getInitials(lender.name)
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {lender.primary_person ? 
                            `${lender.primary_person.first_name} ${lender.primary_person.last_name}` : 
                            lender.name
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">{lender.type || 'Traditional'}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Contact
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">No lenders found</p>
                <Dialog open={isAddLenderOpen} onOpenChange={setIsAddLenderOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-2" size="sm">
                      <Plus className="mr-1 h-4 w-4" /> Add Your First Lender
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Lender</DialogTitle>
                      <DialogDescription>Enter lender details below</DialogDescription>
                    </DialogHeader>
                    <AddLenderForm 
                      isOpen={isAddLenderOpen} 
                      onClose={() => setIsAddLenderOpen(false)} 
                      lenderTypes={lenderTypes}
                      statusOptions={statusOptions}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="link" className="ml-auto" asChild>
              <Link to="/app/lenders">View all lenders</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Middle Section: Activity, Lenders & Todos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>Latest actions and updates</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {isLoadingActivities ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : activitiesError ? (
              <div className="p-4 bg-red-50 text-red-500 rounded-md">
                <p>Error loading activities. Please try refreshing.</p>
              </div>
            ) : activities && activities.length > 0 ? activities.map((activity: any) => {
              // Determine icon and text based on activity type
              let avatarContent = 'A';
              
              if (activity.action_type?.includes('client')) {
                const clientPerson = activity.client?.people;
                avatarContent = clientPerson ? getInitials(`${clientPerson.first_name} ${clientPerson.last_name}`) : 'C';
              } else if (activity.action_type?.includes('lender')) {
                const lenderPerson = activity.lender?.people;
                avatarContent = lenderPerson ? getInitials(`${lenderPerson.first_name} ${lenderPerson.last_name}`) : 
                              activity.lender?.name ? getInitials(activity.lender.name) : 'L';
              } else if (activity.action_type?.includes('document')) {
                avatarContent = 'D';
              }
              
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-2 hover:bg-muted/30 rounded-md transition-colors">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className={`
                      ${activity.action_type?.includes('client') ? 'bg-blue-100 text-blue-600' : ''}
                      ${activity.action_type?.includes('lender') ? 'bg-purple-100 text-purple-600' : ''}
                      ${activity.action_type?.includes('document') ? 'bg-amber-100 text-amber-600' : ''}
                    `}>
                      {avatarContent}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.description || 'Activity'}
                    </p>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                      {activity.client?.people && (
                        <Badge variant="outline" className="px-1 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                          {activity.client.people.first_name} {activity.client.people.last_name}
                        </Badge>
                      )}
                      {activity.lender && (
                        <Badge variant="outline" className="px-1 py-0 h-4 bg-purple-50 text-purple-600 border-purple-200">
                          {activity.lender.people ? 
                            `${activity.lender.people.first_name} ${activity.lender.people.last_name}` : 
                            activity.lender.name
                          }
                        </Badge>
                      )}
                      {activity.document?.name && (
                        <Badge variant="outline" className="px-1 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
                          {activity.document.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </div>
                </div>
              );
            }) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No recent activity.</p>
                <p className="text-xs text-muted-foreground mt-1">Activities will appear here as you work with clients and lenders.</p>
              </div>
            )}
          </CardContent>
          <CardFooter><Button variant="link" size="sm" className="ml-auto">View all activity</Button></CardFooter>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>To-dos</CardTitle>
              <CardDescription>Your upcoming tasks</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TodosWidget showHeader={false} maxItems={6} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:bg-secondary transition-colors cursor-pointer"><Link to="/app/clients" className="block p-6"><div className="flex flex-col items-center text-center space-y-2"><div className="p-2 bg-purple-100 rounded-full"><UserPlus className="h-6 w-6 text-purple-600" /></div><h3 className="font-medium">Add New Client</h3><p className="text-sm text-muted-foreground">Create a client record</p></div></Link></Card>
        <Card className="hover:bg-secondary transition-colors cursor-pointer"><Link to="/app/lenders" className="block p-6"><div className="flex flex-col items-center text-center space-y-2"><div className="p-2 bg-blue-100 rounded-full"><Building className="h-6 w-6 text-blue-600" /></div><h3 className="font-medium">Manage Lenders</h3><p className="text-sm text-muted-foreground">View/update lenders</p></div></Link></Card>
        <Card className="hover:bg-secondary transition-colors cursor-pointer"><Link to="/app/assistant" className="block p-6"><div className="flex flex-col items-center text-center space-y-2"><div className="p-2 bg-primary/10 rounded-full"><MessageSquare className="h-6 w-6 text-primary" /></div><h3 className="font-medium">AI Assistant</h3><p className="text-sm text-muted-foreground">Ask questions</p></div></Link></Card>
        <Card className="hover:bg-secondary transition-colors cursor-pointer"><Link to="/app/account" className="block p-6"><div className="flex flex-col items-center text-center space-y-2"><div className="p-2 bg-emerald-100 rounded-full"><Users className="h-6 w-6 text-emerald-600" /></div><h3 className="font-medium">Account Settings</h3><p className="text-sm text-muted-foreground">Manage profile</p></div></Link></Card>
      </div>
    </div>
  );
};

export default Dashboard;
