// API route that integrates with n8n webhook for AI chat functionality
import { supabase } from '@/integrations/supabase/client';

const N8N_WEBHOOK_URL = "https://n8n.srv783065.hstgr.cloud/webhook/0d7564b0-45e8-499f-b3b9-b136386319e5/chat";

export async function POST(req: Request) {
  try {
    const { messages, userId, userEmail, sessionId, context } = await req.json();
    
    if (!messages || messages.length === 0) {
      throw new Error('No messages provided');
    }

    // Get the last message from the user
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;

    // Prepare history for n8n webhook (last 10 messages)
    const historyForWebhook = messages.slice(-10).map((msg: any) => ({
      sender: msg.role === 'user' ? 'user' : 'ai',
      message: msg.content
    }));

    // Call n8n webhook
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        userEmail: userEmail,
        sessionId: sessionId,
        message: userMessage,
        history: historyForWebhook,
        context: context || {}
      }),
    });

    if (!webhookResponse.ok) {
      const errorBody = await webhookResponse.text();
      throw new Error(`Webhook request failed: ${webhookResponse.status}. ${errorBody}`);
    }

    const responseData = await webhookResponse.json();
    const aiMessageContent = responseData?.output;

    if (!aiMessageContent) {
      console.warn("AI response format unexpected:", responseData);
      throw new Error("Received unexpected response format from AI.");
    }

    // Save messages to Supabase if sessionId is provided
    if (sessionId && userId) {
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
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue even if DB save fails
      }
    }

    // Return streaming response format expected by useChat hook
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the AI response as a streaming chunk
        const chunk = `data: ${JSON.stringify({
          id: Date.now().toString(),
          object: 'chat.completion.chunk',
          choices: [{
            delta: {
              content: aiMessageContent
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
    console.error('Chat API error:', error);
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