# ⚡ QUICK FIX - GỌI NGAY

**Vấn Đề:** Admin không thấy dữ liệu, Ban Điều Hành có dữ liệu  
**Thời gian:** ~5-10 phút để fix  
**Độ Ưu Tiên:** 🔴 NGAY BÂY GIỜ

---

## 🎯 GIẢI PHÁP NHANH (5 Bước)

### **BƯỚC 1: Mở Supabase Dashboard**
```
1. Truy cập: https://supabase.com/dashboard
2. Chọn project REACH Church
3. Click → SQL Editor
4. Click → New Query
```

### **BƯỚC 2: Chạy Cleanup Script (Copy-Paste)**

**⚠️ QUAN TRỌNG:** Bước này xóa các RLS policies cũ để tránh lỗi "policy already exists"

```
1. Mở file: supabase/cleanup_policies.sql
2. Copy TOÀN BỘ nội dung
3. Supabase SQL Editor → New Query
4. Paste
5. Click "Run"
6. Chờ message: "Query executed successfully"
```

### **BƯỚC 3: Áp Dụng Fix (Copy-Paste)**

```
1. Mở file: supabase/schema_fixed.sql (đã cập nhật)
2. Copy TOÀN BỘ nội dung
3. Supabase SQL Editor → New Query (Tạo query mới)
4. Paste
5. Click "Run"
6. Chờ message: "Query executed successfully"
```

---

### **BƯỚC 4: Xóa Cache & Tải Lại**

```
1. Trên trình duyệt:
   - Nhấn F12 (DevTools)
   - Xóa checkbox "Disable cache" (nếu checked)
   - Click chuột phải trên Reload button → "Empty cache and hard reload"
   
2. Hoặc: Ctrl+Shift+Delete → Clear browsing data
   - ✅ Cookies
   - ✅ Cached images and files
```

### **BƯỚC 5: Kiểm Tra Kết Quả**

| Mục | Kiểm Tra | Kết Quả Mong Đợi |
|-----|----------|-----------------|
| Admin Panel | Tổng quan | Thấy số liệu > 0 |
| Admin Panel | Tin Tức | Thấy dữ liệu |
| Admin Panel | Bài Giảng | Thấy dữ liệu |
| Admin Panel | Sự Kiện | Thấy dữ liệu |
| Admin Panel | Cầu Nguyện | Thấy dữ liệu |
| Ban Điều Hành | Tất cả | Dữ liệu giống Admin |
| DevTools | Console | Không có lỗi đỏ |

✅ Nếu tất cả OK → **HOÀN THÀNH**

---

## 🚨 Nếu Vẫn KHÔNG OK

### ❌ Admin vẫn không thấy dữ liệu

**Kiểm tra:**
```sql
-- 1. Đếm dữ liệu
SELECT COUNT(*) FROM public.news;

-- 2. Check RLS
SELECT policyname, permissive FROM pg_policies 
WHERE tablename = 'news';

-- 3. Check role của admin
SELECT role FROM public.profiles 
WHERE email = 'admin-email@example.com';
```

**Nếu count > 0 nhưng RLS permissive = false:**
```sql
-- Sửa RLS
DROP POLICY IF EXISTS "Public news are viewable by everyone." ON public.news;
CREATE POLICY "Public news are viewable by everyone." ON public.news 
FOR SELECT USING (true);
```

**Nếu role không phải 'Quản trị viên':**
```sql
-- Sửa role
UPDATE public.profiles 
SET role = 'Quản trị viên' 
WHERE email = 'admin-email@example.com';
```

### ❌ Frontend Error 500

**Kiểm tra:**
1. DevTools (F12) → Network tab
2. Tìm request đỏ (error)
3. Click vào → Response tab → Xem thông báo lỗi

**Lỗi thường gặp:**
```
"relation 'public.news' does not exist"
→ Chạy lại schema_fixed.sql

"column 'type' does not exist"
→ Chạy ALTER TABLE ADD COLUMN

"permission denied"
→ Cập nhật RLS policies
```

### ❌ Dữ liệu cũ biến mất

**Khôi Phục:**
```sql
-- Nếu tạo backup ở Bước 2
SELECT * FROM public.news_backup;

-- Khôi phục
INSERT INTO public.news
SELECT * FROM public.news_backup
ON CONFLICT DO NOTHING;
```

---

## 📞 Hỗ Trợ Nhanh

| Vấn Đề | Fix |
|--------|-----|
| "Table not found" | Chạy schema_fixed.sql |
| "Column not found" | Chạy ALTER TABLE ADD COLUMN |
| "Permission denied" | Cập nhật RLS DROP + CREATE |
| Dữ liệu trống | Kiểm tra có dữ liệu trong news_posts không |
| Frontend Error | Clear cache + Reload |
| Role sai | UPDATE profiles SET role |

---

## ✅ Verification Commands

**Chạy các query này để xác nhận fix:**

```sql
-- 1. Kiểm tra bảng news tồn tại
SELECT COUNT(*) as total_records FROM public.news;

-- 2. Kiểm tra cột có đủ
SELECT COUNT(*) as has_type_column FROM information_schema.columns
WHERE table_name = 'news' AND column_name = 'type';

-- 3. Kiểm tra RLS hoạt động
SELECT * FROM public.news LIMIT 1;

-- 4. Kiểm tra role
SELECT DISTINCT role FROM public.profiles WHERE role IS NOT NULL;
```

**Tất cả trả về > 0 → ✅ OK**

---

## 📝 Ghi Chú

- **Không xóa bảng cũ** cho đến khi chắc chắn schema mới OK
- **Luôn backup** trước khi chạy DROP/ALTER
- **Clear cache browser** sau mỗi lần thay đổi schema
- **Test trên Admin trước** rồi mới check Ban Điều Hành

---

## 🎯 Kết Quả Cuối Cùng

✅ Admin thấy dữ liệu = Ban Điều Hành  
✅ Không có lỗi trong console  
✅ Tất cả tab có dữ liệu  
✅ Dữ liệu đồng bộ giữa 2 role

---

**Chúc may mắn! 🚀**

Nếu còn lỗi → Xem [TECHNICAL_ANALYSIS.md](TECHNICAL_ANALYSIS.md) hoặc [FIX_GUIDE.md](FIX_GUIDE.md)
