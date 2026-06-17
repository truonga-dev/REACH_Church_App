# BÁO CÁO DỰ ÁN: R.E.A.C.H Church Vietnam

**Ngày báo cáo:** 13/06/2026  
**Tên dự án:** R.E.A.C.H Church Vietnam Web Application  
**Phiên bản:** 0.1.0  
**Trạng thái:** Đang phát triển

---

## 1. Tóm tắt dự án

R.E.A.C.H Church Vietnam là ứng dụng web phục vụ cộng đồng Hội Thánh R.E.A.C.H Vietnam. Hệ thống được xây dựng theo hướng mobile-first, hỗ trợ truy cập nhanh trên điện thoại, đồng thời có thể cài đặt như một PWA để sử dụng gần giống ứng dụng native.

Mục tiêu của dự án là tạo một nền tảng tập trung cho sinh hoạt thuộc linh, tin tức, Kinh Thánh, thư viện tài liệu, cầu nguyện và quản trị nội dung của Hội Thánh.

## 2. Mục tiêu

- Cung cấp trải nghiệm đọc Kinh Thánh tiếng Việt thuận tiện.
- Kết nối người dùng với nội dung thuộc linh, bài giảng và tin tức của Hội Thánh.
- Hỗ trợ gửi nhu cầu cầu nguyện và quản lý hồ sơ cá nhân.
- Tạo không gian quản trị nội dung cho ban điều hành và quản trị viên.
- Tối ưu cho thiết bị di động, dễ sử dụng và dễ mở rộng.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19 |
| Ngôn ngữ | TypeScript |
| Backend / Database | Supabase |
| Icon | Lucide React |
| Editor nội dung | react-quill-new |
| PWA | next-pwa |
| Kiểm tra mã | ESLint, Jest |
| Package manager | npm |

## 4. Chức năng chính

### 4.1 Trang người dùng

- `Trang chủ` (`/`): hiển thị bản tin, sự kiện, bài giảng, dưỡng linh và thông báo nổi bật.
- `Kinh Thánh` (`/bible`): đọc Kinh Thánh tiếng Việt theo sách, chương và câu.
- `Thư viện` (`/library`): tra cứu tài liệu PDF, sách nói và video.
- `Mục vụ` (`/ministry`): giới thiệu các ban ngành và hoạt động mục vụ.
- `Hồ sơ` (`/profile`): quản lý thông tin cá nhân và một số thiết lập người dùng.
- `Cầu nguyện` (`/prayer`): gửi và theo dõi nhu cầu cầu nguyện.
- `Dưỡng linh` (`/devotional`): xem nội dung dưỡng linh chi tiết.
- `Tin tức` (`/news/[id]`): xem nội dung chi tiết của một bài viết.
- `Đăng nhập / Đăng ký` (`/login`, `/register`): xác thực người dùng qua Supabase Auth.

### 4.2 Trang quản trị

- `Admin` (`/admin`): quản lý bài giảng, tin tức, tài liệu, dưỡng linh, sự kiện, tín hữu và nhu cầu cầu nguyện.
- Các thành phần quản trị được tách riêng trong `src/components/admin/` để dễ bảo trì và mở rộng.

### 4.3 API nội bộ

- `GET /api/bible`: trả về câu Kinh Thánh từ dữ liệu JSON trong `public/bible_vie1925.json`, có cơ chế dự phòng sang `public/bible_vie.json`.
- `POST /api/notifications`: gửi thông báo đẩy qua OneSignal.
- `POST /api/notifications/send`: endpoint phụ trợ cho chức năng gửi thông báo.

## 5. Kiến trúc hệ thống

Ứng dụng được tổ chức theo mô hình tách lớp rõ ràng:

- `src/app/`: các trang và API route theo App Router của Next.js.
- `src/components/`: thành phần giao diện dùng lại.
- `src/lib/`: logic nghiệp vụ, truy xuất dữ liệu và tiện ích.
- `src/contexts/`: quản lý trạng thái dùng chung như xác thực.
- `supabase/`: file schema và script hỗ trợ cơ sở dữ liệu.
- `public/`: tài nguyên tĩnh, ảnh, manifest và dữ liệu Kinh Thánh.

Luồng hoạt động chính:

1. Người dùng truy cập giao diện web hoặc PWA.
2. Ứng dụng gọi dữ liệu từ Supabase hoặc API nội bộ.
3. Dữ liệu được xử lý ở `src/lib/` và hiển thị qua các page/component.
4. Quản trị viên sử dụng trang admin để tạo, sửa, xoá nội dung.

## 6. Cơ sở dữ liệu và lưu trữ

Hệ thống sử dụng Supabase làm backend chính. Dữ liệu tập trung vào các nhóm:

- Người dùng và hồ sơ cá nhân.
- Bài giảng, tin tức, dưỡng linh và sự kiện.
- Nhu cầu cầu nguyện và phản hồi liên quan.
- Tài liệu media như PDF, audio, video.
- Dữ liệu Kinh Thánh được lưu dưới dạng JSON trong `public/`.

