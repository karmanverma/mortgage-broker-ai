import React from "react";
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
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

const fetchLenders = async () => {
  const { data, error } = await supabase
    .from('lenders')
    .select('*')
    .limit(4);
  
  if (error) {
    throw error;
  }
  return data;
};

const fetchActivities = async () => {
  const { data, error } = await supabase
    .from('activities')
    .select('*, lender:lenders(name), document:documents(name)')
    .limit(4)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw error;
  }
  return data;
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

  React.useEffect(() => {
    if (lendersError) {
      toast({
        variant: "destructive",
        title: "Error fetching lenders",
        description: lendersError.message,
      });
    }
    if (activitiesError) {
      toast({
        variant: "destructive",
        title: "Error fetching activities",
        description: activitiesError.message,
      });
    }
  }, [lendersError, activitiesError]);

  if (isLoadingLenders || isLoadingActivities) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Lender
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lenders</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lenders?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active lenders in your network
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-muted-foreground">
                78/500 monthly quota
              </p>
              <span className="text-xs text-green-500">15.6%</span>
            </div>
            <Progress value={15.6} className="h-1 mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">154</div>
            <p className="text-xs text-muted-foreground">
              2.1 GB of 20 GB used
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.35%</div>
            <p className="text-xs text-red-500">
              +0.15% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities?.map((activity: any) => (
              <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center">
                  {activity.action_type === 'document' && <FileText className="h-4 w-4 text-blue-500" />}
                  {activity.action_type === 'chat' && <MessageSquare className="h-4 w-4 text-brand-500" />}
                  {activity.action_type === 'lender' && <Building className="h-4 w-4 text-emerald-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none mb-1">{activity.description}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {activity.lender?.name && <span>{activity.lender.name} · </span>}
                    {activity.document?.name && <span>{activity.document.name} · </span>}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button variant="link" size="sm" className="ml-auto">
              View all activity
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center">
            <div className="space-y-1.5">
              <CardTitle>Top Lenders</CardTitle>
              <CardDescription>Your most active mortgage providers</CardDescription>
            </div>
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {lenders?.map((lender: any) => (
                <div key={lender.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={`https://avatar.vercel.sh/${lender.name.replace(/\s+/g, '-').toLowerCase()}`} />
                      <AvatarFallback>{lender.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{lender.name}</p>
                      <p className="text-xs text-gray-500">{lender.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                      {lender.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>View documents</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit lender</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <Link to="/app/lenders" className="w-full flex items-center justify-center">
                View all lenders
                <Building className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
          <Link to="/app/lenders" className="block p-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium">Manage Lenders</h3>
              <p className="text-sm text-gray-500">View and update your lender database</p>
            </div>
          </Link>
        </Card>
        
        <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
          <Link to="/app/assistant" className="block p-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-brand-100 rounded-full">
                <MessageSquare className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="font-medium">AI Assistant</h3>
              <p className="text-sm text-gray-500">Get answers about rates and products</p>
            </div>
          </Link>
        </Card>
        
        <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
          <Link to="/app/lenders" className="block p-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-amber-100 rounded-full">
                <BarChart4 className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-medium">Rate Comparison</h3>
              <p className="text-sm text-gray-500">Compare rates across lenders</p>
            </div>
          </Link>
        </Card>
        
        <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
          <Link to="/app/account" className="block p-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="font-medium">Account Settings</h3>
              <p className="text-sm text-gray-500">Manage your profile and preferences</p>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
