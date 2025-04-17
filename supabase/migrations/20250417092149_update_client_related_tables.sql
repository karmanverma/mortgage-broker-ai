-- 1. Add columns to clients table for Personal Info & Financial Details
ALTER TABLE public.clients
ADD COLUMN address_line1 text,
ADD COLUMN address_line2 text,
ADD COLUMN city text,
ADD COLUMN state text, -- Or province, region etc.
ADD COLUMN zip_code text,
ADD COLUMN country text,
ADD COLUMN date_of_birth date,
ADD COLUMN employment_status text, -- Consider an ENUM later if needed: employed, unemployed, self-employed etc.
ADD COLUMN employer_name text,
ADD COLUMN job_title text,
ADD COLUMN annual_income numeric(15, 2), -- Example precision, adjust as needed
ADD COLUMN credit_score integer,
ADD COLUMN assets jsonb,  -- Storing complex asset structures
ADD COLUMN liabilities jsonb; -- Storing complex liability structures

-- Add indexes for new searchable/filterable columns
CREATE INDEX idx_clients_city ON public.clients(city);
CREATE INDEX idx_clients_state ON public.clients(state);
CREATE INDEX idx_clients_employment_status ON public.clients(employment_status);

-- Update RLS comments if necessary (existing policy likely still covers new columns)
COMMENT ON POLICY "Allow authenticated users to manage their own clients" ON public.clients
IS 'Allows authenticated users to view, insert, update, and delete their own client records, including newly added details.';


-- 2. Add client_id to documents table
ALTER TABLE public.documents
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL; -- Or CASCADE if docs should be deleted with client

-- Add index for the new foreign key
CREATE INDEX idx_documents_client_id ON public.documents(client_id);

-- Update documents RLS policies
DROP POLICY IF EXISTS "Allow authenticated users read access to their documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users insert access to their documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users update access to their documents" ON public.documents;
DROP POLICY IF EXISTS "Allow authenticated users delete access to their documents" ON public.documents;
-- Combined policy for documents (check ownership via user_id on document OR via client_id -> clients.user_id OR lender_id -> lenders.user_id)
-- Note: This assumes lenders also have a user_id link or a way to check ownership.
-- If lenders don't have user_id, adjust the lender check accordingly.
CREATE POLICY "Allow authenticated users to manage documents" ON public.documents
    FOR ALL
    TO authenticated
    USING (
        auth.uid() = user_id OR
        (client_id IS NOT NULL AND EXISTS (SELECT 1 FROM clients WHERE clients.id = documents.client_id AND clients.user_id = auth.uid())) OR
        (lender_id IS NOT NULL AND EXISTS (SELECT 1 FROM lenders WHERE lenders.id = documents.lender_id AND lenders.user_id = auth.uid())) -- Assuming lenders table has user_id
    )
    WITH CHECK (
        auth.uid() = user_id OR
        (client_id IS NOT NULL AND EXISTS (SELECT 1 FROM clients WHERE clients.id = documents.client_id AND clients.user_id = auth.uid())) OR
        (lender_id IS NOT NULL AND EXISTS (SELECT 1 FROM lenders WHERE lenders.id = documents.lender_id AND lenders.user_id = auth.uid())) -- Assuming lenders table has user_id
    );

COMMENT ON COLUMN public.documents.client_id IS 'Optional foreign key linking the document to a specific client.';
COMMENT ON POLICY "Allow authenticated users to manage documents" ON public.documents IS 'Allows users to manage documents they own directly, or documents linked to clients or lenders they own.';


-- 3. Add client_id to activities table
ALTER TABLE public.activities
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL; -- Or CASCADE

-- Add index for the new foreign key
CREATE INDEX idx_activities_client_id ON public.activities(client_id);

-- Update activities RLS policies (similar logic to documents)
-- First, drop existing policies if they exist (use correct names if different)
DROP POLICY IF EXISTS "Enable read access for authenticated users based on user_id" ON public.activities;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.activities;
DROP POLICY IF EXISTS "Enable update access for authenticated users based on user_id" ON public.activities;
DROP POLICY IF EXISTS "Enable delete access for authenticated users based on user_id" ON public.activities;

-- Create a new comprehensive policy
CREATE POLICY "Allow authenticated users to manage activities" ON public.activities
    FOR ALL
    TO authenticated
    USING (
        auth.uid() = user_id OR
        (client_id IS NOT NULL AND EXISTS (SELECT 1 FROM clients WHERE clients.id = activities.client_id AND clients.user_id = auth.uid())) OR
        (lender_id IS NOT NULL AND EXISTS (SELECT 1 FROM lenders WHERE lenders.id = activities.lender_id AND lenders.user_id = auth.uid())) -- Assuming lenders table has user_id
    )
    WITH CHECK (
        auth.uid() = user_id OR
        (client_id IS NOT NULL AND EXISTS (SELECT 1 FROM clients WHERE clients.id = activities.client_id AND clients.user_id = auth.uid())) OR
        (lender_id IS NOT NULL AND EXISTS (SELECT 1 FROM lenders WHERE lenders.id = activities.lender_id AND lenders.user_id = auth.uid())) -- Assuming lenders table has user_id
    );

COMMENT ON COLUMN public.activities.client_id IS 'Optional foreign key linking the activity to a specific client.';
COMMENT ON POLICY "Allow authenticated users to manage activities" ON public.activities IS 'Allows users to manage activities they own directly, or activities linked to clients or lenders they own.';


-- 4. Create client_notes table
CREATE TABLE public.client_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX idx_client_notes_client_id ON public.client_notes(client_id);
CREATE INDEX idx_client_notes_user_id ON public.client_notes(user_id);

-- Add RLS
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage notes for their clients" ON public.client_notes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM clients WHERE clients.id = client_notes.client_id AND clients.user_id = auth.uid()))
    WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM clients WHERE clients.id = client_notes.client_id AND clients.user_id = auth.uid()));

-- Add comments
COMMENT ON TABLE public.client_notes IS 'Stores notes related to specific clients.';
COMMENT ON COLUMN public.client_notes.client_id IS 'Foreign key linking the note to a client.';
COMMENT ON COLUMN public.client_notes.user_id IS 'Foreign key linking the note to the user who created it.';
COMMENT ON POLICY "Allow authenticated users to manage notes for their clients" ON public.client_notes IS 'Allows users to manage notes associated with clients they own.';
