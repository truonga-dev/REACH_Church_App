# 🔧 HƯỚNG DẪN SỬA LỖI DỮ LIỆU ADMIN

**Ngày:** 2026-06-15  
**Vấn đề:** Admin không thấy dữ liệu, Ban Điều Hành thấy dữ liệu  
**Độ ưu tiên:** 🔴 NGAY BÂY GIỜ

---

## 📌 Nguyên Nhân Gốc

### 1. Schema Mismatch (Chính 🔴)
```
❌ schema_final.sql định nghĩa: news_posts
✅ Frontend code sử dụng:      news

Kết quả: Admin → Query từ news_posts → KHÔNG CÓ DỮ LIỆU
         Ban Điều Hành → Query từ news → CÓ DỮ LIỆU
```

### 2. RLS Policies Không Hỗ trợ Vietnamese Roles (High 🟠)
```
RLS hiện tại kiểm tra: role IN ('admin', 'Admin')
Nhưng role thực tế là: 'Quản trị viên'

Kết quả: RLS từ chối quyền truy cập
```

### 3. Thiếu Cột trong Schema (High 🟠)
```
Frontend sử dụng: type, categories, image_url, pdf_url, audio_url
schema_final.sql: KHÔNG có các cột này!

Kết quả: Lỗi khi fetch dữ liệu
```

---

## 🛠️ HƯỚNG DẪN SỬA (4 Bước)

### **BƯỚC 1: Tạo Backup Dữ Liệu (Bảo Vệ)**

```sql
-- Chạy trên Supabase SQL Editor trước khi áp dụng schema mới
-- Tạo bảng backup từ news_posts (nếu tồn tại)

CREATE TABLE IF NOT EXISTS public.news_backup AS 
SELECT * FROM public.news_posts WHERE TRUE;

CREATE TABLE IF NOT EXISTS public.news_posts_backup AS 
SELECT * FROM public.news_posts WHERE TRUE;

-- Hoặc export dữ liệu hiện tại:
-- Supabase Dashboard → [Table] → Export as CSV
```

---

### **BƯỚC 2: Xác Định Dữ Liệu Hiện Tại**

Chạy lệnh này trên **Supabase SQL Editor** để kiểm tra:

```sql
-- Kiểm tra bảng news hiện tại
SELECT COUNT(*) as total_records, COUNT(DISTINCT type) as types
FROM public.news;

-- Kiểm tra cột trong bảng
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'news'
ORDER BY ordinal_position;

-- Kiểm tra dữ liệu mẫu
SELECT id, title, type, status, created_at 
FROM public.news 
LIMIT 5;
```

---

### **BƯỚC 3: Apply Schema Sửa Lỗi**

#### Cách A: Dùng File Schema Sửa Lỗi (Khuyến Cáo ✅)

1. **Mở file mới:** `supabase/schema_fixed.sql`
2. **Supabase Dashboard:**
   - → SQL Editor
   - → Paste toàn bộ nội dung từ `schema_fixed.sql`
   - → Nhấn **Run**
3. **Chờ xong, không có lỗi**

#### Cách B: Áp Dụng Từng Phần (Nếu Có Lỗi)

```sql
-- Bước 1: Xóa các bảng sai
DROP TABLE IF EXISTS public.news_posts CASCADE;

-- Bước 2: Kiểm tra dữ liệu hiện tại (nếu cần backup thêm)
SELECT * FROM public.news LIMIT 10;

-- Bước 3: Cập nhật RLS policies cho bảng news
DROP POLICY IF EXISTS "Public news are viewable by everyone." ON public.news;
DROP POLICY IF EXISTS "Users can insert news" ON public.news;

CREATE POLICY "Public news are viewable by everyone." ON public.news 
  FOR SELECT USING (true);
CREATE POLICY "Users can insert news" ON public.news 
  FOR INSERT WITH CHECK (true);

-- Bước 4: Thêm cột thiếu (nếu chưa có)
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Bài viết';
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb;
```

---

### **BƯỚC 4: Xác Minh & Kiểm Tra**

#### A. Kiểm Tra Database

