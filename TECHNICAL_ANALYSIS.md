# 🔬 Phân Tích Kỹ Thuật - Vấn Đề Dữ Liệu Admin

**Tác Giả:** GitHub Copilot  
**Ngày:** 2026-06-15  
**Loại:** Technical Deep Dive

---

## I. PHÂN TÍCH VẤN ĐỀ

### 1. Timeline Vấn Đề

```
2026-06-05: Tạo schema_final.sql (11,962 bytes)
           → Định nghĩa news_posts
           
2026-06-12: Tạo fix_news_table.sql (1,495 bytes)
           → Định nghĩa public.news
           
2026-06-15: Frontend phát hiện vấn đề
           → Admin không thấy dữ liệu
           → Ban Điều Hành thấy dữ liệu
```

### 2. Root Cause Analysis

#### **Lỗi 1: Schema Mismatch (Critical)**

**Frontend Code** (`src/app/admin/page.tsx:278-285`):
```typescript
const fetchNews = useCallback(async () => {
  const { data, count } = await supabase.from('news')  // ← Sử dụng 'news'
    .select('*', { count: 'exact' })
    .eq('type', typeFilter)  // ← Sử dụng cột 'type'
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (data) {
    setNews(data.map(n => ({ 
      ...n, 
      categories: parseCategories(n.categories)  // ← Sử dụng 'categories'
    })));
  }
}, [newsPage, activeTab]);
```

**Database Schema** (`supabase/schema_final.sql:95-115`):
```sql
CREATE TABLE IF NOT EXISTS public.news_posts (  -- ← Sai: news_posts
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,  -- ← Sai: singular 'category'
  featured_image_url text,
  -- ← Thiếu: type, image_url, pdf_url, audio_url, categories
);
```

**Kết Quả:**
- Frontend query: `FROM news` → Database không có bảng này (hoặc RLS block)
- Dữ liệu thực tế: Trong bảng `news_posts` hoặc `news` cũ
- Admin: Không thấy dữ liệu (query sai bảng)
- Ban Điều Hành: Thấy dữ liệu (query đúng bảng - từ fix_news_table.sql)

---

#### **Lỗi 2: RLS Policies Không Hỗ Trợ Vietnamese Roles (High)**

**Schema_Final.sql** (`supabase/schema_final.sql:156-165`):
```sql
CREATE POLICY "event_registrations_admin_all" ON public.event_registrations
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'Admin', 'super_admin', 'Quản trị viên')
        -- ← Có 'Quản trị viên' nhưng có thể không match với role thực tế
    )
  );
```

**Permissions.ts** (`src/lib/permissions.ts:6`):
```typescript
export type UserRole = 'Quản trị viên' | 'Ban điều hành' | 'Thành viên';
```

**Profile Service** (`src/lib/profile-service.ts:18`):
```typescript
const payload = {
  role: 'Hội viên',  // ← Lưu ý: Default role khác!
  // ...
};
```

**Kết Quả:**
- Profile role có thể là: 'Quản trị viên', 'Ban điều hành', 'Hội viên', 'Thành viên'
- RLS kiểm tra: ('admin', 'Admin', 'Quản trị viên')
- Nếu role không match chính xác → RLS từ chối quyền
- Admin bị cấm quyền đọc một số dữ liệu

---

#### **Lỗi 3: Thiếu Cột Schema (High)**

**Frontend Sử Dụng:**
```typescript
// src/app/admin/page.tsx
const defaultNews: NewsItem = {
  title: '', 
  type: 'Bài viết',        // ← Cột 'type'
  content: '',
  image_url: '',            // ← Cột 'image_url'
  pdf_url: '',              // ← Cột 'pdf_url'
  audio_url: '',            // ← Cột 'audio_url'
  categories: [],           // ← Cột 'categories'
  status: 'published',
};
```

**Schema_Final SQL Không Có:**
```sql
CREATE TABLE public.news_posts (
  -- THIẾU:
  -- id, title, type, content, image_url, pdf_url, audio_url, categories
  
  category text,  -- ← Singular, không phải plural!
);
```

**Kết Quả:**
- Frontend POST/PUT: Gửi `image_url`, `pdf_url`, ...
- Database: Cột không tồn tại → Error 400
- Hoặc dữ liệu silently dropped

---

### 3. So Sánh Schema Files

