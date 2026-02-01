-- Add app_settings table to store complex JSON configurations like schedules
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for parents to see schedules)
CREATE POLICY "Allow public read access to app_settings" ON public.app_settings
    FOR SELECT USING (true);

-- Allow full access for admins
CREATE POLICY "Allow admin full access to app_settings" ON public.app_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
