-- Create event_volunteers table
CREATE TABLE IF NOT EXISTS public.event_volunteers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Thành viên',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, user_id)
);

-- Add updated_at trigger for event_volunteers
CREATE OR REPLACE FUNCTION update_event_volunteers_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_volunteers_updated_at
    BEFORE UPDATE ON public.event_volunteers
    FOR EACH ROW
    EXECUTE FUNCTION update_event_volunteers_updated_at_column();

-- Enable RLS
ALTER TABLE public.event_volunteers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_volunteers
CREATE POLICY "Event volunteers are viewable by everyone."
    ON public.event_volunteers FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own volunteer request."
    ON public.event_volunteers FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own role or admins can update status."
    ON public.event_volunteers FOR UPDATE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'Quản trị viên'
        )
    );

CREATE POLICY "Users can cancel their volunteer request, admins can delete."
    ON public.event_volunteers FOR DELETE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'Quản trị viên'
        )
    );
