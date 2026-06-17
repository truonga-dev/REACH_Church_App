-- =============================================================================
-- FIX: Admin & Ban Điều Hành xem TẤT CẢ dữ liệu (Đồng bộ dữ liệu)
-- Ngày: 2026-06-15
-- =============================================================================
-- Vấn đề: Admin không thấy dữ liệu của user khác
-- Giải pháp: RLS policy cho phép Admin/Ban Điều Hành xem tất cả
-- =============================================================================

-- 1. PRAYERS — Cầu Nguyện
-- =============================================================================
DROP POLICY IF EXISTS "Public prayers are viewable by everyone." ON public.prayers;
CREATE POLICY "Public prayers are viewable by everyone." ON public.prayers 
  FOR SELECT USING (
    -- Công khai
    is_private = FALSE 
    OR is_private IS NULL 
    -- Chủ sở hữu xem được
    OR auth.uid() = user_id
    -- Admin & Ban Điều Hành xem TẤT CẢ
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Quản trị viên', 'Ban điều hành', 'admin', 'Admin', 'ADMIN')
    )
  );

-- 2. NEWS — Tin tức, Bài viết
-- =============================================================================
DROP POLICY IF EXISTS "Public news are viewable by everyone." ON public.news;
CREATE POLICY "Public news are viewable by everyone." ON public.news 
  FOR SELECT USING (true);  -- Tất cả xem được

-- 3. SERMONS — Bài giảng
-- =============================================================================
DROP POLICY IF EXISTS "Public sermons are viewable by everyone." ON public.sermons;
CREATE POLICY "Public sermons are viewable by everyone." ON public.sermons 
  FOR SELECT USING (true);  -- Tất cả xem được

-- 4. MINISTRIES — Mục vụ
-- =============================================================================
DROP POLICY IF EXISTS "Public ministries are viewable by everyone." ON public.ministries;
CREATE POLICY "Public ministries are viewable by everyone." ON public.ministries 
  FOR SELECT USING (true);  -- Tất cả xem được

-- 5. EVENTS — Sự kiện
-- =============================================================================
DROP POLICY IF EXISTS "Public events are viewable by everyone." ON public.events;
CREATE POLICY "Public events are viewable by everyone." ON public.events 
  FOR SELECT USING (true);  -- Tất cả xem được

-- 6. DEVOTIONALS — Dưỡng linh
-- =============================================================================
DROP POLICY IF EXISTS "Public devotionals are viewable by everyone." ON public.devotionals;
CREATE POLICY "Public devotionals are viewable by everyone." ON public.devotionals 
  FOR SELECT USING (true);  -- Tất cả xem được

-- 7. COMMENTS — Bình luận
-- =============================================================================
DROP POLICY IF EXISTS "Public comments are viewable by everyone." ON public.comments;
CREATE POLICY "Public comments are viewable by everyone." ON public.comments 
  FOR SELECT USING (true);  -- Tất cả xem được

-- 8. DONATIONS — Dâng hiến
-- =============================================================================
DROP POLICY IF EXISTS "Users can view own donations" ON public.donations;
CREATE POLICY "Users can view own donations" ON public.donations 
  FOR SELECT USING (
    -- Người dùng xem donations của mình
    auth.uid() = user_id
    -- Admin & Ban Điều Hành xem TẤT CẢ
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Quản trị viên', 'Ban điều hành', 'admin', 'Admin', 'ADMIN')
    )
  );

DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;
CREATE POLICY "Admins can view all donations" ON public.donations 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('Quản trị viên', 'Ban điều hành', 'admin', 'Admin', 'ADMIN')
    )
  );

-- =============================================================================
-- ✅ HOÀN THÀNH
-- =============================================================================
-- Cách sử dụng:
-- 1. Copy nội dung file này
-- 2. Supabase SQL Editor → New Query
-- 3. Paste + Run
-- 4. Hard Refresh: Ctrl+Shift+Delete + F5
-- 5. Đăng nhập Admin & Ban Điều Hành → Kiểm tra dữ liệu
-- =============================================================================