| Tệp | Bảng | Cột | Trạng Thái | Sử Dụng |
|-----|------|-----|----------|--------|
| schema_final.sql | news_posts | category | ❌ Sai | Không |
| fix_news_table.sql | news | type, image_url, ... | ✅ Đúng | ? |
| schema.sql | news | type, categories | ✅ Đúng | ? |

**Vấn đề:** Không rõ cái nào được apply vào Supabase!

---

## II. CHẨN ĐOÁN

### 1. Kiểm Tra Bảng Hiện Tại

**SQL Query:**
```sql
-- Bảng nào tồn tại?
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%news%';

-- Kết quả mong đợi: HOẶC
-- - public.news
-- - public.news_posts
```

### 2. So Sánh Cột

**SQL Query:**
```sql
-- Cột trong bảng news
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'news'
ORDER BY ordinal_position;

-- Kết quả phải bao gồm:
-- - id (uuid)
-- - title (text)
-- - type (text)              ← QUAN TRỌNG
-- - content (text)
-- - categories (jsonb)       ← QUAN TRỌNG
-- - image_url (text)         ← QUAN TRỌNG
-- - pdf_url (text)           ← QUAN TRỌNG
-- - audio_url (text)         ← QUAN TRỌNG
-- - status (text)
-- - created_at (timestamp)
```

### 3. Kiểm Tra Dữ Liệu

**SQL Query:**
```sql
-- Bao nhiêu record?
SELECT COUNT(*) as total,
       COUNT(DISTINCT type) as types,
       COUNT(CASE WHEN status = 'published' THEN 1 END) as published
FROM public.news;

-- Mẫu dữ liệu
SELECT id, title, type, status, created_at
FROM public.news
LIMIT 5;
```

### 4. Kiểm Tra RLS

**SQL Query:**
```sql
-- RLS Policies cho news
SELECT policyname, permissive, qual, with_check
FROM pg_policies
WHERE tablename = 'news'
ORDER BY policyname;

-- RLS Policies cho event_registrations  
SELECT policyname, permissive
FROM pg_policies
WHERE tablename = 'event_registrations'
ORDER BY policyname;

-- Kiểm tra role của user
SELECT id, email, role
FROM public.profiles
WHERE email LIKE '%@%'
LIMIT 5;
```

---

## III. GIẢI PHÁP CHI TIẾT

### Bước 1: Xác Định Tình Trạng Hiện Tại

```sql
-- Chạy trên Supabase SQL Editor
-- 1. Kiểm tra bảng
\dt public.news*

-- 2. Kiểm tra cột
SELECT * FROM information_schema.columns
WHERE table_name IN ('news', 'news_posts')
AND table_schema = 'public';

-- 3. Kiểm tra dữ liệu
SELECT COUNT(*) FROM public.news;
SELECT COUNT(*) FROM public.news_posts;
```

### Bước 2: Sao Lưu Dữ Liệu

```sql
-- Backup bảng news_posts (nếu tồn tại)
CREATE TABLE public.news_backup AS
SELECT * FROM public.news_posts;

-- Hoặc backup bảng news
CREATE TABLE public.news_old AS
SELECT * FROM public.news;
```

### Bước 3: Áp Dụng Schema Mới

**Tùy Chọn A: Dùng schema_fixed.sql** (Khuyến Cáo)
```sql
-- Copy toàn bộ từ supabase/schema_fixed.sql
-- Paste vào Supabase SQL Editor
-- Run
```

**Tùy Chọn B: Merge Dữ Liệu** (Nếu có dữ liệu quan trọng)
```sql
-- Chỉ sao chép dữ liệu từ news_posts → news
INSERT INTO public.news (title, content, category, featured_image_url, ...)
SELECT title, content, category, featured_image_url, ...
FROM public.news_posts
ON CONFLICT DO NOTHING;

-- Sau đó xóa bảng cũ
DROP TABLE public.news_posts;
```

### Bước 4: Cập Nhật RLS Policies

```sql
-- Xóa policy cũ
DROP POLICY IF EXISTS "event_registrations_admin_all" ON public.event_registrations;

-- Tạo policy mới hỗ trợ cả 'admin' và 'Quản trị viên'
CREATE POLICY "event_registrations_admin_all" ON public.event_registrations
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'Admin', 'Quản trị viên', 'Ban điều hành')
  )
);
```

