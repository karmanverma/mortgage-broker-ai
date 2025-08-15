import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, MapPin, Phone, Mail, Star } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useImprovedRealtors } from '@/hooks/useImprovedRealtors';
import { Realtor } from '@/hooks/useImprovedRealtors';
import RealtorsList from '@/components/realtors/RealtorsList';

const RealtorsPage = () => {
  const navigate = useNavigate();
  const { realtors, isLoading, deleteRealtor, isDeleting } = useImprovedRealtors();
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Filter realtors based on search, state, and status
  const filteredRealtors = realtors.filter(realtor => {
    const matchesSearch = searchTerm === '' || 
      realtor.people?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      realtor.people?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      realtor.brokerage_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      realtor.license_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = stateFilter === 'all' || realtor.license_state === stateFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && realtor.active_status) ||
      (statusFilter === 'inactive' && !realtor.active_status);
    
    return matchesSearch && matchesState && matchesStatus;
  });

  // Get unique states for filter
  const uniqueStates = [...new Set(realtors.map(r => r.license_state).filter(Boolean))].sort();

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
            className={`h-3 w-3 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">({rating}/10)</span>
      </div>
    );
  };

  const handleRealtorClick = (realtor: Realtor) => {
    navigate(`/app/realtors/${realtor.id}`);
  };

  const handleEditRealtor = (realtor: Realtor) => {
    // Open edit dialog when implemented
    console.log('Edit realtor:', realtor.id);
  };

  const handleDeleteRealtor = (realtor: Realtor) => {
    if (confirm(`Are you sure you want to delete ${realtor.people?.first_name} ${realtor.people?.last_name}?`)) {
      deleteRealtor(realtor.id);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading realtors...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search realtors..."
        filters={[
          {
            value: stateFilter,
            onValueChange: setStateFilter,
            options: [
              { value: 'all', label: 'All States' },
              ...uniqueStates.map(state => ({ value: state, label: state }))
            ],
            placeholder: 'Filter by state'
          },
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ],
            placeholder: 'Filter by status'
          }
        ]}
        viewMode={view}
        onViewModeChange={setView}
        viewOptions={['grid', 'list']}
        onAddClick={() => {}}
        addButtonText="Add Realtor"
        addButtonIcon={<Plus className="h-4 w-4" />}
      />

      {/* Realtors Content */}
      {view === 'list' ? (
        <RealtorsList
          realtors={filteredRealtors}
          isLoading={isLoading}
          onRealtorClick={handleRealtorClick}
          onEditRealtor={handleEditRealtor}
          onDeleteRealtor={handleDeleteRealtor}
          isDeleting={isDeleting}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRealtors.map((realtor) => (
          <Card key={realtor.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" alt={`${realtor.people?.first_name} ${realtor.people?.last_name}`} />
                    <AvatarFallback>
                      {getInitials(realtor.people?.first_name, realtor.people?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {realtor.people?.first_name} {realtor.people?.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {realtor.brokerage_name || 'Independent'}
                    </p>
                  </div>
                </div>
                <Badge variant={realtor.active_status ? 'default' : 'secondary'}>
                  {realtor.active_status ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {realtor.people?.email_primary && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{realtor.people.email_primary}</span>
                  </div>
                )}
                {realtor.people?.phone_primary && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{realtor.people.phone_primary}</span>
                  </div>
                )}
                {realtor.license_state && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>Licensed in {realtor.license_state}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">{realtor.total_referrals_sent || 0}</p>
                  <p className="text-xs text-muted-foreground">Referrals Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{realtor.total_deals_closed || 0}</p>
                  <p className="text-xs text-muted-foreground">Deals Closed</p>
                </div>
              </div>

              {/* Performance Rating */}
              {realtor.performance_rating && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Performance Rating</p>
                  {renderStars(realtor.performance_rating)}
                </div>
              )}

              {/* Relationship Level */}
              {realtor.relationship_level && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Relationship Level</span>
                    <span className="text-sm text-muted-foreground">{realtor.relationship_level}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(realtor.relationship_level / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Specialty Areas */}
              {realtor.specialty_areas && realtor.specialty_areas.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-1">
                    {realtor.specialty_areas.slice(0, 3).map((specialty, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {realtor.specialty_areas.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{realtor.specialty_areas.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Experience */}
              {realtor.years_experience && (
                <div className="text-sm text-muted-foreground">
                  {realtor.years_experience} years experience
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {filteredRealtors.length === 0 && view === 'grid' && (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No realtors found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || stateFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first realtor'
              }
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Realtor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealtorsPage;