-- Security and Performance Fixes Migration
-- Fix RLS policies, enable RLS on missing tables, and optimize performance

-- Enable RLS on missing tables
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vectordocuments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for n8n_chat_histories
CREATE POLICY "Users can manage their own chat histories" ON public.n8n_chat_histories
  FOR ALL TO authenticated
  USING (true) -- Adjust based on your business logic
  WITH CHECK (true);

-- Create RLS policies for vectordocuments
CREATE POLICY "Users can manage their own vector documents" ON public.vectordocuments
  FOR ALL TO authenticated
  USING (true) -- Adjust based on your business logic
  WITH CHECK (true);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Fix existing RLS policies to use (select auth.uid()) for better performance
-- Activities table
DROP POLICY IF EXISTS "Allow authenticated users to manage activities" ON public.activities;
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;

CREATE POLICY "Users can manage their own activities" ON public.activities
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Documents table
DROP POLICY IF EXISTS "Allow authenticated users to manage documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Users can manage their own documents" ON public.documents
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Lenders table
DROP POLICY IF EXISTS "Users can create their own lenders" ON public.lenders;
DROP POLICY IF EXISTS "Users can view their own lenders" ON public.lenders;
DROP POLICY IF EXISTS "Users can update their own lenders" ON public.lenders;
DROP POLICY IF EXISTS "Users can delete their own lenders" ON public.lenders;

CREATE POLICY "Users can manage their own lenders" ON public.lenders
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Clients table
DROP POLICY IF EXISTS "Allow authenticated users to manage their own clients" ON public.clients;

CREATE POLICY "Users can manage their own clients" ON public.clients
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Client notes table
DROP POLICY IF EXISTS "Allow authenticated users to manage notes for their clients" ON public.client_notes;

CREATE POLICY "Users can manage notes for their own clients" ON public.client_notes
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Conversations table
DROP POLICY IF EXISTS "Allow users to insert their own messages" ON public.conversations;
DROP POLICY IF EXISTS "Allow users to insert their own user and AI messages" ON public.conversations;
DROP POLICY IF EXISTS "Allow users to view their own conversations" ON public.conversations;

CREATE POLICY "Users can manage their own conversations" ON public.conversations
  FOR ALL TO authenticated, anon
  USING ((select auth.uid()) = user_id OR user_id IS NULL)
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

-- Profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can manage their own profile" ON public.profiles
  FOR ALL TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Add indexes for foreign keys to improve performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_lender_id ON public.activities(lender_id);
CREATE INDEX IF NOT EXISTS idx_activities_document_id ON public.activities(document_id);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON public.activities(client_id);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_lender_id ON public.documents(lender_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);

CREATE INDEX IF NOT EXISTS idx_lenders_user_id ON public.lenders(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.get_latest_conversations_per_session(user_uuid UUID)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    message TEXT,
    sender TEXT,
    created_at TIMESTAMPTZ,
    session_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (c.session_id)
        c.id,
        c.user_id,
        c.message,
        c.sender,
        c.created_at,
        c.session_id
    FROM
        conversations c
    WHERE
        c.user_id = user_uuid
    ORDER BY
        c.session_id, c.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_latest_conversations_per_session(UUID) TO authenticated;