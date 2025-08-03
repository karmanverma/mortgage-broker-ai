import React from 'react';
import { N8nChatTest } from '@/components/debug/N8nChatTest';

const N8nDebugPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">n8n Integration Debug</h1>
          <p className="text-muted-foreground mt-2">
            Test and debug the n8n webhook integration
          </p>
        </div>
        
        <N8nChatTest />
        
        <div className="text-center text-sm text-muted-foreground">
          <p>This page is for debugging purposes only.</p>
          <p>Check the browser console for detailed logs.</p>
        </div>
      </div>
    </div>
  );
};

export default N8nDebugPage;
