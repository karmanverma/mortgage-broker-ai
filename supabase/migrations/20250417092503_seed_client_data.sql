-- Seed data for the clients table
-- Note: user_id will be set to the UID of the user running this migration.

-- INSERT INTO public.clients (user_id, first_name, last_name, email, phone, address_line1, city, state, zip_code, country, date_of_birth, employment_status, employer_name, job_title, annual_income, credit_score)
-- VALUES
--     (auth.uid(), 'Alice', 'Smith', 'alice.smith@example.com', '555-1234', '123 Main St', 'Anytown', 'CA', '90210', 'USA', '1985-03-15', 'employed', 'Tech Corp', 'Software Engineer', 120000, 750),
--     (auth.uid(), 'Bob', 'Johnson', 'bob.johnson@example.com', '555-5678', '456 Oak Ave', 'Otherville', 'NY', '10001', 'USA', '1992-07-22', 'self-employed', NULL, 'Freelance Writer', 80000, 680),
--     (auth.uid(), 'Charlie', 'Brown', 'charlie.brown@example.com', '555-9999', '789 Pine Ln', 'Smallburg', 'TX', '75001', 'USA', '1978-11-01', 'employed', 'Global Inc', 'Project Manager', 150000, 810);

-- Optional: Add some related notes or documents if needed
-- INSERT INTO public.client_notes (client_id, user_id, content)
-- VALUES
--     ((SELECT id FROM public.clients WHERE email = 'alice.smith@example.com'), auth.uid(), 'Initial consultation scheduled for next week.');
