import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useN8nChat } from '@/hooks/useN8nChat';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Send, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export const N8nChatTest: React.FC = () => {
  const { user } = useAuth();
  const [testMessage, setTestMessage] = useState('Hello, this is a test message');
  const [testSessionId] = useState(() => uuidv4());
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const { sendMessage, isLoading, error, lastResponse, testConnection } = useN8nChat({
    sessionId: testSessionId,
    context: {
      selectedClientId: 'test-client-id',
      selectedLenderIds: ['test-lender-1', 'test-lender-2'],
      selectedDocumentIds: ['test-doc-1']
    },
    onSuccess: (response) => {
      console.log('✅ Test message sent successfully:', response);
    },
    onError: (error) => {
      console.error('❌ Test message failed:', error);
    }
  });

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    const isConnected = await testConnection();
    setConnectionStatus(isConnected ? 'success' : 'error');
  };

  const handleSendTestMessage = async () => {
    if (!testMessage.trim()) return;
    
    const history = [
      { sender: 'user' as const, message: 'Previous test message' },
      { sender: 'ai' as const, message: 'Previous AI response' }
    ];
    
    await sendMessage(testMessage, history);
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'testing':
        return 'Testing...';
      case 'success':
        return 'Connected';
      case 'error':
        return 'Failed';
      default:
        return 'Test Connection';
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>n8n Chat Test</CardTitle>
          <CardDescription>Please log in to test the n8n chat integration</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          n8n Chat Integration Test
          <Badge variant="outline">Debug</Badge>
        </CardTitle>
        <CardDescription>
          Test the connection and messaging with the n8n webhook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Test */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Connection Test</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              variant="outline"
              size="sm"
            >
              {getConnectionStatusIcon()}
              {getConnectionStatusText()}
            </Button>
            <span className="text-sm text-muted-foreground">
              Webhook URL: https://n8n.srv783065.hstgr.cloud/webhook/...
            </span>
          </div>
        </div>

        {/* Message Test */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Message Test</h3>
          <div className="flex gap-2">
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message..."
              disabled={isLoading}
            />
            <Button
              onClick={handleSendTestMessage}
              disabled={isLoading || !testMessage.trim()}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </div>

        {/* Test Session Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Test Session Info</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>User ID: {user.id}</div>
            <div>Email: {user.email}</div>
            <div>Session ID: {testSessionId}</div>
            <div>Context: Client + 2 Lenders + 1 Document</div>
          </div>
        </div>

        {/* Response Display */}
        {lastResponse && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Last AI Response</h3>
            <div className="p-3 bg-muted rounded-md text-sm">
              {lastResponse}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-red-500">Error</h3>
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error.message}
            </div>
          </div>
        )}

        {/* Debug Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Debug Info</h3>
          <div className="text-xs text-muted-foreground">
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Has Error: {error ? 'Yes' : 'No'}</div>
            <div>Last Response: {lastResponse ? 'Yes' : 'No'}</div>
            <div>Connection Status: {connectionStatus}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
