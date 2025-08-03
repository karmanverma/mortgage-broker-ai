// Custom chat handler that integrates with n8n webhook and Supabase
// This file provides backward compatibility while using the improved n8n handler
import { n8nChatHandler, N8nChatRequest } from './n8n-chat-handler';

// Define interfaces locally to avoid import issues
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

// Legacy function that uses the new improved handler
export async function handleChatRequest(request: ChatRequest): Promise<string> {
  console.log('🔄 Using legacy chat handler - redirecting to improved n8n handler');
  
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

  const n8nRequest: N8nChatRequest = {
    userId,
    userEmail,
    sessionId,
    message: userMessage,
    history: historyForWebhook,
    context: context || {}
  };

  return await n8nChatHandler.sendMessageWithStorage(n8nRequest);
}

// Mock API endpoint for useChat hook compatibility
export async function mockChatAPI(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const aiResponse = await handleChatRequest(body);

    // Create a streaming response that the useChat hook expects
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the AI response as a streaming chunk
        const chunk = `data: ${JSON.stringify({
          id: Date.now().toString(),
          object: 'chat.completion.chunk',
          choices: [{
            delta: {
              content: aiResponse
            },
            finish_reason: 'stop'
          }]
        })}\n\n`;
        
        controller.enqueue(encoder.encode(chunk));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Mock chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
