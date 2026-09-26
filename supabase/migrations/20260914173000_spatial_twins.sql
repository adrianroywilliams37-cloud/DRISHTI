-- Create spatial_twins table to store the generative AI output
CREATE TABLE IF NOT EXISTS public.spatial_twins (
    project_id text PRIMARY KEY,
    sector text NOT NULL,
    architecture text NOT NULL,
    topology jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.spatial_twins ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to authenticated users" ON public.spatial_twins
    FOR SELECT TO authenticated USING (true);

-- Allow backend service role to insert/update
-- (Usually managed by service role key, but this ensures safe default access patterns)
CREATE POLICY "Allow full access to service role" ON public.spatial_twins
    FOR ALL TO service_role USING (true);
