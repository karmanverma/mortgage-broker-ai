// Enhanced n8n chat handler with proper error handling and logging
import { supabase } from '@/integrations/supabase/client';

const N8N_WEBHOOK_URL = "https://n8n.srv783065.hstgr.cloud/webhook/0d7564b0-45e8-499f-b3b9-b136386319e5/chat";

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  selectedClientId?: string;
  selectedLenderIds?: string[];
  selectedDocumentIds?: string[];
}

export interface N8nChatRequest {
  userId: string;
  userEmail: string;
  sessionId: string;
  message: string;
  history: Array<{
    sender: 'user' | 'ai';
    message: string;
  }>;
  context: ChatContext;
}

export interface N8nChatResponse {
  output?: string;
  error?: string;
  status?: string;
}

export class N8nChatHandler {
  private webhookUrl: string;
  private timeout: number;

  constructor(webhookUrl: string = N8N_WEBHOOK_URL, timeout: number = 30000) {
    this.webhookUrl = webhookUrl;
    this.timeout = timeout;
  }

  /**
   * Send a chat message to n8n webhook
   */
  async sendMessage(request: N8nChatRequest): Promise<string> {
    console.log('🚀 Sending message to n8n webhook:', {
      url: this.webhookUrl,
      userId: request.userId,
      sessionId: request.sessionId,
      message: request.message.substring(0, 100) + '...',
      historyLength: request.history.length,
      context: request.context
    });

    try {
      // Validate request
      this.validateRequest(request);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📡 n8n webhook response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ n8n webhook error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const responseData: N8nChatResponse = await response.json();
      console.log('✅ n8n webhook success response:', responseData);

      if (responseData.error) {
        throw new Error(`n8n workflow error: ${responseData.error}`);
      }

      if (!responseData.output) {
        console.warn('⚠️ No output in n8n response:', responseData);
        throw new Error('No AI response received from n8n workflow');
      }

      return responseData.output;

    } catch (error) {
      console.error('💥 n8n chat handler error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.timeout}ms`);
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred while communicating with AI assistant');
    }
  }

  /**
   * Send message and save to database
   */
  async sendMessageWithStorage(
    request: N8nChatRequest,
    saveToDatabase: boolean = true
  ): Promise<string> {
    const aiResponse = await this.sendMessage(request);

    if (saveToDatabase && request.sessionId && request.userId) {
      try {
        await this.saveMessagesToDatabase(
          request.userId,
          request.sessionId,
          request.message,
          aiResponse
        );
        console.log('💾 Messages saved to database successfully');
      } catch (dbError) {
        console.error('❌ Database save error:', dbError);
        // Continue even if DB save fails - don't throw error
      }
    }

    return aiResponse;
  }

  /**
   * Save user message and AI response to Supabase
   */
  private async saveMessagesToDatabase(
    userId: string,
    sessionId: string,
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    // Save user message
    const { error: userError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        session_id: sessionId,
        sender: 'user',
        message: userMessage,
      });

    if (userError) {
      console.error('Error saving user message:', userError);
      throw userError;
    }

    // Save AI response
    const { error: aiError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        session_id: sessionId,
        sender: 'ai',
        message: aiResponse,
      });

    if (aiError) {
      console.error('Error saving AI message:', aiError);
      throw aiError;
    }
  }

  /**
   * Validate the chat request
   */
  private validateRequest(request: N8nChatRequest): void {
    if (!request.userId) {
      throw new Error('User ID is required');
    }
    if (!request.userEmail) {
      throw new Error('User email is required');
    }
    if (!request.sessionId) {
      throw new Error('Session ID is required');
    }
    if (!request.message || !request.message.trim()) {
      throw new Error('Message cannot be empty');
    }
    if (!Array.isArray(request.history)) {
      throw new Error('History must be an array');
    }
  }

  /**
   * Test the webhook connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testRequest: N8nChatRequest = {
        userId: 'test-user',
        userEmail: 'test@example.com',
        sessionId: 'test-session',
        message: 'Test connection',
        history: [],
        context: {}
      };

      await this.sendMessage(testRequest);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const n8nChatHandler = new N8nChatHandler();
