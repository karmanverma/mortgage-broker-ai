import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useImprovedRealtors, Realtor } from '@/hooks/useImprovedRealtors';
import TodosWidget from '@/components/todos/TodosWidget';

interface RealtorProfileTabProps {
  realtor: Realtor;
}

export const RealtorProfileTab: React.FC<RealtorProfileTabProps> = ({ realtor }) => {
  const { updateRealtor, isUpdating } = useImprovedRealtors();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    license_number: realtor.license_number || '',
    license_state: realtor.license_state || '',
    brokerage_name: realtor.brokerage_name || '',
    years_experience: realtor.years_experience || 0,
    specialty_areas: realtor.specialty_areas || [],
    geographic_focus: realtor.geographic_focus || '',
    price_range_focus: realtor.price_range_focus || '',
    communication_style: realtor.communication_style || '',
    technology_adoption_level: realtor.technology_adoption_level || '',
    active_status: realtor.active_status ?? true,
    notes: realtor.notes || '',
  });

  const handleSave = () => {
    updateRealtor({ realtorId: realtor.id, updates: formData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      license_number: realtor.license_number || '',
      license_state: realtor.license_state || '',
      brokerage_name: realtor.brokerage_name || '',
      years_experience: realtor.years_experience || 0,
      specialty_areas: realtor.specialty_areas || [],
      geographic_focus: realtor.geographic_focus || '',
      price_range_focus: realtor.price_range_focus || '',
      communication_style: realtor.communication_style || '',
      technology_adoption_level: realtor.technology_adoption_level || '',
      active_status: realtor.active_status ?? true,
      notes: realtor.notes || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isUpdating}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>License Number</Label>
                  {isEditing ? (
                    <Input
                      value={formData.license_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{realtor.license_number || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <Label>License State</Label>
                  {isEditing ? (
                    <Input
                      value={formData.license_state}
                      onChange={(e) => setFormData(prev => ({ ...prev, license_state: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{realtor.license_state || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <Label>Brokerage</Label>
                  {isEditing ? (
                    <Input
                      value={formData.brokerage_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, brokerage_name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{realtor.brokerage_name || 'Independent'}</p>
                  )}
                </div>
                
                <div>
                  <Label>Years Experience</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{realtor.years_experience || 'Not provided'}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Geographic Focus</Label>
                  {isEditing ? (
                    <Input
                      value={formData.geographic_focus}
                      onChange={(e) => setFormData(prev => ({ ...prev, geographic_focus: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{realtor.geographic_focus || 'Not specified'}</p>
                  )}
                </div>
                
                <div>
                  <Label>Active Status</Label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={formData.active_status}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active_status: checked }))}
                      />
                      <span className="text-sm">{formData.active_status ? 'Active' : 'Inactive'}</span>
                    </div>
                  ) : (
                    <Badge variant={realtor.active_status ? 'default' : 'secondary'}>
                      {realtor.active_status ? 'Active' : 'Inactive'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label>Specialty Areas</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {realtor.specialty_areas?.map((specialty, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {specialty}
                  </Badge>
                )) || <span className="text-sm text-muted-foreground">None specified</span>}
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{realtor.notes || 'No notes'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-1">
        <TodosWidget 
          entityType="realtor" 
          entityId={realtor.id} 
          showHeader={true}
          maxItems={6}
        />
      </div>
    </div>
  );
};