### Bước 5: Cập Nhật Role Sai

```sql
-- Kiểm tra role không đúng
SELECT id, email, role FROM public.profiles
WHERE role NOT IN ('Quản trị viên', 'Ban điều hành', 'Thành viên', 'Hội viên');

-- Sửa role của admin
UPDATE public.profiles
SET role = 'Quản trị viên'
WHERE email = 'admin-email@church.com';

-- Sửa role của Ban Điều Hành
UPDATE public.profiles
SET role = 'Ban điều hành'
WHERE email = 'executive-email@church.com';
```

---

## IV. KIỂM TRA SAU KHI SỬA

### Frontend Tests

```typescript
// DevTools Console
// Kiểm tra request

// 1. Clear cache
localStorage.clear();
sessionStorage.clear();

// 2. Reload
location.reload();

// 3. Open Network tab
// 4. Đăng nhập Admin
// 5. Tìm request: GET /rest/v1/news?...
// 6. Kiểm tra Response Status: 200
// 7. Kiểm tra Response Body: Có dữ liệu, không lỗi
```

### Database Verification

```sql
-- Final Verification Queries

-- 1. Bảng đúng tồn tại
SELECT COUNT(*) FROM public.news;

-- 2. Cột đúng tồn tại
SELECT * FROM information_schema.columns
WHERE table_name = 'news'
AND column_name IN ('type', 'categories', 'image_url', 'pdf_url', 'audio_url');

-- 3. RLS cho phép đọc
SELECT * FROM public.news LIMIT 1;

-- 4. Role của user đúng
SELECT role FROM public.profiles 
WHERE id = 'current-user-id';

-- 5. Policies áp dụng
SELECT policyname FROM pg_policies 
WHERE tablename = 'news' AND permissive = true;
```

---

## V. MAPPING: Problem → Solution

| Vấn Đề | Lỗi | Giải Pháp |
|--------|-----|----------|
| Admin không thấy dữ liệu | Query `FROM news_posts` mà bảng không tồn tại | Áp dụng schema_fixed.sql |
| Ban Điều Hành thấy dữ liệu | Query `FROM news` từ fix_news_table.sql | Giữ nguyên (OK) |
| RLS từ chối quyền | Role = 'Quản trị viên' nhưng RLS check 'admin' | Cập nhật RLS policies |
| Frontend Error 400 | Cột không tồn tại (type, categories, ...) | Thêm cột trong ALTER TABLE |
| Dữ liệu mất | Xóa bảng cũ mà không backup | Restore từ backup |

---

## VI. REFERENCE

### Affected Code Files
- [src/app/admin/page.tsx](src/app/admin/page.tsx) - Line 278 (`fetchNews`)
- [src/lib/permissions.ts](src/lib/permissions.ts) - Line 6 (Role definitions)
- [supabase/schema_final.sql](supabase/schema_final.sql) - Line 95 (news_posts table)
- [supabase/fix_news_table.sql](supabase/fix_news_table.sql) - Line 2 (news table)

### Database Connections
- **Supabase SQL Editor:** https://supabase.com/dashboard
- **View Tables:** [Table] → Info
- **Run Custom SQL:** SQL Editor → New Query

### Migration Files
```
supabase/
  ├── schema.sql           ← Original (has news table)
  ├── schema_final.sql     ← Latest (has news_posts - WRONG!)
  ├── fix_news_table.sql   ← Fix (has news table - RIGHT!)
  ├── fix_prayers_and_events.sql
  ├── fix_events.sql
  └── tier1_features.sql
```

---

## ✅ Checklist Hoàn Thành

- [ ] Tạo backup dữ liệu
- [ ] Chạy diagnostic SQL queries
- [ ] Áp dụng schema_fixed.sql
- [ ] Cập nhật RLS policies
- [ ] Clear browser cache
- [ ] Đăng nhập Admin → Kiểm tra tất cả tab
- [ ] Đăng nhập Ban Điều Hành → Xác nhận dữ liệu
- [ ] DevTools Console → Không có lỗi
- [ ] Dữ liệu nhất quán giữa 2 role

---

**Phiên Bản:** 1.0  
**Trạng Thái:** Sẵn sàng áp dụng
**Độ Ưu Tiên:** 🔴 NGAY BÂY GIỜ
