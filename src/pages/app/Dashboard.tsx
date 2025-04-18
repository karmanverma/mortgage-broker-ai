
import React, { useState } from 'react';
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
// Fix the import - AddLenderForm doesn't have a default export
import { AddLenderForm } from "@/components/lenders/AddLenderForm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

// Fetch Lenders
const fetchLenders = async () => {
  const { data, error } = await supabase
    .from('lenders')
    .select('*')
    .limit(4);

  if (error) {
    console.error("Error fetching lenders:", error);
    throw error;
  }
  return data;
};

// Fetch Activities
const fetchActivities = async () => {
  console.log("Attempting to fetch activities...");
  const { data, error } = await supabase
    .from('activities')
    .select('*, lender:lenders(name), document:documents(name)')
    .limit(4)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching activities:", error);
    throw error;
  }
  console.log("Fetched activities data:", data);
  return data;
};

// Fetch Clients Count
const fetchClients = async () => {
  // Fetch only the count for efficiency
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true }); // head: true only fetches count

  if (error) {
    console.error("Error fetching clients count:", error);
    throw error;
  }
  return count;
};


const Dashboard = () => {
  const { user } = useAuth();

  const {
    data: lenders,
    isLoading: isLoadingLenders,
    error: lendersError,
  } = useQuery({
    queryKey: ['lenders'],
    queryFn: fetchLenders,
  });

  const {
    data: activities,
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
  });

  const {
    data: clientsCount,
    isLoading: isLoadingClients,
    error: clientsError,
  } = useQuery({
    queryKey: ['clientsCount'],
    queryFn: fetchClients,
  });


  React.useEffect(() => {
    if (lendersError) {
      toast({
        variant: "destructive",
        title: "Error fetching lenders",
        description: lendersError.message,
      });
    }
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
  }, [lendersError, activitiesError, clientsError]);


  if (isLoadingLenders || isLoadingActivities || isLoadingClients) { // Added isLoadingClients
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Helper to get initials from name
  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('');
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Stats Cards Section - Replaced AI Queries with Total Clients */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Lenders Card */}
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Lenders</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{lenders?.length ?? 0}</div><p className="text-xs text-muted-foreground">Active lenders</p></CardContent></Card>

        {/* Total Clients Card (Replaces AI Queries) */}
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Clients</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{clientsCount ?? 0}</div><p className="text-xs text-muted-foreground">Managed clients</p></CardContent></Card>

        {/* Documents Card */}
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Documents</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">154</div><p className="text-xs text-muted-foreground">2.1 GB used</p></CardContent></Card> {/* Placeholder data */}

        {/* Avg. Rate Card */}
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg. Rate</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">4.35%</div><p className="text-xs text-red-500">+0.15%</p></CardContent></Card> {/* Placeholder data */}
      </div>

      {/* Recent Activity & Top Lenders Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
         {/* Recent Activity Card */}
         <Card className="lg:col-span-4">
          <CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>Latest actions and updates</CardDescription></CardHeader>
           <CardContent className="space-y-4">
             {isLoadingActivities ? <p>Loading...</p> : activitiesError ? <p className="text-red-500">Error loading activities.</p> : activities && activities.length > 0 ? activities.map((activity: any) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{activity.lender?.name ? getInitials(activity.lender.name) : 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.description || 'Activity description missing'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.lender?.name ? `Lender: ${activity.lender.name}` : ''}
                    {activity.document?.name ? ` Document: ${activity.document.name}` : ''}
                  </p>
                </div>
                <div className="ml-auto text-xs text-muted-foreground">
                  {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
             )) : <p className="text-gray-500">No recent activity.</p>}
           </CardContent>
            <CardFooter><Button variant="link" size="sm" className="ml-auto">View all activity</Button></CardFooter>
        </Card>

        {/* Top Lenders Card */}
         <Card className="lg:col-span-3">
           <CardHeader className="flex flex-row items-center"><div className="space-y-1.5"><CardTitle>Top Lenders</CardTitle><CardDescription>Most active lenders</CardDescription></div><Button variant="outline" size="icon" className="ml-auto h-8 w-8"><Search className="h-4 w-4" /></Button></CardHeader>
           <CardContent>
             <div className="space-y-6">
               {isLoadingLenders ? (
                 <p>Loading lenders...</p>
               ) : lendersError ? (
                 <p className="text-red-500">Error loading lenders.</p>
               ) : lenders && lenders.length > 0 ? (
                 lenders.map((lender: any) => (
                   <div key={lender.id} className="flex items-center space-x-4">
                     <Avatar className="h-9 w-9">
                       <AvatarFallback>{getInitials(lender.name)}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1 space-y-1">
                       <p className="text-sm font-medium leading-none">{lender.name}</p>
                       <p className="text-sm text-muted-foreground">{lender.specialty || 'General Lending'}</p>
                     </div>
                     <Button variant="outline" size="sm" asChild>
                       <Link to={`/app/lenders/${lender.id}`}>View</Link>
                     </Button>
                   </div>
                 ))
               ) : (
                 <p className="text-gray-500">No lenders found.</p>
               )}
             </div>
           </CardContent>
           <CardFooter><Button variant="outline" className="w-full" asChild><Link to="/app/lenders" className="w-full flex items-center justify-center">View all lenders<Building className="ml-2 h-4 w-4" /></Link></Button></CardFooter>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Add New Client Card */}
        <Card className="hover:bg-gray-50 transition-colors cursor-pointer"><Link to="/app/clients" className="block p-6"><div className="flex flex-col items-center text-center space-y-2"><div className="p-2 bg-purple-100 rounded-full"><UserPlus className="h-6 w-6 text-purple-600" /></div><h3 className="font-medium">Add New Client</h3><p className="text-sm text-gray-500">Create a client record</p></div></Link></Card>
         {/* Manage Lenders Card */}
         <Card className="hover:bg-gray-50 transition-colors cursor-pointer"><Link to="/app/lenders" className="block p-6"><div className="flex flex-col items-center text-center space-y-2"><div className="p-2 bg-blue-100 rounded-full"><Building className="h-6 w-6 text-blue-600" /></div><h3 className="font-medium">Manage Lenders</h3><p className="text-sm text-gray-500">View/update lenders</p></div></Link></Card>
        {/* AI Assistant Card */}
        <Card className="hover:bg-gray-50 transition-colors cursor-pointer"><Link to="/app/assistant" className="block p-6"><div className="flex flex-col items-center text-center space-y-2"><div className="p-2 bg-brand-100 rounded-full"><MessageSquare className="h-6 w-6 text-brand-600" /></div><h3 className="font-medium">AI Assistant</h3><p className="text-sm text-gray-500">Ask questions</p></div></Link></Card>
        {/* Account Settings Card */}
        <Card className="hover:bg-gray-50 transition-colors cursor-pointer"><Link to="/app/account" className="block p-6"><div className="flex flex-col items-center text-center space-y-2"><div className="p-2 bg-emerald-100 rounded-full"><Users className="h-6 w-6 text-emerald-600" /></div><h3 className="font-medium">Account Settings</h3><p className="text-sm text-gray-500">Manage profile</p></div></Link></Card>
      </div>
    </div>
  );
};

export default Dashboard;
