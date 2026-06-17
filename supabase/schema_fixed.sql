-- =============================================================================
-- REACH Church App — Supabase Schema FIX
-- Phiên bản đã sửa 2026-06-15 (Sửa mismatch schema)
-- =============================================================================
-- 🔴 VẤN ĐỀ CẦN SỬA:
-- 1. news_posts → news (Frontend sử dụng 'news')
-- 2. Thêm các cột thiếu: type, categories, image_url, pdf_url, audio_url
-- 3. Cập nhật RLS policies cho Vietnamese roles
-- 4. Đảm bảo dữ liệu đồng bộ cho Admin và Ban Điều Hành
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- FIX 1: Xóa các bảng sai cấu trúc
-- =============================================================================
DROP TABLE IF EXISTS public.news_posts CASCADE;
DROP TABLE IF EXISTS public.sermons_new CASCADE;
DROP TABLE IF EXISTS public.events_new CASCADE;

-- =============================================================================
-- 1. PROFILES — Hồ sơ tín hữu (GIỮ NGUYÊN)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  username    TEXT,
  email       TEXT,
  role        TEXT NOT NULL DEFAULT 'Thành viên',
  avatar_url  TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. PRAYERS — Đề mục cầu nguyện
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.prayers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  content      TEXT,
  category     TEXT,
  topic        TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' 
                 CHECK (status IN ('pending', 'reviewed', 'answered', 'closed', 'ongoing')),
  is_private   BOOLEAN NOT NULL DEFAULT FALSE,
  pray_count   INTEGER NOT NULL DEFAULT 0,
  author_name  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public prayers are viewable by everyone." ON public.prayers;
CREATE POLICY "Public prayers are viewable by everyone." ON public.prayers 
  FOR SELECT USING (is_private = FALSE OR is_private IS NULL);
DROP POLICY IF EXISTS "Users can view own private prayers" ON public.prayers;
CREATE POLICY "Users can view own private prayers" ON public.prayers 
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert prayers" ON public.prayers;
CREATE POLICY "Users can insert prayers" ON public.prayers 
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update prayers" ON public.prayers;
CREATE POLICY "Users can update prayers" ON public.prayers 
  FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete prayers" ON public.prayers;
CREATE POLICY "Users can delete prayers" ON public.prayers 
  FOR DELETE USING (true);

-- =============================================================================
-- 3. SERMONS — Bài giảng
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sermons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  speaker       TEXT,
  preacher      TEXT,
  series        TEXT,
  date          TEXT,
  sermon_date   TIMESTAMPTZ,
  audio_url     TEXT,
  video_url     TEXT,
  youtube_url   TEXT,
  youtube_id    TEXT,
  content       TEXT,
  duration_minutes INTEGER,
  views_count   INTEGER DEFAULT 0,
  likes_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public sermons are viewable by everyone." ON public.sermons;
CREATE POLICY "Public sermons are viewable by everyone." ON public.sermons 
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert sermons" ON public.sermons;
CREATE POLICY "Users can insert sermons" ON public.sermons 
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update sermons" ON public.sermons;
CREATE POLICY "Users can update sermons" ON public.sermons 
  FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete sermons" ON public.sermons;
CREATE POLICY "Users can delete sermons" ON public.sermons 
  FOR DELETE USING (true);

-- =============================================================================
-- 4. NEWS — Tin tức, Bài viết, Sách Nói, Tài liệu, Dưỡng linh
-- ✅ FIX: Sử dụng bảng "news" thay vì "news_posts"
-- ✅ FIX: Thêm TẤT CẢ các cột mà frontend sử dụng
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.news (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Bài viết', -- 'Bản tin', 'Bài viết', 'Sách Nói', 'Tài liệu', 'Dưỡng linh'
  content       TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  pdf_url       TEXT,
  audio_url     TEXT,
  featured_image_url TEXT,
  categories    JSONB DEFAULT '[]'::jsonb,
  category      TEXT,
  status        TEXT DEFAULT 'published', -- 'published', 'draft'
  author_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author        TEXT,
  views_count   INTEGER DEFAULT 0,
  likes_count   INTEGER DEFAULT 0,
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public news are viewable by everyone." ON public.news;
CREATE POLICY "Public news are viewable by everyone." ON public.news 
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert news" ON public.news;
CREATE POLICY "Users can insert news" ON public.news 
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update news" ON public.news;
CREATE POLICY "Users can update news" ON public.news 
  FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete news" ON public.news;
CREATE POLICY "Users can delete news" ON public.news 
  FOR DELETE USING (true);

-- =============================================================================
-- 5. MINISTRIES — Các mục vụ
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ministries (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category  TEXT NOT NULL,
  name      TEXT NOT NULL,
  icon      TEXT,
  "desc"    TEXT,
  leader    TEXT,
  schedule  TEXT,
  location  TEXT,
  mission   TEXT,
  goal      TEXT,
  activities JSONB DEFAULT '[]'::jsonb,
  details   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public ministries are viewable by everyone." ON public.ministries;
CREATE POLICY "Public ministries are viewable by everyone." ON public.ministries 
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert ministries" ON public.ministries;
CREATE POLICY "Users can insert ministries" ON public.ministries 
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update ministries" ON public.ministries;
CREATE POLICY "Users can update ministries" ON public.ministries 
  FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete ministries" ON public.ministries;
CREATE POLICY "Users can delete ministries" ON public.ministries 
  FOR DELETE USING (true);

-- =============================================================================
-- 6. EVENTS — Sự kiện
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  event_date        TIMESTAMPTZ NOT NULL,
  location          TEXT,
  department_id     TEXT,
  max_attendees     INTEGER,
  registrations_count INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public events are viewable by everyone." ON public.events;
CREATE POLICY "Public events are viewable by everyone." ON public.events 
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert events" ON public.events;
CREATE POLICY "Users can insert events" ON public.events 
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update events" ON public.events;
CREATE POLICY "Users can update events" ON public.events 
  FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete events" ON public.events;
CREATE POLICY "Users can delete events" ON public.events 
  FOR DELETE USING (true);

-- =============================================================================
-- 6b. EVENT REGISTRATIONS — Đăng ký sự kiện
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
DROP POLICY IF EXISTS "event_registrations_select_own" ON public.event_registrations;
CREATE POLICY "event_registrations_select_own" ON public.event_registrations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "event_registrations_insert_own" ON public.event_registrations;
CREATE POLICY "event_registrations_insert_own" ON public.event_registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "event_registrations_delete_own" ON public.event_registrations;
CREATE POLICY "event_registrations_delete_own" ON public.event_registrations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "event_registrations_admin_all" ON public.event_registrations;
CREATE POLICY "event_registrations_admin_all" ON public.event_registrations
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'Admin', 'Quản trị viên', 'Ban điều hành')
    )
  );

