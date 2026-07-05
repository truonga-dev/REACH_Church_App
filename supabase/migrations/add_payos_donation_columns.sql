-- =======================================================
-- Migration: Thêm cột hỗ trợ PayOS và biên lai thủ công
-- Chạy trong: Supabase Dashboard → SQL Editor
-- =======================================================

-- 1. Thêm các cột mới vào bảng donations
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS payos_order_code   BIGINT UNIQUE,
  ADD COLUMN IF NOT EXISTS payos_link_id      TEXT,
  ADD COLUMN IF NOT EXISTS checkout_url       TEXT,
  ADD COLUMN IF NOT EXISTS receipt_image_url  TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at        TIMESTAMPTZ;

-- 2. Index để tìm nhanh theo orderCode PayOS
CREATE INDEX IF NOT EXISTS idx_donations_payos_order_code
  ON donations(payos_order_code)
  WHERE payos_order_code IS NOT NULL;

-- 3. Index tìm các donations chờ duyệt có biên lai
CREATE INDEX IF NOT EXISTS idx_donations_pending_receipt
  ON donations(status, receipt_image_url)
  WHERE status = 'pending';

-- =======================================================
-- Supabase Storage: Tạo bucket "donation-receipts"
-- Thực hiện thủ công trong: Supabase → Storage → New Bucket
-- Tên bucket: donation-receipts
-- Public: FALSE (private - chỉ admin mới xem được qua API)
-- =======================================================

-- RLS Policy cho bucket (chạy sau khi tạo bucket):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('donation-receipts', 'donation-receipts', false);

-- Policy: Chỉ authenticated users mới upload được
-- CREATE POLICY "Authenticated users can upload receipts"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'donation-receipts');

-- Policy: Chỉ admin/service role mới đọc được
-- CREATE POLICY "Service role can read receipts"  
-- ON storage.objects FOR SELECT TO service_role
-- USING (bucket_id = 'donation-receipts');
