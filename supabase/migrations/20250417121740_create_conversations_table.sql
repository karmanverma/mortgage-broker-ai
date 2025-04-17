-- Create conversations table
CREATE TABLE conversations (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts if they exist
DROP POLICY IF EXISTS "Allow users to view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Allow users to insert their own messages" ON conversations;
DROP POLICY IF EXISTS "Allow users to insert their own user and AI messages" ON conversations; -- Drop new policy if it exists from previous attempt

-- Create RLS policies
-- Allow users to view their own conversations
CREATE POLICY "Allow users to view their own conversations" ON conversations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert messages associated with their user_id (both 'user' and 'ai' sender types)
-- This assumes the frontend is trusted to correctly set the sender type.
-- For higher security, AI messages should ideally be inserted via a trusted backend (e.g., Supabase Edge Function) using the service_role key.
CREATE POLICY "Allow users to insert their own user and AI messages" ON conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND sender IN ('user', 'ai'));

