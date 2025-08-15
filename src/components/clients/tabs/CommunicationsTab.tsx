import React from 'react';
import { MessageSquare, Phone, Mail, Plus, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CommunicationsTabProps {
  clientId: string;
  clientType: string;
}

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ clientId, clientType }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Communications History</h3>
          <p className="text-sm text-muted-foreground">
            Track all communications with this {clientType} client
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Log Communication
        </Button>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="text-center py-12">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-medium mb-2">Communications Tracking Coming Soon</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            This feature will allow you to log and track all communications including emails, phone calls, meetings, and messages with your clients.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-md mx-auto">
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-6 w-6" />
              Emails
            </div>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-6 w-6" />
              Calls
            </div>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-6 w-6" />
              Meetings
            </div>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-6 w-6" />
              Messages
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};