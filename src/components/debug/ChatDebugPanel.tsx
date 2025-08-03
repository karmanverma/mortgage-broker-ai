import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ChatDebugPanelProps {
  sessionId?: string | null;
  selectedClientId?: string | null;
  selectedLenderIds?: string[];
  lastError?: Error | null;
  isLoading?: boolean;
  className?: string;
}

export const ChatDebugPanel: React.FC<ChatDebugPanelProps> = ({
  sessionId,
  selectedClientId,
  selectedLenderIds = [],
  lastError,
  isLoading = false,
  className
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const testWebhook = async () => {
    if (!user) return;
    
    setTestResult('testing');
    setTestMessage('');

    try {
      const testPayload = {
        userId: user.id,
        userEmail: user.email || '',
        sessionId: sessionId || 'debug-test-session',
        message: 'Debug test message',
        history: [],
        context: {
          selectedClientId: selectedClientId || undefined,
          selectedLenderIds: selectedLenderIds,
          selectedDocumentIds: []
        }
      };

      console.log('🔍 Debug: Testing webhook with payload:', testPayload);

      const response = await fetch('https://n8n.srv783065.hstgr.cloud/webhook/0d7564b0-45e8-499f-b3b9-b136386319e5/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      console.log('🔍 Debug: Webhook response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('🔍 Debug: Webhook response data:', data);

      setTestResult('success');
      setTestMessage(data.output || 'No output received');
    } catch (error) {
      console.error('🔍 Debug: Webhook test failed:', error);
      setTestResult('error');
      setTestMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getAuthStatus = () => {
    if (!user) return { status: 'error', message: 'Not authenticated' };
    if (!user.email) return { status: 'warning', message: 'No email found' };
    return { status: 'success', message: `Authenticated as ${user.email}` };
  };

  const getSessionStatus = () => {
    if (!sessionId) return { status: 'warning', message: 'No active session' };
    return { status: 'success', message: `Session: ${sessionId.substring(0, 8)}...` };
  };

  const getContextStatus = () => {
    const hasClient = !!selectedClientId;
    const hasLenders = selectedLenderIds.length > 0;
    
    if (!hasClient && !hasLenders) {
      return { status: 'warning', message: 'No context selected' };
    }
    
    const parts = [];
    if (hasClient) parts.push('Client');
    if (hasLenders) parts.push(`${selectedLenderIds.length} lender(s)`);
    
    return { status: 'success', message: parts.join(', ') };
  };

  const authStatus = getAuthStatus();
  const sessionStatus = getSessionStatus();
  const contextStatus = getContextStatus();

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                <CardTitle className="text-sm">Chat Debug Panel</CardTitle>
                <Badge variant="outline" className="text-xs">
                  Debug
                </Badge>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
            <CardDescription className="text-xs">
              Debug information for chat integration
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Status Checks */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">System Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  {getStatusIcon(authStatus.status)}
                  <span>Auth: {authStatus.message}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(sessionStatus.status)}
                  <span>Session: {sessionStatus.message}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(contextStatus.status)}
                  <span>Context: {contextStatus.message}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(isLoading ? 'warning' : 'success')}
                  <span>Loading: {isLoading ? 'Yes' : 'No'}</span>
                </div>
                {lastError && (
                  <div className="flex items-center gap-2">
                    {getStatusIcon('error')}
                    <span>Error: {lastError.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Webhook Test */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Webhook Test</h4>
              <div className="flex items-center gap-2">
                <Button
                  onClick={testWebhook}
                  disabled={testResult === 'testing' || !user}
                  size="sm"
                  variant="outline"
                >
                  {testResult === 'testing' ? 'Testing...' : 'Test n8n Webhook'}
                </Button>
                {testResult !== 'idle' && (
                  <div className="flex items-center gap-1">
                    {getStatusIcon(testResult)}
                    <span className="text-xs">
                      {testResult === 'success' ? 'Success' : 'Failed'}
                    </span>
                  </div>
                )}
              </div>
              {testMessage && (
                <div className="text-xs p-2 bg-muted rounded text-muted-foreground">
                  {testMessage}
                </div>
              )}
            </div>

            {/* Configuration */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Configuration</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Webhook URL: https://n8n.srv783065.hstgr.cloud/webhook/...</div>
                <div>User ID: {user?.id || 'Not available'}</div>
                <div>Email: {user?.email || 'Not available'}</div>
                <div>Session ID: {sessionId || 'Not available'}</div>
                <div>Client ID: {selectedClientId || 'Not selected'}</div>
                <div>Lender IDs: {selectedLenderIds.length > 0 ? selectedLenderIds.join(', ') : 'None selected'}</div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
