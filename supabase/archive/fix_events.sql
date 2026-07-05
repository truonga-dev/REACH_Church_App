CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    attended BOOLEAN DEFAULT false,
    UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Enable insert for authenticated users only" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Enable select for users based on user_id" ON public.event_registrations FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Enable delete for users based on user_id" ON public.event_registrations FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Enable select for admin" ON public.event_registrations FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role IN ('admin', 'Admin', 'super_admin', 'Quản trị viên')
        )
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
