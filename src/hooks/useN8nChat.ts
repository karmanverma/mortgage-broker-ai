import { useState, useCallback, useRef } from 'react';
import { n8nChatHandler, N8nChatRequest } from '@/api/n8n-chat-handler';
import { ChatContext } from '@/api/chat-handler'; // Import from chat-handler instead
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface UseN8nChatOptions {
  sessionId?: string;
  context?: ChatContext;
  onSuccess?: (response: string) => void;
  onError?: (error: Error) => void;
  autoSave?: boolean;
}

export interface UseN8nChatReturn {
  sendMessage: (message: string, history?: Array<{ sender: 'user' | 'ai'; message: string }>) => Promise<string | null>;
  isLoading: boolean;
  error: Error | null;
  lastResponse: string | null;
  testConnection: () => Promise<boolean>;
}

export function useN8nChat(options: UseN8nChatOptions = {}): UseN8nChatReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  
  // Use ref to avoid stale closure issues
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sendMessage = useCallback(async (
    message: string,
    history: Array<{ sender: 'user' | 'ai'; message: string }> = []
  ): Promise<string | null> => {
    if (!user) {
      const authError = new Error('User not authenticated');
      setError(authError);
      optionsRef.current.onError?.(authError);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Please log in to continue"
      });
      return null;
    }

    if (!message.trim()) {
      const messageError = new Error('Message cannot be empty');
      setError(messageError);
      optionsRef.current.onError?.(messageError);
      return null;
    }

    if (!optionsRef.current.sessionId) {
      const sessionError = new Error('Session ID is required');
      setError(sessionError);
      optionsRef.current.onError?.(sessionError);
      toast({
        variant: "destructive",
        title: "Session Error",
        description: "No active session found"
      });
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 useN8nChat: Sending message:', {
        message: message.substring(0, 100) + '...',
        sessionId: optionsRef.current.sessionId,
        userId: user.id,
        historyLength: history.length,
        context: optionsRef.current.context
      });

      const request: N8nChatRequest = {
        userId: user.id,
        userEmail: user.email || '',
        sessionId: optionsRef.current.sessionId,
        message: message.trim(),
        history,
        context: optionsRef.current.context || {}
      };

      const response = await n8nChatHandler.sendMessageWithStorage(
        request,
        optionsRef.current.autoSave !== false
      );

      setLastResponse(response);
      optionsRef.current.onSuccess?.(response);

      console.log('✅ useN8nChat: Message sent successfully');
      
      return response;

    } catch (err) {
      const chatError = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('❌ useN8nChat: Error sending message:', chatError);
      
      setError(chatError);
      optionsRef.current.onError?.(chatError);
      
      // Show user-friendly error message
      toast({
        variant: "destructive",
        title: "AI Communication Error",
        description: chatError.message || "Could not reach AI assistant"
      });

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 Testing n8n webhook connection...');
      const isConnected = await n8nChatHandler.testConnection();
      
      if (isConnected) {
        console.log('✅ n8n webhook connection test passed');
        toast({
          title: "Connection Test",
          description: "Successfully connected to AI assistant"
        });
      } else {
        console.log('❌ n8n webhook connection test failed');
        toast({
          variant: "destructive",
          title: "Connection Test Failed",
          description: "Could not connect to AI assistant"
        });
      }
      
      return isConnected;
    } catch (err) {
      console.error('💥 Connection test error:', err);
      toast({
        variant: "destructive",
        title: "Connection Test Error",
        description: err instanceof Error ? err.message : "Unknown error"
      });
      return false;
    }
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    lastResponse,
    testConnection
  };
}
