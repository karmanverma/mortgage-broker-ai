import { useState, useCallback, useEffect } from 'react';
import { handleChatRequest, ChatMessage, ChatContext } from '@/api/chat-handler';
import { useAuth } from '@/contexts/AuthContext';

export interface UseCustomChatOptions {
  sessionId?: string;
  context?: ChatContext;
  onFinish?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
  initialMessages?: ChatMessage[];
}

export interface UseCustomChatReturn {
  messages: ChatMessage[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  append: (message: ChatMessage) => Promise<void>;
  setInput: (input: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  isLoading: boolean;
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export function useCustomChat(options: UseCustomChatOptions = {}): UseCustomChatReturn {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(options.initialMessages || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Update messages when initialMessages change
  useEffect(() => {
    if (options.initialMessages && options.initialMessages.length > 0) {
      setMessages(options.initialMessages);
    }
  }, [options.initialMessages]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const append = useCallback(async (message: ChatMessage) => {
    console.log('🟢 useCustomChat: append called with message:', message.content.substring(0, 50) + '...');
    console.log('🟢 useCustomChat: user:', !!user, 'sessionId:', options.sessionId);
    
    if (!user) {
      const authError = new Error('User not authenticated');
      console.log('❌ useCustomChat: User not authenticated');
      setError(authError);
      setStatus('error');
      if (options.onError) options.onError(authError);
      return;
    }

    setIsLoading(true);
    setStatus('loading');
    setError(null);

    try {
      // Add user message to the conversation
      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);

      console.log('🟢 useCustomChat: Calling handleChatRequest with:', {
        messagesCount: updatedMessages.length,
        userId: user.id,
        userEmail: user.email,
        sessionId: options.sessionId,
        hasContext: !!options.context
      });

      // Call the chat handler
      const aiResponse = await handleChatRequest({
        messages: updatedMessages,
        userId: user.id,
        userEmail: user.email,
        sessionId: options.sessionId,
        context: options.context
      });

      console.log('✅ useCustomChat: Received AI response:', !!aiResponse);

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse
      };

      // Add AI response to messages
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      setStatus('success');

      if (options.onFinish) {
        options.onFinish(aiMessage);
      }

    } catch (err) {
      const chatError = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('❌ useCustomChat: Error in append:', chatError);
      setError(chatError);
      setStatus('error');
      if (options.onError) {
        options.onError(chatError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages, user, options]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    console.log('🔵 useCustomChat: handleSubmit called with input:', input.substring(0, 50) + '...');
    
    if (e) {
      e.preventDefault();
    }

    if (!input.trim()) {
      console.log('🔵 useCustomChat: Empty input, returning');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    console.log('🔵 useCustomChat: Created user message, calling append...');
    setInput(''); // Clear input immediately
    await append(userMessage);
  }, [input, append]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    append,
    setInput,
    setMessages,
    isLoading,
    error,
    status
  };
}
