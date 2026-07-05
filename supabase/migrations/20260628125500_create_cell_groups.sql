-- Create cell_groups table
CREATE TABLE IF NOT EXISTS public.cell_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    meeting_time TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cell_group_members table
CREATE TABLE IF NOT EXISTS public.cell_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.cell_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'co_leader', 'leader')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Add updated_at trigger for cell_groups
CREATE OR REPLACE FUNCTION update_cell_groups_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cell_groups_updated_at
    BEFORE UPDATE ON public.cell_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_cell_groups_updated_at_column();

-- Enable RLS
ALTER TABLE public.cell_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cell_groups
CREATE POLICY "Cell groups are viewable by everyone."
    ON public.cell_groups FOR SELECT
    USING (true);

CREATE POLICY "Cell groups can be inserted by admins."
    ON public.cell_groups FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'Quản trị viên'
    ));

CREATE POLICY "Cell groups can be updated by admins or leaders."
    ON public.cell_groups FOR UPDATE
    USING (
        leader_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'Quản trị viên'
        )
    );

CREATE POLICY "Cell groups can be deleted by admins."
    ON public.cell_groups FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'Quản trị viên'
    ));

-- RLS Policies for cell_group_members
CREATE POLICY "Cell group members are viewable by everyone."
    ON public.cell_group_members FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own membership request."
    ON public.cell_group_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Leaders or Admins can update membership status."
    ON public.cell_group_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.cell_groups
            WHERE cell_groups.id = cell_group_members.group_id AND cell_groups.leader_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'Quản trị viên'
        )
    );

CREATE POLICY "Users can leave group, or leaders/admins can remove members."
    ON public.cell_group_members FOR DELETE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.cell_groups
            WHERE cell_groups.id = cell_group_members.group_id AND cell_groups.leader_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'Quản trị viên'
        )
    );
