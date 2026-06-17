# 🎯 HƯỚNG DẪN TRUY CẬP VÀ TEST CÁC CHỨC NĂNG MỚI

## 📍 **1. ADMIN DASHBOARD - TẤT CẢ MANAGERS**

### Cách mở:
```
🔗 URL: http://localhost:3000/admin-dashboard
```

### Các tab có sẵn (nhấp vào):
```
📊 Tổng quan          - Dashboard overview
📖 Dưỡng Linh        - Quản lý bài dưỡng linh hàng ngày
🎥 Bài Giảng         - Quản lý bài giảng từ YouTube
📰 Tin Tức           - Quản lý thông báo & tin tức
🙏 Duyệt Cầu Nguyện  - ⭐ MANAGER MỚI (PrayerReviewManager)
💰 Tài Trợ           - ⭐ MANAGER MỚI (DonationsManager)
```

### Mật khẩu admin:
```
💻 Kiểm tra file: .env.local
   hoặc dùng: admin123
```

---

## 🙏 **2. Prayer Review Manager (Duyệt Cầu Nguyện)**

### Mở ở:
```
🔗 URL: http://localhost:3000/admin-dashboard
   → Nhấp tab "🙏 Duyệt Cầu Nguyện"
```

### Chức năng:
```
✅ Tìm kiếm lời cầu nguyện
✅ Lọc theo trạng thái:
   - 🟠 Chờ duyệt (pending)
   - 🔵 Đã duyệt (reviewed)
   - 🟢 Đã trả lời (answered)
   - ⚫ Đóng (closed)

✅ Xem chi tiết mỗi lời cầu:
   - Tên người cầu nguyện
   - Ngôn ngữ cầu nguyện
   - Số người cầu cho
   - Trạng thái riêng tư

✅ Cập nhật trạng thái trực tiếp
✅ Xóa lời cầu không phù hợp
```

### Test thử:
```
1️⃣ Truy cập: http://localhost:3000/admin-dashboard
2️⃣ Đăng nhập bằng password admin
3️⃣ Nhấp tab "🙏 Duyệt Cầu Nguyện"
4️⃣ Xem danh sách lời cầu từ database
5️⃣ Thử sửa trạng thái (pending → reviewed)
6️⃣ Xem thông báo toast ✅
```

---

## 💰 **3. Donations Manager (Quản Lý Tài Trợ)**

### Mở ở:
```
🔗 URL: http://localhost:3000/admin-dashboard
   → Nhấp tab "💰 Tài Trợ"
```

### Chức năng:
```
📊 4 Thẻ Thống Kê:
   1. 💵 Tổng tiền tài trợ (VND)
   2. 📊 Tổng lần tài trợ (count)
   3. 📈 Trung bình mỗi lần (VND)
   4. 🔥 Danh mục phổ biến

🔍 Lọc theo danh mục:
   - 🎁 Tổng quát
   - 🏢 Xây dựng
   - ✝️ Truyền giáo

📅 Lọc theo ngày (Từ - Đến)

📋 Bảng chi tiết:
   - Ngày tài trợ
   - Số tiền (định dạng VND)
   - Danh mục
   - Phương thức thanh toán
   - ID giao dịch
```

### Test thử:
```
1️⃣ Truy cập: http://localhost:3000/admin-dashboard
2️⃣ Đăng nhập bằng password admin
3️⃣ Nhấp tab "💰 Tài Trợ"
4️⃣ Xem thống kê tài chính
5️⃣ Chọn filter danh mục → xem số tiền cập nhật
6️⃣ Chọn date range → xem bảng cập nhật
```

---

## 👤 **4. User Profile Page (Hồ Sơ Người Dùng)**

### Cách mở:
```
🔗 URL: http://localhost:3000/profile
(hoặc nhấp menu → Hồ Sơ khi đã login)
```

### 4 Tabs:

#### 📌 Tab 1: 👤 Hồ Sơ
```
✅ Xem/Sửa thông tin cá nhân:
   - Tên (First/Last)
   - Email (read-only)
   - Điện thoại
   - Địa chỉ
   - Tiểu sử cá nhân

✅ Nút "Sửa hồ sơ" → Bật form
✅ Nút "Lưu" hoặc "Hủy"
✅ Hiển thị thống kê:
   - 🔥 Streak: X ngày
   - 📖 Tổng câu đọc: Y
```

#### ⚙️ Tab 2: Tùy Chỉnh
```
✅ Chế độ: Sáng ☀️ / Tối 🌙
✅ Ngôn ngữ: Tiếng Việt / English
✅ Phiên bản Kinh Thánh:
   - NIV (New International Version)
   - VIE1925 (Kinh Thánh Việt 1925)
   - RVV11 (Rộc Văn Viễn 2011)
   - VIET2010 (Việt 2010)

✅ Checkbox: Bật/Tắt thông báo
✅ Checkbox: Bật/Tắt email notification
✅ Nút "Lưu tùy chỉnh"
```

#### 📖 Tab 3: Lịch Sử
```
✅ Xem thống kê đọc Kinh:
   - Streaks liên tiếp
   - Tổng câu đã đọc
   - Quyển sách yêu thích
   - (Sắp tới: Chi tiết từng ngày)
```

