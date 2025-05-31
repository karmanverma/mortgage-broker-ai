import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches the first user message for a given session_id
 * Returns the message string or null if not found
 */
export async function fetchFirstUserMessage(sessionId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('message, sender')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .eq('sender', 'user')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Error fetching first user message:', error);
    return null;
  }
  if (data && data.length > 0 && data[0].message) {
    return data[0].message;
  }
  return null;
}
