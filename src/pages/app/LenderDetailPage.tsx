import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Users, Package, Folder, Activity, FileText } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useImprovedLenders } from '@/hooks/useImprovedLenders';
import { useToast } from '@/components/ui/use-toast';
import { LenderInstitutionTab } from '@/components/lenders/tabs/LenderInstitutionTab';
import { LenderNotesTab } from '@/components/lenders/tabs/LenderNotesTab';
import { LenderActivitiesTab } from '@/components/lenders/tabs/LenderActivitiesTab';

const LenderDetailPage = () => {
  const { lenderId } = useParams<{ lenderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lenders, isLoading, deleteLender, isDeleting } = useImprovedLenders();
  const [activeTab, setActiveTab] = useState('institution');

  const lender = lenders.find(l => l.id === lenderId);

  useEffect(() => {
    if (!isLoading && !lender) {
      toast({
        title: 'Lender not found',
        description: 'The requested lender could not be found.',
        variant: 'destructive',
      });
      navigate('/app/lenders');
    }
  }, [lender, isLoading, navigate, toast]);

  const handleDelete = () => {
    if (!lender) return;
    if (confirm(`Are you sure you want to delete ${lender.name}?`)) {
      deleteLender(lender.id);
      navigate('/app/lenders');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'outline';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!lender) {
    return null;
  }

  const primaryPerson = lender.people?.find(p => p.is_primary);

  const tabs = [
    { id: 'institution', label: 'Institution', icon: Building },
    { id: 'people', label: 'People', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'documents', label: 'Documents', icon: Folder },
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'notes', label: 'Notes', icon: FileText }
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Button variant="outline" size="sm" asChild className="mb-4">
        <Link to="/app/lenders">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lenders
        </Link>
      </Button>

      {/* Lender Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt={lender.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(lender.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{lender.name}</CardTitle>
                <p className="text-muted-foreground">{lender.type}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getStatusColor(lender.status) as any}>
                    {lender.status || 'Active'}
                  </Badge>
                  {primaryPerson && (
                    <span className="text-sm text-muted-foreground">
                      Contact: {primaryPerson.first_name} {primaryPerson.last_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                Manage Documents
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

        <TabsContent value="institution">
          <LenderInstitutionTab lender={lender} />
        </TabsContent>

        <TabsContent value="people">
          <Card>
            <CardHeader>
              <CardTitle>Associated People</CardTitle>
            </CardHeader>
            <CardContent>
              {lender.people && lender.people.length > 0 ? (
                <div className="space-y-4">
                  {lender.people.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {person.first_name?.[0]}{person.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{person.first_name} {person.last_name}</p>
                          {person.title_position && (
                            <p className="text-sm text-muted-foreground">{person.title_position}</p>
                          )}
                          <p className="text-sm text-muted-foreground">{person.email_primary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {person.is_primary && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No people associated with this lender.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Loan Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Loan products management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {lender.document_count || 0} documents uploaded
                </p>
                <Button size="sm">Upload Document</Button>
              </div>
              <p className="text-muted-foreground">Document list coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <LenderActivitiesTab lenderId={lender.id} />
        </TabsContent>

        <TabsContent value="notes">
          <LenderNotesTab lenderId={lender.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LenderDetailPage;