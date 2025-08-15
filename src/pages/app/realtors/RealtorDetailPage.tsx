import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, TrendingUp, Users, Activity, FileText, Folder, Star, MapPin } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useImprovedRealtors } from '@/hooks/useImprovedRealtors';
import { useToast } from '@/components/ui/use-toast';
import { RealtorProfileTab } from '@/components/realtors/tabs/RealtorProfileTab';
import { RealtorNotesTab } from '@/components/realtors/tabs/RealtorNotesTab';
import { RealtorActivitiesTab } from '@/components/realtors/tabs/RealtorActivitiesTab';

const RealtorDetailPage = () => {
  const { realtorId } = useParams<{ realtorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { realtors, isLoading, deleteRealtor, isDeleting } = useImprovedRealtors();
  const [activeTab, setActiveTab] = useState('profile');

  const realtor = realtors.find(r => r.id === realtorId);

  useEffect(() => {
    if (!isLoading && !realtor) {
      toast({
        title: 'Realtor not found',
        description: 'The requested realtor could not be found.',
        variant: 'destructive',
      });
      navigate('/app/realtors');
    }
  }, [realtor, isLoading, navigate, toast]);

  const handleDelete = () => {
    if (!realtor) return;
    const name = `${realtor.people?.first_name} ${realtor.people?.last_name}`;
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteRealtor(realtor.id);
      navigate('/app/realtors');
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const renderStars = (rating?: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating}/10)</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!realtor) {
    return null;
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'people', label: 'People', icon: Users },
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'documents', label: 'Documents', icon: Folder }
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link to="/app/realtors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Realtors
        </Link>
      </Button>

      {/* Realtor Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={`${realtor.people?.first_name} ${realtor.people?.last_name}`} />
                <AvatarFallback className="text-lg">
                  {getInitials(realtor.people?.first_name, realtor.people?.last_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {realtor.people?.first_name} {realtor.people?.last_name}
                </CardTitle>
                <p className="text-muted-foreground">{realtor.brokerage_name || 'Independent'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={realtor.active_status ? 'default' : 'secondary'}>
                    {realtor.active_status ? 'Active' : 'Inactive'}
                  </Badge>
                  {realtor.license_state && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {realtor.license_state}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full mb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-shrink-0 flex items-center whitespace-nowrap px-3">
              <tab.icon className="mr-1 h-4 w-4 flex-shrink-0" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile">
          <RealtorProfileTab realtor={realtor} />
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{realtor.total_referrals_sent || 0}</div>
                  <div className="text-sm text-muted-foreground">Referrals Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{realtor.total_deals_closed || 0}</div>
                  <div className="text-sm text-muted-foreground">Deals Closed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{realtor.relationship_level || 0}/10</div>
                  <div className="text-sm text-muted-foreground">Relationship Level</div>
                </div>
              </div>
              
              {realtor.performance_rating && (
                <div>
                  <label className="text-sm font-medium">Performance Rating</label>
                  <div className="mt-2">
                    {renderStars(realtor.performance_rating)}
                  </div>
                </div>
              )}

              {realtor.relationship_level && (
                <div>
                  <label className="text-sm font-medium">Relationship Strength</label>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full" 
                        style={{ width: `${(realtor.relationship_level / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="people">
          <Card>
            <CardHeader>
              <CardTitle>Associated People</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">People management functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <RealtorActivitiesTab realtorId={realtor.id} />
        </TabsContent>

        <TabsContent value="notes">
          <RealtorNotesTab realtorId={realtor.id} />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Document management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealtorDetailPage;