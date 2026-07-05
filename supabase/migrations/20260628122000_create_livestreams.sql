-- Migration: Create livestreams and sermon_notes tables

CREATE TABLE public.livestreams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_id TEXT,
  is_live BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure only one livestream is live at a time (Optional but good practice, though we can handle it in UI logic)
-- We will just query the most recent active one if there are multiple.

ALTER TABLE public.livestreams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to livestreams"
  ON public.livestreams FOR SELECT
  USING (true);

-- Admin can manage livestreams
CREATE POLICY "Allow admin to manage livestreams"
  ON public.livestreams FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create sermon notes table
CREATE TABLE public.sermon_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  livestream_id UUID REFERENCES public.livestreams(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, livestream_id)
);

ALTER TABLE public.sermon_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sermon notes"
  ON public.sermon_notes FOR ALL
  USING (auth.uid() = user_id);