#### 📊 Tab 4: Dữ Liệu
```
✅ Tải xuống dữ liệu (JSON)
   - GDPR compliant
   - Tất cả thông tin cá nhân

✅ Xóa tài khoản
   - ⚠️ Không thể hoàn tác
   - Yêu cầu xác nhận
```

### Test thử:
```
1️⃣ Truy cập: http://localhost:3000/profile
2️⃣ Nếu chưa login → redirect đến /login
3️⃣ Sửa thông tin → Nhấp "Sửa hồ sơ" → Thay đổi → "Lưu"
4️⃣ Chọn tùy chỉnh → Đổi chế độ/ngôn ngữ → "Lưu"
5️⃣ Xem lịch sử → Hiển thị streaks & stats
6️⃣ Tab dữ liệu → Tải JSON hoặc xóa tài khoản
```

---

## 📖 **5. Các Managers Khác (Đã Tồn Tại)**

### DevotionalManager (Dưỡng Linh)
```
🔗 URL: http://localhost:3000/admin-dashboard → Tab "📖 Dưỡng Linh"

✅ Thêm bài dưỡng linh
✅ Sửa bài cũ
✅ Tìm kiếm theo tiêu đề
✅ Xóa bài không cần thiết
```

### SermonManager (Bài Giảng)
```
🔗 URL: http://localhost:3000/admin-dashboard → Tab "🎥 Bài Giảng"

✅ Thêm bài giảng từ YouTube
✅ Nhập link YouTube
✅ Chọn ngày giảng
✅ Ghi âm URL
✅ Sửa/Xóa bài
```

### NewsManager (Tin Tức)
```
🔗 URL: http://localhost:3000/admin-dashboard → Tab "📰 Tin Tức"

✅ Thêm tin tức
✅ Chọn danh mục (Announcements/Events/Testimonies)
✅ Thêm ảnh
✅ Sửa/Xóa tin
```

---

## 🔐 **6. Bảo Mật & Đăng Nhập**

### Admin Password:
```
📍 Tìm ở: .env.local
   NEXT_PUBLIC_ADMIN_PASSWORD=????

hoặc dùng mật khẩu mặc định:
   admin123
```

### Logout:
```
🔗 Trong Admin Dashboard
   Nhấp nút "Đăng xuất" (góc trên phải)
```

---

## 🚀 **7. Chạy Toàn Bộ Hệ Thống**

```bash
# 1. Mở terminal và vào folder dự án
cd "e:\ALBUM\My Project\reach-church"

# 2. Chạy dev server
npm run dev

# 3. Mở trình duyệt - truy cập:
http://localhost:3000

# 4. Điều hướng:
- Home: /
- Admin Dashboard: /admin-dashboard
- Profile: /profile
- Library: /library
- Prayer: /prayer
- News: /news
- Events: /events (coming soon)
```

---

## 📊 **8. Tóm Tắt URL Truy Cập**

| Tính năng | URL | Admin? |
|-----------|-----|--------|
| **Home** | / | ❌ |
| **Bible** | /bible | ❌ |
| **Devotional** | /devotional | ❌ |
| **Library** | /library | ❌ |
| **Prayer** | /prayer | ❌ |
| **News** | /news | ❌ |
| **Profile** | /profile | Sau login |
| **Admin Dashboard** | /admin-dashboard | ✅ Cần password |
| - 📖 Dưỡng Linh | /admin-dashboard (Tab 1) | ✅ |
| - 🎥 Bài Giảng | /admin-dashboard (Tab 2) | ✅ |
| - 📰 Tin Tức | /admin-dashboard (Tab 3) | ✅ |
| - 🙏 Duyệt Cầu | /admin-dashboard (Tab 4) | ✅ |
| - 💰 Tài Trợ | /admin-dashboard (Tab 5) | ✅ |

---

## ✅ **9. Kiểm tra kết quả**

```bash
# Xác nhận các file được tạo:
ls -la "src/components/admin/PrayerReviewManager.tsx"
ls -la "src/components/admin/DonationsManager.tsx"
ls -la "src/app/profile/page.tsx"
ls -la "src/app/admin-dashboard/page.tsx"

# Chạy TypeScript check:
npm run build

# Chạy test:
npm run test
```

---

## 💡 **10. Câu Hỏi Thường Gặp**

**Q: Admin password ở đâu?**
A: File `.env.local` hoặc dùng `admin123`

**Q: Tôi không thấy dữ liệu cầu nguyện?**
A: Dữ liệu từ Supabase, phải có user tạo cầu nguyện trước

**Q: Tôi không thấy tài trợ?**
A: Admin tự thêm hoặc người dùng tạo qua API

**Q: Profile page không hiển thị?**
A: Cần đăng nhập trước (sẽ redirect đến /login)

**Q: Làm sao để test mật khẩu admin?**
A: Truy cập `/admin-dashboard` → nhập password → "Đăng nhập"

---

## 🎯 **Bước tiếp theo (sau khi test)**

```
1. ✅ Kiểm tra Admin Dashboard hoạt động
2. ✅ Test Prayer Review Manager
3. ✅ Test Donations Manager
4. ✅ Test User Profile Page
5. 📝 Tích hợp vào các trang khác (optional)
6. 📝 Hoàn chỉnh E2E tests
7. 🚀 Deploy lên server
```

---

**Made with ❤️ for REACH Church Vietnam**
