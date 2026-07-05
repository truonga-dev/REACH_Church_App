-- =============================================================================
-- Giai đoạn 1 — Chuẩn hóa bảng donations
-- Chạy trong Supabase SQL Editor trước khi triển khai form admin
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.donations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount          NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  currency        TEXT NOT NULL DEFAULT 'VND',
  category        TEXT NOT NULL DEFAULT 'other',
  payment_method  TEXT,
  transaction_id  TEXT,
  donor_name      TEXT,
  admin_notes     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bổ sung cột nếu bảng đã tồn tại từ schema cũ
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_method  TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS transaction_id  TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS donor_name      TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS admin_notes     TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own donations" ON public.donations
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create donations" ON public.donations
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage all donations" ON public.donations
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'Admin', 'super_admin', 'Quản trị viên')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_category ON public.donations(category);
