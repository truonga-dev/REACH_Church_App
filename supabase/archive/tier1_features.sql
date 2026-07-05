-- =============================================================================
-- TIER 1 FEATURES — Supabase Schema Extensions
-- =============================================================================
-- Features:
--   1. Favorites (like verses, news, sermons)
--   2. Comments on news
--   3. Reading progress tracking
--   4. Search optimization
--
-- Run this file in Supabase SQL Editor after main schema
-- =============================================================================

-- =============================================================================
-- 1. FAVORITES — Like verses, news, sermons
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type  TEXT NOT NULL CHECK (content_type IN ('verse', 'news', 'sermon')),
  content_id    TEXT NOT NULL,  -- verse ref (e.g., "43:1:16"), news UUID, or sermon UUID
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate favorites (one like per user per content)
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique 
  ON public.favorites(user_id, content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_content ON public.favorites(content_type, content_id);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all favorites"
  ON public.favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can only create own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 2. COMMENTS — Comments on news
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id     UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  content     TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,  -- Moderate comments
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_news_id ON public.comments(news_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON public.comments(created_at DESC);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved comments"
  ON public.comments FOR SELECT
  USING (is_approved = true OR auth.uid() = user_id);

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
DROP TRIGGER IF EXISTS trg_comments_updated ON public.comments;
CREATE TRIGGER trg_comments_updated
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 3. READING_PROGRESS — Track which verses user has read
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book        INTEGER NOT NULL,      -- Book number (e.g., 43 for John)
  chapter     INTEGER NOT NULL,      -- Chapter number
  verse       INTEGER NOT NULL,      -- Verse number
  read_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_ms INTEGER,               -- How long user read this verse (ms)
  notes       TEXT                   -- User notes for verse
);

-- One entry per user per verse (upsert on read)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reading_progress_unique 
  ON public.reading_progress(user_id, book, chapter, verse);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_book ON public.reading_progress(book, chapter);
CREATE INDEX IF NOT EXISTS idx_reading_progress_date ON public.reading_progress(read_at DESC);

-- Enable RLS
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading progress"
  ON public.reading_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reading progress"
  ON public.reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.reading_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 4. FULL TEXT SEARCH — Setup for news and sermons
-- =============================================================================

-- Add search column to news (if not exists)
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create search index on news
CREATE INDEX IF NOT EXISTS idx_news_search_vector ON public.news USING gin(search_vector);

-- Function to update search vector on news insert/update
CREATE OR REPLACE FUNCTION public.update_news_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('vietnamese', coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_news_search_vector ON public.news;
CREATE TRIGGER trg_news_search_vector
  BEFORE INSERT OR UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.update_news_search_vector();

-- Add search column to sermons (if not exists)
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_sermons_search_vector ON public.sermons USING gin(search_vector);

CREATE OR REPLACE FUNCTION public.update_sermons_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := to_tsvector('vietnamese', coalesce(NEW.title, '') || ' ' || coalesce(NEW.speaker, '') || ' ' || coalesce(NEW.series, ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sermons_search_vector ON public.sermons;
CREATE TRIGGER trg_sermons_search_vector
  BEFORE INSERT OR UPDATE ON public.sermons
  FOR EACH ROW EXECUTE FUNCTION public.update_sermons_search_vector();

-- =============================================================================
-- 5. MATERIALIZED VIEW — Reading stats per user
-- =============================================================================

CREATE OR REPLACE VIEW public.user_reading_stats AS
SELECT
  user_id,
  COUNT(DISTINCT (book, chapter, verse)) as verses_read,
  COUNT(DISTINCT (book, chapter)) as chapters_read,
  COUNT(DISTINCT book) as books_read,
  MAX(read_at) as last_read_at,
  MIN(read_at) as first_read_at
FROM public.reading_progress
GROUP BY user_id;

-- =============================================================================
-- 6. MATERIALIZED VIEW — Comment stats per news
-- =============================================================================

CREATE OR REPLACE VIEW public.news_comment_stats AS
SELECT
  news_id,
  COUNT(*) as total_comments,
  COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_comments,
  MAX(created_at) as last_comment_at
FROM public.comments
GROUP BY news_id;

-- =============================================================================
-- 7. MATERIALIZED VIEW — Favorite counts
-- =============================================================================

CREATE OR REPLACE VIEW public.content_favorite_counts AS
SELECT
  content_type,
  content_id,
  COUNT(*) as favorite_count
FROM public.favorites
GROUP BY content_type, content_id;

-- =============================================================================
-- End of Tier 1 Features Schema
-- =============================================================================
