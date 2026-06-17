# 🔧 FIX: Policy Already Exists Error

**Ngày:** 2026-06-15  
**Lỗi:** `ERROR: 42710: policy "Public prayers are viewable by everyone." for table "prayers" already exists`  
**Nguyên Nhân:** Policy đã tồn tại từ lần apply schema trước

---

## ✅ GIẢI PHÁP (2 Bước)

### **Bước 1: Chạy Cleanup Script**

RLS Policies cũ phải được xóa trước khi tạo lại.

```
1. Mở file: supabase/cleanup_policies.sql
2. Copy TOÀN BỘ nội dung
3. Supabase SQL Editor → New Query
4. Paste
5. Click "Run"
6. Chờ: "Query executed successfully"
```

**Cái gì bị xóa:**
- Tất cả RLS policies từ bảng: prayers, sermons, news, events, comments, devotionals, donations, storage
- Script này an toàn, chỉ xóa policies mà không xóa dữ liệu

### **Bước 2: Chạy Schema Fix (Updated)**

Schema_fixed.sql đã được cập nhật để thêm `DROP POLICY IF EXISTS` trước mỗi `CREATE POLICY`.

```
1. Mở file: supabase/schema_fixed.sql (version mới)
2. Copy TOÀN BỘ nội dung
3. Supabase SQL Editor → New Query (Tạo query mới)
4. Paste
5. Click "Run"
6. Chờ: "Query executed successfully"
```

---

## 📋 Files Liên Quan

| File | Mục Đích | Cần Chạy |
|------|----------|----------|
| cleanup_policies.sql | Xóa RLS policies cũ | ✅ TRƯỚC |
| schema_fixed.sql | Apply schema mới (updated) | ✅ AFTER |
| QUICK_FIX.md | Hướng dẫn nhanh | 📖 Tham khảo |

---

## 🔍 Cách Hoạt Động

### Trước (Lỗi)
```sql
-- schema_fixed.sql cũ:
CREATE POLICY "Public prayers are viewable by everyone." ON public.prayers ...

-- Nếu policy đã tồn tại:
ERROR: 42710: policy already exists
```

### Sau (Fix)
```sql
-- Step 1: cleanup_policies.sql
DROP POLICY IF EXISTS "Public prayers are viewable by everyone." ON public.prayers;

-- Step 2: schema_fixed.sql (updated)
DROP POLICY IF EXISTS "Public prayers are viewable by everyone." ON public.prayers;
CREATE POLICY "Public prayers are viewable by everyone." ON public.prayers ...

-- Kết quả: ✅ No error
```

---

## ✨ Nâng Cấp schema_fixed.sql

**Cập nhật bao gồm:**
- ✅ DROP POLICY IF EXISTS trước mỗi CREATE POLICY
- ✅ Áp dụng cho TẤT CẢ bảng
- ✅ Áp dụng cho TẤT CẢ policies
- ✅ Áp dụng cho storage buckets

**Dòng mã được thêm:**
```sql
-- Ví dụ: prayers table
DROP POLICY IF EXISTS "Public prayers are viewable by everyone." ON public.prayers;
CREATE POLICY "Public prayers are viewable by everyone." ON public.prayers ...

DROP POLICY IF EXISTS "Users can view own private prayers" ON public.prayers;
CREATE POLICY "Users can view own private prayers" ON public.prayers ...

-- Áp dụng cho tất cả các bảng và tất cả các policies
```

---

## ⚠️ Lưu Ý Quan Trọng

1. **Chạy cleanup_policies.sql TRƯỚC schema_fixed.sql**
   - cleanup xóa policies cũ
   - schema_fixed apply policies mới

2. **Dữ liệu KHÔNG bị xóa**
   - Chỉ policies bị xóa
   - Dữ liệu trong bảng vẫn giữ nguyên
   - RLS chỉ là quy tắc truy cập, không liên quan tới dữ liệu

3. **Tạo New Query cho mỗi script**
   - Cleanup query → Run
   - Schema fix query → Run (tạo query mới)
   - Đừng ghép vào 1 query

---

## 🚀 Tiếp Theo

1. ✅ Chạy cleanup_policies.sql
2. ✅ Chạy schema_fixed.sql (v2)
3. ✅ Clear browser cache (Ctrl+Shift+Delete)
4. ✅ Reload page (F5)
5. ✅ Kiểm tra dữ liệu Admin & Ban Điều Hành

---

## 📞 Hỗ Trợ

| Vấn Đề | Giải Pháp |
|--------|----------|
| Vẫn lỗi "policy already exists" | Chạy cleanup trước schema |
| Xóa sạch policies | Dữ liệu vẫn an toàn, tạo lại policies là đủ |
| Không chắc có done chưa | Chạy: `SELECT policyname FROM pg_policies WHERE tablename = 'news' LIMIT 1;` |

---

**Status:** ✅ Ready to Apply  
**Estimated Time:** 5 minutes  
**Risk Level:** Low (no data loss)
