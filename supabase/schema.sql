-- =============================================================================
-- REACH Church App — Supabase Schema (đầy đủ)
-- =============================================================================
-- Cách chạy:
--   1. Mở Supabase Dashboard → SQL Editor → New query
--   2. Dán toàn bộ file này → Run
--   3. Kiểm tra Storage → bucket "uploads" đã public
--
-- Lưu ý:
--   - File idempotent: chạy lại an toàn (DROP POLICY IF EXISTS + IF NOT EXISTS)
--   - Email Auth đã bật ở Sign In / Providers (ảnh bạn gửi: Enabled ✓)
--   - Admin app dùng mật khẩu .env (chưa dùng Supabase Auth) → policies ghi cho phép anon
--   - Production: siết RLS theo role "Quản trị viên" (xem cuối file)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. PROFILES — Hồ sơ tín hữu (liên kết auth.users)
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

-- Bổ sung cột nếu bảng cũ thiếu
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name  TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role       TEXT DEFAULT 'Hội viên';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role     ON public.profiles(role);

-- =============================================================================
-- 2. PRAYERS — Đề mục / nhu cầu cầu nguyện
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.prayers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'ongoing'
                 CHECK (status IN ('ongoing', 'answered', 'completed')),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name  TEXT,
  topic        TEXT,
  is_private   BOOLEAN NOT NULL DEFAULT FALSE,
  pray_count   INTEGER NOT NULL DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS description  TEXT;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS author_name    TEXT;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS topic          TEXT;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS is_private     BOOLEAN DEFAULT FALSE;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS pray_count     INTEGER DEFAULT 0;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS notes          TEXT;
ALTER TABLE public.prayers ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_prayers_user_id    ON public.prayers(user_id);
CREATE INDEX IF NOT EXISTS idx_prayers_status     ON public.prayers(status);
CREATE INDEX IF NOT EXISTS idx_prayers_is_private ON public.prayers(is_private);
CREATE INDEX IF NOT EXISTS idx_prayers_created    ON public.prayers(created_at DESC);

-- =============================================================================
-- 3. SERMONS — Bài giảng (YouTube)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sermons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  speaker      TEXT,
  series       TEXT,
  date         TEXT,
  youtube_url  TEXT,
  youtube_id   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS speaker     TEXT;
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS series      TEXT;
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS date        TEXT;
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS youtube_id  TEXT;
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_sermons_created ON public.sermons(created_at DESC);

-- =============================================================================
-- 4. NEWS — Bản tin, sự kiện, PDF, sách nói, dưỡng linh
--    type ví dụ: 'Bản tin' | 'Sự kiện' | 'Thông báo' | 'Sách Nói' | 'Tài liệu' | 'Dưỡng linh'
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.news (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  type        TEXT,
  content     TEXT,
  image_url   TEXT,
  pdf_url     TEXT,
  audio_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.news ADD COLUMN IF NOT EXISTS type       TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS content    TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS image_url  TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS pdf_url    TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS audio_url  TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_news_type     ON public.news(type);
CREATE INDEX IF NOT EXISTS idx_news_created  ON public.news(created_at DESC);

-- =============================================================================
-- 5. TRIGGER — Tự cập nhật updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_prayers_updated ON public.prayers;
CREATE TRIGGER trg_prayers_updated
  BEFORE UPDATE ON public.prayers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sermons_updated ON public.sermons;
CREATE TRIGGER trg_sermons_updated
  BEFORE UPDATE ON public.sermons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_news_updated ON public.news;
CREATE TRIGGER trg_news_updated
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 6. TRIGGER — Tự tạo profile khi user đăng ký (Supabase Auth)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, username, email, role)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    'Hội viên'
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 7. STORAGE — Bucket "uploads" (PDF, MP3, ảnh từ Admin)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  TRUE,
  5242880,  -- 5 MB (khớp giới hạn code Admin)
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 5242880;

-- Storage policies
DROP POLICY IF EXISTS "uploads_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "uploads_public_insert" ON storage.objects;
DROP POLICY IF EXISTS "uploads_public_update" ON storage.objects;
DROP POLICY IF EXISTS "uploads_public_delete" ON storage.objects;

CREATE POLICY "uploads_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY "uploads_public_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "uploads_public_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'uploads');

CREATE POLICY "uploads_public_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads');

-- =============================================================================
-- 8. ROW LEVEL SECURITY — Policies
-- =============================================================================

-- ---------- PROFILES ----------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin"    ON public.profiles;

CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin đổi role tín hữu (trang /admin)
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ---------- PRAYERS ----------
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prayers_select_public"    ON public.prayers;
DROP POLICY IF EXISTS "prayers_select_own"       ON public.prayers;
DROP POLICY IF EXISTS "prayers_insert_anyone"    ON public.prayers;
DROP POLICY IF EXISTS "prayers_update_pray_count" ON public.prayers;
DROP POLICY IF EXISTS "prayers_update_admin"     ON public.prayers;
DROP POLICY IF EXISTS "prayers_delete_admin"     ON public.prayers;

-- Xem cầu nguyện công khai
CREATE POLICY "prayers_select_public"
  ON public.prayers FOR SELECT
  USING (is_private = FALSE OR is_private IS NULL);

-- User xem cầu nguyện riêng của mình
CREATE POLICY "prayers_select_own"
  ON public.prayers FOR SELECT
  USING (auth.uid() = user_id);

-- Gửi cầu nguyện (kể cả khách chưa đăng nhập)
CREATE POLICY "prayers_insert_anyone"
  ON public.prayers FOR INSERT
  WITH CHECK (true);

-- Nút "Cầu nguyện" tăng pray_count (trang /prayer)
CREATE POLICY "prayers_update_pray_count"
  ON public.prayers FOR UPDATE
  USING (is_private = FALSE OR is_private IS NULL)
  WITH CHECK (is_private = FALSE OR is_private IS NULL);

-- Admin duyệt / hoàn thành
CREATE POLICY "prayers_update_admin"
  ON public.prayers FOR UPDATE
  USING (true);

CREATE POLICY "prayers_delete_admin"
  ON public.prayers FOR DELETE
  USING (true);

-- ---------- SERMONS ----------
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sermons_select_all"  ON public.sermons;
DROP POLICY IF EXISTS "sermons_insert_all"  ON public.sermons;
DROP POLICY IF EXISTS "sermons_update_all"  ON public.sermons;
DROP POLICY IF EXISTS "sermons_delete_all"  ON public.sermons;

CREATE POLICY "sermons_select_all"
  ON public.sermons FOR SELECT USING (true);

CREATE POLICY "sermons_insert_all"
  ON public.sermons FOR INSERT WITH CHECK (true);

CREATE POLICY "sermons_update_all"
  ON public.sermons FOR UPDATE USING (true);

CREATE POLICY "sermons_delete_all"
  ON public.sermons FOR DELETE USING (true);

-- ---------- NEWS ----------
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_select_all"  ON public.news;
DROP POLICY IF EXISTS "news_insert_all"  ON public.news;
DROP POLICY IF EXISTS "news_update_all"  ON public.news;
DROP POLICY IF EXISTS "news_delete_all"  ON public.news;

CREATE POLICY "news_select_all"
  ON public.news FOR SELECT USING (true);

CREATE POLICY "news_insert_all"
  ON public.news FOR INSERT WITH CHECK (true);

CREATE POLICY "news_update_all"
  ON public.news FOR UPDATE USING (true);

CREATE POLICY "news_delete_all"
  ON public.news FOR DELETE USING (true);

-- =============================================================================
-- 9. DỮ LIỆU MẪU (tùy chọn — xóa section này nếu không cần)
-- =============================================================================
INSERT INTO public.sermons (title, speaker, series, date, youtube_url, youtube_id)
SELECT
  'Chúa Jesus là câu trả lời',
  'MS. Quản nhiệm',
  'Tin Lành Giăng',
  '26/11/2024',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'dQw4w9WgXcQ'
WHERE NOT EXISTS (SELECT 1 FROM public.sermons LIMIT 1);

INSERT INTO public.news (title, type, content)
SELECT
  'Chào mừng đến với REACH Church App',
  'Thông báo',
  'Ứng dụng chính thức của Hội Thánh R.E.A.C.H Vietnam. Cập nhật bản tin, bài giảng và cầu nguyện mỗi ngày.'
WHERE NOT EXISTS (SELECT 1 FROM public.news LIMIT 1);

INSERT INTO public.news (title, type, content)
SELECT
  'Sống trong ân điển',
  'Dưỡng linh',
  'Vả, bởi sự đầy dẫn của Ngài mà chúng ta đều có nhận được, và ơn càng thêm ơn. — Giăng 1:16'
WHERE NOT EXISTS (
  SELECT 1 FROM public.news WHERE type ILIKE '%dưỡng linh%'
);

-- =============================================================================
-- 10. KIỂM TRA SAU KHI CHẠY
-- =============================================================================
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('profiles','prayers','sermons','news');
--
-- SELECT * FROM storage.buckets WHERE id = 'uploads';
--
-- =============================================================================
-- PRODUCTION (khuyến nghị sau này):
-- Thay policies "insert_all/update_all/delete_all" bằng:
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Quản trị viên')
-- =============================================================================
