-- Tạo bảng user_favorites để lưu các mục được yêu thích (dưỡng linh, bài giảng, tài liệu...)
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text NOT NULL,
    item_type text NOT NULL, -- 'devotional', 'sermon', 'audiobook', 'pdf'
    item_id text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own favorites" 
  ON public.user_favorites 
  FOR ALL 
  USING (true);

-- Thêm cột parent_id vào bảng comments để hỗ trợ trả lời bình luận
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;