```sql
-- Kiểm tra bảng news mới
SELECT COUNT(*) FROM public.news;

-- Kiểm tra cột đã thêm
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'news' AND column_name IN ('type', 'image_url', 'categories');

-- Kiểm tra RLS
SELECT policyname, permissive 
FROM pg_policies 
WHERE tablename = 'news';
```

#### B. Kiểm Tra Frontend

1. **Tải lại trang:** F5 (hoặc Ctrl+Shift+R để clear cache)
2. **Đăng nhập Admin:**
   - → Đi tới Admin Panel
   - → Kiểm tra từng tab: Tổng quan, Tin tức, Bài giảng, Sự kiện...
   - → Ghi lại số record thấy được
3. **Đăng nhập Ban Điều Hành:**
   - → Kiểm tra lại các tab
   - → So sánh số record

#### C. Kiểm Tra Browser Console

```javascript
// Mở DevTools (F12) → Console → Chạy:
localStorage.clear();
location.reload();

// Sau đó đăng nhập và kiểm tra Network tab:
// Tìm request: GET /rest/v1/news?...
// Kiểm tra Response: Phải có dữ liệu, không lỗi
```

---

## 📋 Checklist Xác Minh

| Mục | Admin | Ban Điều Hành | Ghi Chú |
|-----|-------|---------------|---------|
| Tổng quan (Stats) | ✅ | ✅ | Số record phải bằng nhau |
| Tin Tức | ✅ | ✅ | > 0 records |
| Bài Giảng | ✅ | ✅ | > 0 records |
| Sự Kiện | ✅ | ✅ | > 0 records |
| Cầu Nguyện | ✅ | ✅ | > 0 records |
| Dâng Hiến | ✅ | ✅ | Đầy đủ thông tin |
| Tín Hữu | ✅ | ✅ | > 0 profiles |

---

## 🚨 Nếu Còn Lỗi Sau Khi Apply

### Lỗi 1: "Table not found"
```sql
-- Kiểm tra bảng có tồn tại không
SELECT * FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'news';

-- Nếu không có, chạy lại schema_fixed.sql
```

### Lỗi 2: "Permission denied"
```sql
-- Kiểm tra RLS
SELECT * FROM pg_policies WHERE tablename = 'news';

-- Nếu RLS là 'permissive' = false, đó là vấn đề
-- Chạy lại phần RLS của schema_fixed.sql
```

### Lỗi 3: "Admin vẫn không thấy dữ liệu"
```sql
-- Kiểm tra role của admin user
SELECT id, email, role FROM public.profiles 
WHERE email = 'admin@example.com';

-- Role phải là 'Quản trị viên'
-- Nếu không, cập nhật:
UPDATE public.profiles 
SET role = 'Quản trị viên' 
WHERE email = 'admin@example.com';
```

---

## 📞 Hỗ Trợ Nhanh

| Vấn Đề | Giải Pháp |
|--------|----------|
| Admin không thấy dữ liệu | Apply schema_fixed.sql |
| Dữ liệu biến mất sau apply | Restore từ backup |
| RLS từ chối quyền | Cập nhật role = 'Quản trị viên' |
| Frontend lỗi 500 | Xóa cache localStorage, F5 |
| Bảng news không tồn tại | Chạy CREATE TABLE part của schema_fixed.sql |

---

## 📝 Ghi Chú Quan Trọng

1. **Không xóa schema_final.sql cũ** - Giữ để so sánh
2. **Luôn backup dữ liệu trước** khi sửa schema
3. **Test trên một tài khoản trước** rồi mới check tất cả
4. **Clear browser cache** sau khi apply schema
5. **Kiểm tra DevTools Console** để phát hiện lỗi sớm

---

## ✅ Hoàn Thành

Khi bạn hoàn thành tất cả bước:
- ✅ Admin thấy dữ liệu = Ban Điều Hành
- ✅ Không có lỗi trong console
- ✅ Tất cả tab đều có dữ liệu
- ✅ Dữ liệu đồng bộ giữa 2 role

**Bây giờ hệ thống sẽ hoạt động đúng! 🎉**
