// Standalone chat handler that doesn't import from n8n-chat-handler
// This completely avoids any import issues

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

export interface ChatRequest {
  messages: ChatMessage[];
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  context?: ChatContext;
}

export async function handleChatRequest(request: ChatRequest): Promise<string> {
  console.log('🚀 Standalone chat handler - sending to n8n webhook');
  
  const { messages, userId, userEmail, sessionId, context } = request;
  
  if (!messages || messages.length === 0) {
    throw new Error('No messages provided');
  }

  if (!userId || !userEmail || !sessionId) {
    throw new Error('Missing required parameters: userId, userEmail, or sessionId');
  }

  // Get the last message from the user
  const lastMessage = messages[messages.length - 1];
  const userMessage = lastMessage.content;

  // Prepare history for n8n webhook (last 10 messages)
  const historyForWebhook = messages.slice(-10).map((msg) => ({
    sender: msg.role === 'user' ? 'user' as const : 'ai' as const,
    message: msg.content
  }));

  try {
    console.log('🚀 Sending to n8n webhook:', {
      url: N8N_WEBHOOK_URL,
      userId,
      sessionId,
      message: userMessage.substring(0, 100) + '...',
      historyLength: historyForWebhook.length,
      context
    });

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        userId,
        userEmail,
        sessionId,
        message: userMessage,
        history: historyForWebhook,
        context: context || {}
      }),
    });

    console.log('📡 n8n webhook response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('❌ n8n webhook error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorBody
      });
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}. ${errorBody}`);
    }

    const responseData = await response.json();
    console.log('✅ n8n webhook success response:', responseData);

    const aiMessageContent = responseData?.output;
    if (!aiMessageContent) {
      console.warn('⚠️ AI response format unexpected:', responseData);
      throw new Error('Received unexpected response format from AI.');
    }

    // Save messages to Supabase
    try {
      // Save user message
      await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          session_id: sessionId,
          sender: 'user',
          message: userMessage,
        });

      // Save AI response
      await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          session_id: sessionId,
          sender: 'ai',
          message: aiMessageContent,
        });

      console.log('💾 Messages saved to database');
    } catch (dbError) {
      console.error('❌ Database save error:', dbError);
      // Continue even if DB save fails
    }

    return aiMessageContent;

  } catch (error) {
    console.error('💥 Chat handler error:', error);
    throw error;
  }
}
