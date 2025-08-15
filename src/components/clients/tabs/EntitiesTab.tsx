import React from 'react';
import { Building2, Plus, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EntitiesTabProps {
  clientId: string;
}

export const EntitiesTab: React.FC<EntitiesTabProps> = ({ clientId }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Business Entities</h3>
          <p className="text-sm text-muted-foreground">
            Manage business structure and ownership details for this commercial client
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Add Entity
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="text-center py-12">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-medium mb-2">Business Entity Management Coming Soon</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            This feature will allow you to track business entities, ownership structures, corporate documents, and organizational charts for commercial clients.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-6 w-6" />
              Entity Structure
            </div>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-6 w-6" />
              Ownership Details
            </div>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-6 w-6" />
              Corporate Docs
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};