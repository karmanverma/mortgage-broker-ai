-- Add session_id column to conversations table
ALTER TABLE public.conversations
ADD COLUMN session_id UUID NOT NULL DEFAULT gen_random_uuid(); -- Or use another default mechanism if needed

-- Add index for faster querying by session_id
CREATE INDEX idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX idx_conversations_user_session ON public.conversations(user_id, session_id);

-- Update RLS policies to incorporate session_id if necessary
-- For now, existing policies based on user_id should suffice for basic access
-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Allow users to view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Allow users to insert their own user and AI messages" ON conversations;

-- Recreate policies - they still primarily rely on user_id
-- Allow users to view their own conversations (all sessions)
CREATE POLICY "Allow users to view their own conversations" ON conversations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert messages associated with their user_id (all sessions)
CREATE POLICY "Allow users to insert their own user and AI messages" ON conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND sender IN ('user', 'ai'));

-- You might later want policies specific to sessions, e.g.:
-- CREATE POLICY "Allow users to view conversations for a specific session" ON conversations
--     FOR SELECT
--     USING (auth.uid() = user_id AND session_id = current_setting('app.current_session_id')::uuid);
