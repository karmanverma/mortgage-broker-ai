-- Create the clients table
CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage their own clients" ON public.clients
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_email ON public.clients(email);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_clients_update
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

-- Add comments for clarity
COMMENT ON TABLE public.clients IS 'Stores client information linked to a user profile.';
COMMENT ON COLUMN public.clients.user_id IS 'Foreign key referencing the user who owns this client.';
COMMENT ON COLUMN public.clients.email IS 'Client''s unique email address.';
