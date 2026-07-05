-- Cập nhật bảng profiles để thêm trường department và custom_permissions

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT '[]'::jsonb;