## 7. Các tính năng kỹ thuật nổi bật

- Hỗ trợ PWA, có thể cài lên màn hình chính.
- Giao diện tiếng Việt và tối ưu cho thiết bị di động.
- Tích hợp OneSignal cho thông báo đẩy.
- Hệ thống phân tách logic rõ ràng giữa UI, nghiệp vụ và dữ liệu.
- Có bộ kiểm thử bằng Jest cho một số module nghiệp vụ quan trọng.
- Có các tiện ích hỗ trợ như tìm kiếm Kinh Thánh, chia sẻ nội dung, theo dõi tiến trình đọc.

## 8. Kiểm thử và chất lượng mã

Trong dự án đã có:

- `jest.config.js` và `jest.setup.js` để cấu hình môi trường kiểm thử.
- Các file test trong `src/lib/__tests__/` cho một số luồng nghiệp vụ.
- `eslint.config.mjs` để kiểm tra chất lượng mã nguồn.

Điều này cho thấy dự án đã có nền tảng kiểm thử cơ bản, phù hợp cho quá trình phát triển tiếp theo.

## 9. Hướng triển khai

Môi trường triển khai phù hợp nhất là các nền tảng hỗ trợ Next.js như Vercel. Quy trình triển khai cơ bản:

1. Cấu hình biến môi trường Supabase và OneSignal.
2. Chạy kiểm tra mã và build dự án.
3. Deploy lên môi trường production.
4. Kiểm tra lại các chức năng đăng nhập, đọc Kinh Thánh, gửi cầu nguyện và admin.

## 10. Kết luận

R.E.A.C.H Church Vietnam là một ứng dụng web định hướng cộng đồng, kết hợp nội dung thuộc linh, quản trị hội thánh và trải nghiệm người dùng hiện đại. Dự án đã có cấu trúc rõ ràng, công nghệ phù hợp và nền tảng tốt để tiếp tục hoàn thiện thêm các chức năng nâng cao trong các giai đoạn sau.

## 11. Hướng phát triển tiếp theo

| Hướng | Trạng thái | Ghi chú |
|---|---|---|
| Hoàn thiện luồng quản trị nội dung | ✅ ~80% | Đầy đủ 12 module: tin tức, bài giảng, sự kiện, mục vụ, dưỡng linh, thư viện, cầu nguyện, dâng hiến, tín hữu |
| Mở rộng thông báo & đồng bộ dữ liệu | ✅ ~70% | OneSignal tích hợp qua `/api/notifications` và `/api/notifications/send` |
| Nâng cấp báo cáo thống kê cho admin | ✅ 100% | Biểu đồ cột/đường/tròn SVG, bảng dữ liệu theo tháng, export CSV & JSON, lọc 7d/30d/3th/1năm, hoạt động gần đây |
| Tối ưu hiệu năng & PWA | ✅ ~70% | `next-pwa` đã cấu hình, có manifest & Service Worker |
| Bổ sung test cho các module | ⚠️ ~20% | Framework Jest sẵn sàng, cần bổ sung thêm test |

## 12. Hệ thống phân quyền (RBAC)

Được triển khai trong `src/lib/permissions.ts` với **3 cấp vai trò**:

### Vai trò & Quyền hạn

| Vai trò | Màu | Quyền |
|---|---|---|
| 🛡️ **Quản trị viên** | Xanh `#48BCE1` | Toàn quyền: quản lý nội dung + tín hữu + phân quyền + cài đặt hệ thống |
| ✍️ **Ban điều hành** | Vàng `#F4CC30` | Quản lý nội dung (CRUD), xem danh sách tín hữu, duyệt cầu nguyện, xem dâng hiến |
| 🙏 **Thành viên** | Xám `#aaa` | Chỉ dùng tính năng người dùng thông thường, không có quyền vào Admin |

### Các quyền theo nhóm

- **Nội dung**: view, create, edit, delete, publish
- **Bài giảng**: view, create, edit, delete
- **Sự kiện**: view, create, edit, delete
- **Mục vụ**: view, create, edit, delete
- **Dưỡng linh**: view, create, edit, delete
- **Thư viện**: view, create, edit, delete
- **Cầu nguyện**: view, review, delete
- **Dâng hiến**: view, manage
- **Tín hữu**: view, edit, delete, assign_role *(chỉ Quản trị viên)*
- **Hệ thống**: stats:view, notifications:send, admin:access, admin:settings

### Cách hoạt động

1. Quyền được check qua `hasPermission(role, permission)` từ `src/lib/permissions.ts`
2. `AuthContext` expose `can(permission)` và `isAdmin` để dùng trong component
3. Sidebar Admin tự động ẩn/hiện tab theo quyền của user đang đăng nhập
4. `UserManager` có bảng phân quyền trực quan và guard không cho non-admin assign_role
5. **Ban điều hành** có thể đăng nhập Admin nhưng không thấy tab Cài đặt và không thể phân quyền tín hữu
