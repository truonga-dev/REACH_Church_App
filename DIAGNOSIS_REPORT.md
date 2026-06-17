# 🔍 Báo Cáo Chẩn Đoán Vấn Đề Dữ Liệu Admin

**Ngày báo cáo:** 2026-06-15  
**Trạng thái:** 🔴 Lỗi Dữ Liệu Phát Hiện

---

## 📋 Tóm Tắt Vấn Đề

Khi đăng nhập:
- ✅ **Ban Điều Hành (Quản lý nội dung)**: Thấy dữ liệu bình thường
- ❌ **Quản Trị Viên (Admin)**: KHÔNG thấy dữ liệu

---

## 🚨 Các Vấn Đề Được Xác Định

### 1. **Lỗi Schema Chính** (Critical 🔴)
```
❌ schema_final.sql KHÔNG khớp với code frontend
   - schema_final.sql sử dụng: news_posts, sermons_new, events_new
   - Code frontend sử dụng: news, sermons, events
   
⚠️  Kết quả: Admin truy vấn bảng sai → Không có dữ liệu
✅ Ban Điều Hành: Code đúng → Thấy dữ liệu
```

### 2. **Bảng News Không Nhất Quán** (Critical 🔴)
```
Tệp schema.sql (cũ):
  - CREATE TABLE public.news (id, title, type, content, categories)
  
Tệp schema_final.sql (mới):
  - CREATE TABLE public.news_posts (id, title, content, category)
  - KHÔNG có: type, categories, image_url, pdf_url, audio_url
  
⚠️  Frontend code sử dụng:
  - .from('news').select('*')
  - Kỳ vọng cột: type, content, categories, image_url
  - Nhưng schema_final.sql KHÔNG định nghĩa những cột này!
```

### 3. **RLS (Row Level Security) - Có Thể Là Nguyên Nhân** (High 🟠)
```
Các policies hiện tại:
  ✅ news: "Public news are viewable by everyone" (good)
  ❓ event_registrations: Có điều kiện role = 'admin' NHƯNG:
     - Chỉ kiểm tra role = 'admin' (chữ thường)
     - Không kiểm tra role = 'Quản trị viên' (chữ Việt)
     
⚠️  Kết quả: Admin có role = 'Quản trị viên', nhưng RLS kiểm tra 'admin'
     → RLS từ chối quyền truy cập cho admin!
```

### 4. **Không Đồng Bộ Dữ Liệu** (High 🟠)
```
Schema Files:
  ✅ schema.sql (2026-06-15 11:19)
  ✅ schema_final.sql (2026-06-15 11:19)  
  ✅ fix_news_table.sql (2026-06-12 10:33)
  ✅ fix_prayers_and_events.sql (2026-06-15 11:19)

⚠️  Không rõ cái nào được apply vào Supabase:
    - Nếu apply schema_final.sql: SẼ MẤT DỮ LIỆU trong bảng news!
    - Nếu apply schema.sql: OK nhưng không khớp schema_final
```

---

## 🔧 Giải Pháp

### Bước 1: Xác Định Schema Hiện Tại ✅
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%news%';

-- Kiểm tra cột trong bảng news
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'news';
```

### Bước 2: Sửa schema_final.sql (Ngay Bây Giờ!) 🔴
```
Vấn đề: schema_final.sql định nghĩa bảng sai
Giải pháp: 
  1. Đổi tên news_posts → news
  2. Thêm cột thiếu: type, categories, image_url, pdf_url, audio_url
  3. Cập nhật RLS policies cho role Vietnamese
  4. Áp dụng vào Supabase
```

### Bước 3: Cập Nhật RLS Policies
```sql
-- Sửa policy để hỗ trợ cả 'admin' và 'Quản trị viên'
CREATE POLICY "admin_all" ON public.event_registrations FOR ALL 
TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'Admin', 'Quản trị viên')
  )
);
```

### Bước 4: Kiểm Tra Dữ Liệu Đã Đồng Bộ
```
Chạy từ Admin Portal:
  1. Đăng nhập Admin → Kiểm tra số liệu Tổng Quan
  2. Kiểm tra từng Tab: Tin tức, Bài giảng, Sự kiện...
  3. Đánh dấu số record thấy được
```

---

## 📊 So Sánh Dữ Liệu

| Thành Phần | Admin | Ban Điều Hành | Kỳ Vọng |
|-----------|-------|---------------|--------|
| Tin Tức   | ❌ 0 | ✅ N | ✅ N |
| Bài Giảng | ❌ 0 | ✅ N | ✅ N |
| Sự Kiện   | ❌ 0 | ✅ N | ✅ N |
| Cầu Nguyện | ❌ 0 | ✅ N | ✅ N |
| Tín Hữu   | ❌ 0 | ✅ N | ✅ N |

---

## 🛠️ Hành Động Tiếp Theo

### Ưu Tiên 1: NGAY BÂY GIỜ
- [ ] Chạy SQL để kiểm tra bảng hiện tại
- [ ] So sánh với frontend expectations
- [ ] Sửa schema_final.sql

### Ưu Tiên 2: Trong 1 Giờ
- [ ] Cập nhật RLS Policies
- [ ] Kiểm tra role consistency (admin vs Quản trị viên)
- [ ] Apply schema cập nhật

### Ưu Tiên 3: Xác Minh
- [ ] Đăng nhập Admin → Kiểm tra dữ liệu
- [ ] Đăng nhập Ban Điều Hành → Kiểm tra dữ liệu
- [ ] Xác nhận dữ liệu đồng nhất

---

## 📝 Ghi Chú Kỹ Thuật

**File Frontend Tham Chiếu:**
- `src/app/admin/page.tsx` (line 246-344): Fetch functions
- `src/lib/permissions.ts`: Role definitions
- `src/contexts/AuthContext.tsx`: User profile loading

**File Schema Cần Sửa:**
- `supabase/schema_final.sql` ← CHÍNH ← PHẢI SỬA
- `supabase/fix_news_table.sql` ← Đã OK

**Database URL:**
- Check `.env.local` hoặc `.env` file
- Use Supabase CLI: `supabase db list`
