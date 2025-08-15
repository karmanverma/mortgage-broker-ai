import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useImprovedLenders, Lender } from '@/hooks/useImprovedLenders';
import TodosWidget from '@/components/todos/TodosWidget';

interface LenderInstitutionTabProps {
  lender: Lender;
}

export const LenderInstitutionTab: React.FC<LenderInstitutionTabProps> = ({ lender }) => {
  const { updateLender, isUpdating } = useImprovedLenders();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: lender.name || '',
    type: lender.type || '',
    status: lender.status || '',
    notes: lender.notes || '',
  });

  const handleSave = () => {
    updateLender({ lenderId: lender.id, updates: formData });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: lender.name || '',
      type: lender.type || '',
      status: lender.status || '',
      notes: lender.notes || '',
    });
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'pending': return 'outline';
      default: return 'default';
    }
  };

  const primaryPerson = lender.people?.find(p => p.is_primary);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Institution Details</CardTitle>
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
                  <Label>Institution Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{lender.name}</p>
                  )}
                </div>
                
                <div>
                  <Label>Type</Label>
                  {isEditing ? (
                    <Input
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">{lender.type || 'Not specified'}</p>
                  )}
                </div>
                
                <div>
                  <Label>Status</Label>
                  {isEditing ? (
                    <Input
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    />
                  ) : (
                    <Badge variant={getStatusColor(lender.status) as any}>
                      {lender.status || 'Active'}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Primary Contact</Label>
                  {primaryPerson ? (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {primaryPerson.first_name} {primaryPerson.last_name}
                      </p>
                      {primaryPerson.title_position && (
                        <p className="text-xs text-muted-foreground">{primaryPerson.title_position}</p>
                      )}
                      {primaryPerson.email_primary && (
                        <p className="text-xs text-muted-foreground">{primaryPerson.email_primary}</p>
                      )}
                      {primaryPerson.phone_primary && (
                        <p className="text-xs text-muted-foreground">{primaryPerson.phone_primary}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No primary contact assigned</p>
                  )}
                </div>
                
                <div>
                  <Label>Documents</Label>
                  <p className="text-sm text-muted-foreground">{lender.document_count || 0} documents</p>
                </div>
                
                <div>
                  <Label>Associated People</Label>
                  <p className="text-sm text-muted-foreground">{lender.people?.length || 0} people</p>
                </div>
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
                <p className="text-sm text-muted-foreground">{lender.notes || 'No notes'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-1">
        <TodosWidget 
          entityType="lender" 
          entityId={lender.id} 
          showHeader={true}
          maxItems={6}
        />
      </div>
    </div>
  );
};