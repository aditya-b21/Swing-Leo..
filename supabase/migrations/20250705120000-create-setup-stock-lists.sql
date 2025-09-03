-- Drop everything first to start fresh
DROP TABLE IF EXISTS public.setup_stock_lists CASCADE;

-- Create the table
CREATE TABLE public.setup_stock_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setup_type TEXT NOT NULL,
    stocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by TEXT,
    CONSTRAINT valid_setup_type CHECK (setup_type IN ('VCP', 'Rocket', 'IPO')),
    CONSTRAINT unique_setup_type UNIQUE (setup_type)
);

-- Enable RLS
ALTER TABLE public.setup_stock_lists ENABLE ROW LEVEL SECURITY;

-- Create a policy for read access
CREATE POLICY "Enable read access for authenticated users" ON public.setup_stock_lists
    FOR SELECT TO authenticated
    USING (true);

-- Create a policy for write access
CREATE POLICY "Enable write access for admin users" ON public.setup_stock_lists
    FOR ALL TO authenticated
    USING (auth.email() IN ('admin@swingscribe.com', 'adityabarod807@gmail.com'))
    WITH CHECK (auth.email() IN ('admin@swingscribe.com', 'adityabarod807@gmail.com'));

-- Insert initial empty records
INSERT INTO public.setup_stock_lists (setup_type, stocks) VALUES
    ('VCP', '[]'::jsonb),
    ('Rocket', '[]'::jsonb),
    ('IPO', '[]'::jsonb)
ON CONFLICT (setup_type) DO NOTHING; 