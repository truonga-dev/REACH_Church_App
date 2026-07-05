-- Thêm trường category cho devotionals
ALTER TABLE public.devotionals 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Thêm trường image_url cho ministries
ALTER TABLE public.ministries 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Tạo trigger tự cập nhật updated_at cho ministries nếu chưa có
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
