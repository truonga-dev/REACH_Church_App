-- =============================================================================
-- REACH Church App — Supabase Schema V2 Standard
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  username    TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'Hội viên',
  avatar_url  TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. PRAYERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.prayers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  category     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',
  is_private   BOOLEAN NOT NULL DEFAULT FALSE,
  pray_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public prayers are viewable by everyone." ON public.prayers FOR SELECT USING (is_private = FALSE OR is_private IS NULL);
CREATE POLICY "Users can view own private prayers" ON public.prayers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert prayers" ON public.prayers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update prayers" ON public.prayers FOR UPDATE USING (true);
CREATE POLICY "Users can delete prayers" ON public.prayers FOR DELETE USING (true);

-- =============================================================================
-- 3. SERMONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sermons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  audio_url text,
  video_url text,
  youtube_url text,
  youtube_id text,
  series text,
  speaker text,
  date text,
  content text,
  sermon_date timestamp with time zone,
  duration_minutes integer,
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sermons are viewable by everyone." ON public.sermons FOR SELECT USING (true);
CREATE POLICY "Users can insert sermons" ON public.sermons FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update sermons" ON public.sermons FOR UPDATE USING (true);
CREATE POLICY "Users can delete sermons" ON public.sermons FOR DELETE USING (true);

-- =============================================================================
-- 4. NEWS (Đã hợp nhất từ news_posts, chứa cả type, categories, v.v.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.news (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'Bài viết',
  content text NOT NULL,
  category text,
  categories jsonb DEFAULT '[]'::jsonb,
  image_url text,
  pdf_url text,
  audio_url text,
  status text DEFAULT 'published',
  published_at timestamp with time zone DEFAULT now(),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public news are viewable by everyone." ON public.news FOR SELECT USING (true);
CREATE POLICY "Users can insert news" ON public.news FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update news" ON public.news FOR UPDATE USING (true);
CREATE POLICY "Users can delete news" ON public.news FOR DELETE USING (true);

-- =============================================================================
-- 5. MINISTRIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ministries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  name text NOT NULL,
  icon text,
  "desc" text,
  leader text,
  schedule text,
  location text,
  mission text,
  goal text,
  activities jsonb DEFAULT '[]'::jsonb,
  details text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.ministries FOR SELECT USING (true);
CREATE POLICY "Users can insert ministries" ON public.ministries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update ministries" ON public.ministries FOR UPDATE USING (true);
CREATE POLICY "Users can delete ministries" ON public.ministries FOR DELETE USING (true);

-- =============================================================================
-- 6. EVENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  location text,
  department_id text,
  max_attendees integer,
  registrations_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.events FOR SELECT USING (true);
CREATE POLICY "Users can insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Users can delete events" ON public.events FOR DELETE USING (true);

-- =============================================================================
-- 6b. EVENT REGISTRATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attended      BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "event_registrations_select_own" ON public.event_registrations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "event_registrations_insert_own" ON public.event_registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "event_registrations_delete_own" ON public.event_registrations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "event_registrations_admin_all" ON public.event_registrations
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'Admin', 'super_admin', 'Quản trị viên', 'Ban điều hành')
    )
  );

-- =============================================================================
-- 7. COMMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  post_type text NOT NULL,
  post_id text NOT NULL,
  content text NOT NULL,
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update comments" ON public.comments FOR UPDATE USING (true);
CREATE POLICY "Users can delete comments" ON public.comments FOR DELETE USING (true);

-- =============================================================================
-- 8. DEVOTIONALS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.devotionals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  featured_image_url text,
  published_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  likes_count integer DEFAULT 0,
  views_count integer DEFAULT 0
);

ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public devotionals are viewable by everyone." ON public.devotionals FOR SELECT USING (true);
CREATE POLICY "Users can insert devotionals" ON public.devotionals FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update devotionals" ON public.devotionals FOR UPDATE USING (true);
CREATE POLICY "Users can delete devotionals" ON public.devotionals FOR DELETE USING (true);

-- =============================================================================
-- 9. DONATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name text,
  amount numeric NOT NULL,
  currency text DEFAULT 'VND',
  purpose text,
  payment_method text,
  status text DEFAULT 'pending',
  transaction_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert donations" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own donations" ON public.donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all donations" ON public.donations FOR SELECT USING (
  EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'Admin', 'super_admin', 'Quản trị viên', 'Ban điều hành')
  )
);
CREATE POLICY "Admins can update donations" ON public.donations FOR UPDATE USING (
  EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'Admin', 'super_admin', 'Quản trị viên', 'Ban điều hành')
  )
);

-- =============================================================================
-- 10. STORAGE & TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT DO NOTHING;
