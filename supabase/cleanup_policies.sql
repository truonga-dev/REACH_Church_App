-- =============================================================================
-- CLEANUP: Xóa tất cả RLS Policies cũ
-- Chạy script này TRƯỚC schema_fixed.sql
-- =============================================================================

-- Xóa policies cũ từ bảng prayers
DROP POLICY IF EXISTS "Public prayers are viewable by everyone." ON public.prayers;
DROP POLICY IF EXISTS "Users can view own private prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can insert prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can update prayers" ON public.prayers;
DROP POLICY IF EXISTS "Users can delete prayers" ON public.prayers;

-- Xóa policies cũ từ bảng sermons
DROP POLICY IF EXISTS "Public sermons are viewable by everyone." ON public.sermons;
DROP POLICY IF EXISTS "Users can insert sermons" ON public.sermons;
DROP POLICY IF EXISTS "Users can update sermons" ON public.sermons;
DROP POLICY IF EXISTS "Users can delete sermons" ON public.sermons;

-- Xóa policies cũ từ bảng news
DROP POLICY IF EXISTS "Public news are viewable by everyone." ON public.news;
DROP POLICY IF EXISTS "Users can insert news" ON public.news;
DROP POLICY IF EXISTS "Users can update news" ON public.news;
DROP POLICY IF EXISTS "Users can delete news" ON public.news;

-- Xóa policies cũ từ bảng news_posts
DROP POLICY IF EXISTS "Public news_posts are viewable by everyone." ON public.news_posts;
DROP POLICY IF EXISTS "Users can insert news_posts" ON public.news_posts;
DROP POLICY IF EXISTS "Users can update news_posts" ON public.news_posts;
DROP POLICY IF EXISTS "Users can delete news_posts" ON public.news_posts;

-- Xóa policies cũ từ bảng ministries
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.ministries;
DROP POLICY IF EXISTS "Users can insert ministries" ON public.ministries;
DROP POLICY IF EXISTS "Users can update ministries" ON public.ministries;
DROP POLICY IF EXISTS "Users can delete ministries" ON public.ministries;

-- Xóa policies cũ từ bảng events
DROP POLICY IF EXISTS "Public events are viewable by everyone." ON public.events;
DROP POLICY IF EXISTS "Users can insert events" ON public.events;
DROP POLICY IF EXISTS "Users can update events" ON public.events;
DROP POLICY IF EXISTS "Users can delete events" ON public.events;

-- Xóa policies cũ từ bảng event_registrations
DROP POLICY IF EXISTS "event_registrations_select_own" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_own" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_delete_own" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_admin_all" ON public.event_registrations;

-- Xóa policies cũ từ bảng comments
DROP POLICY IF EXISTS "Public comments are viewable by everyone." ON public.comments;
DROP POLICY IF EXISTS "Users can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete comments" ON public.comments;

-- Xóa policies cũ từ bảng devotionals
DROP POLICY IF EXISTS "Public devotionals are viewable by everyone." ON public.devotionals;
DROP POLICY IF EXISTS "Users can insert devotionals" ON public.devotionals;
DROP POLICY IF EXISTS "Users can update devotionals" ON public.devotionals;
DROP POLICY IF EXISTS "Users can delete devotionals" ON public.devotionals;

-- Xóa policies cũ từ bảng donations
DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can create donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;

-- Xóa policies cũ từ storage
DROP POLICY IF EXISTS "Public Access Images" ON storage.objects;
DROP POLICY IF EXISTS "Enable Insert Images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Enable Insert Uploads" ON storage.objects;

-- =============================================================================
-- ✅ Hoàn thành cleanup
-- Bây giờ có thể chạy schema_fixed.sql mà không lỗi
-- =============================================================================