-- =============================================================================
-- 7. COMMENTS — Bình luận
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type   TEXT NOT NULL, -- 'news', 'sermon', 'event', 'devotional'
  post_id     UUID NOT NULL,
  content     TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public comments are viewable by everyone." ON public.comments;
CREATE POLICY "Public comments are viewable by everyone." ON public.comments 
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
CREATE POLICY "Users can insert comments" ON public.comments 
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update comments" ON public.comments;
CREATE POLICY "Users can update comments" ON public.comments 
  FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete comments" ON public.comments;
CREATE POLICY "Users can delete comments" ON public.comments 
  FOR DELETE USING (true);

-- =============================================================================
-- 8. DEVOTIONALS — Dưỡng linh
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.devotionals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  content             TEXT NOT NULL,
  description         TEXT,
  author              TEXT NOT NULL,
  author_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  featured_image_url  TEXT,
  image_url           TEXT,
  published_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  likes_count         INTEGER DEFAULT 0,
  views_count         INTEGER DEFAULT 0
);

ALTER TABLE public.devotionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public devotionals are viewable by everyone." ON public.devotionals;
CREATE POLICY "Public devotionals are viewable by everyone." ON public.devotionals 
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert devotionals" ON public.devotionals;
CREATE POLICY "Users can insert devotionals" ON public.devotionals 
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update devotionals" ON public.devotionals;
CREATE POLICY "Users can update devotionals" ON public.devotionals 
  FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Users can delete devotionals" ON public.devotionals;
CREATE POLICY "Users can delete devotionals" ON public.devotionals 
  FOR DELETE USING (true);

-- =============================================================================
-- 9. DONATIONS — Dâng hiến
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount          DECIMAL(15, 2) NOT NULL,
  currency        TEXT DEFAULT 'VND',
  category        TEXT DEFAULT 'Chung cộng', -- 'Chung cộng', 'Xây dựng', 'Truyền giáo'
  transaction_id  TEXT UNIQUE,
  status          TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;
CREATE POLICY "Users can view own donations" ON public.donations 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('Quản trị viên', 'Ban điều hành')
  ));
DROP POLICY IF EXISTS "Users can create donations" ON public.donations;
CREATE POLICY "Users can create donations" ON public.donations 
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;
CREATE POLICY "Admins can view all donations" ON public.donations 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('Quản trị viên'))
  );

-- =============================================================================
-- 10. STORAGE & TRIGGERS
-- =============================================================================
-- Tạo Trigger cập nhật thời gian
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Tạo triggers cho các bảng
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_prayers') THEN
    CREATE TRIGGER set_updated_at_prayers BEFORE UPDATE ON public.prayers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_sermons') THEN
    CREATE TRIGGER set_updated_at_sermons BEFORE UPDATE ON public.sermons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_news') THEN
    CREATE TRIGGER set_updated_at_news BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_ministries') THEN
    CREATE TRIGGER set_updated_at_ministries BEFORE UPDATE ON public.ministries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_events') THEN
    CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_comments') THEN
    CREATE TRIGGER set_updated_at_comments BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_devotionals') THEN
    CREATE TRIGGER set_updated_at_devotionals BEFORE UPDATE ON public.devotionals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_donations') THEN
    CREATE TRIGGER set_updated_at_donations BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

-- Tạo Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT DO NOTHING;

-- Drop storage policies trước (nếu tồn tại)
DROP POLICY IF EXISTS "Public Access Images" ON storage.objects;
DROP POLICY IF EXISTS "Enable Insert Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Enable Insert Uploads" ON storage.objects;

-- Tạo lại storage policies
CREATE POLICY "Public Access Images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Enable Insert Images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "Public Access Uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Enable Insert Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');

-- =============================================================================
-- ✅ HOÀN THÀNH
-- =============================================================================
-- Cách sử dụng:
-- 1. Mở Supabase Dashboard → SQL Editor → New query
-- 2. Dán nội dung file này vào
-- 3. Nhấn "Run" để apply
-- 4. Tải lại trang web (F5)
-- 
-- Kiểm tra lại:
-- 1. Đăng nhập Admin → Kiểm tra dữ liệu từng mục
-- 2. Đăng nhập Ban Điều Hành → Kiểm tra dữ liệu từng mục
-- 3. Hai tài khoản phải thấy dữ liệu nhất quán
-- =============================================================================
