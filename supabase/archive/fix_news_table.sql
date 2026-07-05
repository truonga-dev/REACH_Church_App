-- Tạo lại bảng news với đầy đủ các cột mà Frontend đang sử dụng
CREATE TABLE IF NOT EXISTS public.news (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  type text,
  content text NOT NULL,
  image_url text,
  pdf_url text,
  audio_url text,
  categories jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'published',
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Bật RLS (Row Level Security)
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả mọi người được xem dữ liệu (Read)
CREATE POLICY "Public news are viewable by everyone." 
ON public.news FOR SELECT USING (true);

-- Cho phép người dùng hoặc Admin thêm, sửa, xóa
CREATE POLICY "Users can insert news" ON public.news FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update news" ON public.news FOR UPDATE USING (true);
CREATE POLICY "Users can delete news" ON public.news FOR DELETE USING (true);

-- (Tùy chọn) Trigger tự động cập nhật updated_at
-- Hàm này có thể đã được tạo trước đó trong schema_final.sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_news') THEN
    CREATE TRIGGER set_updated_at_news
    BEFORE UPDATE ON public.news
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;
