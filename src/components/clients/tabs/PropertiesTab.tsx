import React from 'react';
import { Home, Building2, Plus, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PropertiesTabProps {
  clientId: string;
  clientType: string;
}

export const PropertiesTab: React.FC<PropertiesTabProps> = ({ clientId, clientType }) => {
  const getPropertyIcon = () => {
    switch (clientType) {
      case 'residential': return Home;
      case 'commercial': return Building2;
      case 'investor': return Building2;
      default: return Home;
    }
  };

  const getPropertyTypeText = () => {
    switch (clientType) {
      case 'residential': return 'residential properties';
      case 'commercial': return 'commercial properties';
      case 'investor': return 'investment properties';
      default: return 'properties';
    }
  };

  const PropertyIcon = getPropertyIcon();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Property Portfolio</h3>
          <p className="text-sm text-muted-foreground">
            Manage {getPropertyTypeText()} for this {clientType} client
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="text-center py-12">
          <PropertyIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-medium mb-2">Property Management Coming Soon</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            This feature will allow you to track and manage all {getPropertyTypeText()} associated with this client, including valuations, documents, and transaction history.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Property Details
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PropertyIcon className="h-4 w-4" />
              Portfolio Tracking
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};