-- Bổ sung bảng đăng ký sự kiện và quyền xem đề mục cầu nguyện riêng
-- Chạy trong Supabase SQL Editor nếu đã dùng schema_final.sql trước đó

DO $$ BEGIN
  CREATE POLICY "Users can view own private prayers" ON public.prayers
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attended      BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "event_registrations_select_own" ON public.event_registrations
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "event_registrations_insert_own" ON public.event_registrations
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "event_registrations_delete_own" ON public.event_registrations
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "event_registrations_admin_all" ON public.event_registrations
    FOR ALL TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'Admin', 'super_admin', 'Quản trị viên')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
