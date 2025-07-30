-- Create table for admin-uploaded stock lists
CREATE TABLE IF NOT EXISTS public.setup_stock_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setup_type TEXT NOT NULL CHECK (setup_type IN ('VCP', 'Rocket', 'IPO')),
    stocks JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_by TEXT
);

-- Enable RLS
ALTER TABLE public.setup_stock_lists ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read
CREATE POLICY "Authenticated users can view stock lists" 
    ON public.setup_stock_lists
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy: Only admins can manage stock lists
CREATE POLICY "Admins can manage stock lists" 
    ON public.setup_stock_lists
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.email IN ('admin@swingscribe.com', 'adityabarod807@gmail.com')
        )
    );

-- Add index for faster lookups
CREATE INDEX idx_setup_stock_lists_type ON public.setup_stock_lists(setup_type); 