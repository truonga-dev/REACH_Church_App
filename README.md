# R.E.A.C.H Church Vietnam

Ứng dụng web di động dành cho **Hội Thánh R.E.A.C.H Vietnam** — nền tảng dưỡng linh, kết nối cộng đồng và truy cập tài nguyên hội thánh mọi lúc, mọi nơi.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)

**Repository:** [github.com/truonga-dev/REACH_Church_App](https://github.com/truonga-dev/REACH_Church_App)

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt & chạy dự án](#cài-đặt--chạy-dự-án)
- [Biến môi trường](#biến-môi-trường)
- [Các lệnh thường dùng](#các-lệnh-thường-dùng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Triển khai](#triển-khai)
- [Đóng góp](#đóng-góp)

---

## Giới thiệu

**R.E.A.C.H Church Vietnam** là ứng dụng web được thiết kế theo hướng **mobile-first**, giúp tín hữu và khách thăm:

- Cập nhật bản tin, sự kiện và bài giảng của hội thánh
- Đọc Kinh Thánh tiếng Việt trực tuyến
- Theo dõi chương trình dưỡng linh hàng ngày
- Theo dõi các Livestream trực tiếp trên hệ thống
- Khám phá các ban ngành và mục vụ
- Gửi nhu cầu cầu nguyện và quản lý hồ sơ cá nhân

Ứng dụng hỗ trợ **PWA** (Progressive Web App), có thể cài đặt lên màn hình điện thoại như app native và hỗ trợ **Push Notifications** qua OneSignal.

---

## Tính năng

### Trang người dùng

| Trang | Đường dẫn | Mô tả |
| ----- | --------- | ----- |
| **Trang chủ** | `/` | Bản tin, sự kiện sắp tới, bài giảng, dưỡng linh, thông báo |
| **Kinh Thánh** | `/bible` | Đọc Kinh Thánh tiếng Việt theo sách & chương |
| **Thư viện** | `/library` | Tài liệu PDF, sách nói, video (tích hợp Supabase) |
| **Mục vụ** | `/ministry` | Danh sách các ban ngành và hoạt động mục vụ |
| **Hồ sơ** | `/profile` | Thông tin cá nhân, lịch sử quyên góp, đề mục cầu nguyện |
| **Quyên góp** | `/donate` | Dâng hiến qua QR tĩnh, chuyển khoản thủ công kèm biên lai, tích hợp cổng thanh toán PayOS |
| **Cầu nguyện** | `/prayer` | Gửi nhu cầu cầu nguyện đến ban cầu nguyện |
| **Dưỡng linh** | `/devotional` | Bài đọc dưỡng linh chi tiết, chia sẻ |
| **Tin tức** | `/news` | Bản tin / thông báo hội thánh |
| **Sự kiện** | `/events` | Lịch trình và đăng ký các sự kiện sắp tới |
| **Nhóm nhỏ** | `/groups` | Thông tin về các nhóm tế bào, đăng ký tham gia |
| **Trực tuyến** | `/live` | Xem phát trực tiếp bài giảng và sự kiện (Tự động hiển thị nút Live khi có sự kiện trực tiếp) |
| **Tài khoản** | `/login`, `/register` | Xác thực người dùng qua Supabase |

### Quản trị

| Trang | Đường dẫn | Mô tả |
| ----- | --------- | ----- |
| **Admin Panel** | `/admin` | CMS quản lý bài giảng, sách nói, PDF, dưỡng linh, sự kiện, tín hữu, cầu nguyện, quản lý người dùng. Tích hợp giao diện quản lý Livestream và Lịch sử Dâng hiến. |
| **Thiết lập Admin** | `/setup-admin` | Công cụ gán quyền admin cho tài khoản (chỉ dùng cục bộ/dev) |

### API nội bộ & Webhooks

| Endpoint | Mô tả |
| -------- | ----- |
| `GET /api/bible` | Trả về các câu Kinh Thánh từ file JSON |
| `POST /api/donations/create-payment` | Xử lý tạo thanh toán PayOS |
| `POST /api/donations/webhook` | Webhook tự động nhận xác nhận thanh toán từ PayOS |

### Điều hướng & Thiết kế

- **Bottom Navigation** cố định 5 tab: Trang chủ · Kinh Thánh · Thư viện · Mục vụ · Hồ sơ (Tự động chuyển tab Live khi có sự kiện trực tiếp).
- Giao diện tiếng Việt (`lang="vi"`) chuẩn SEO và Meta Tags.
- Màu chủ đạo: `#48BCE1` (REACH Blue) ở chế độ Dark Mode.

---

## Công nghệ sử dụng

| Hạng mục | Công nghệ |
| -------- | --------- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router + Turbopack) |
| UI Library | [React 19](https://react.dev/) |
| Ngôn ngữ | [TypeScript 5](https://www.typescriptlang.org/) |
| Backend / Database | [Supabase](https://supabase.com/) (PostgreSQL + RLS) |
| Payment Gateway | [PayOS](https://payos.vn/) |
| Push Notification | [OneSignal](https://onesignal.com/) |
| Form Validation | Zod |
| Icons | [Lucide React](https://lucide.dev/) |
| Rich Text Editor | react-quill-new (trang Admin) |
| PWA | next-pwa |

---

## Yêu cầu hệ thống

- **Node.js** 20 trở lên
- **npm** 10 trở lên
- Tài khoản **Supabase** (URL + Anon Key)
- Tài khoản **PayOS** (Client ID, API Key, Checksum Key)
- Tài khoản **OneSignal** (App ID, API Key)

---

## Cài đặt & chạy dự án

### 1. Clone repository

```bash
git clone https://github.com/truonga-dev/REACH_Church_App.git
cd REACH_Church_App
```

### 2. Cài đặt dependencies

```bash
npm install --legacy-peer-deps
```

> Dùng `--legacy-peer-deps` vì `react-quill` chưa hỗ trợ đầy đủ React 19.

### 3. Cấu hình biến môi trường

```bash
cp .env.example .env.local
```

Điền các giá trị Supabase, PayOS và OneSignal vào `.env.local` (xem mục [Biến môi trường](#biến-môi-trường)).

### 4. Thiết lập Database (Supabase)

Khởi tạo và đồng bộ các cấu trúc bảng (Migrations) lên Supabase:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_ID>
npx supabase db push
```

### 5. Chạy server phát triển

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## Biến môi trường

Các biến môi trường bắt buộc trong `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PayOS (Dành cho chức năng Dâng hiến)
NEXT_PUBLIC_PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key

# OneSignal (Push Notifications)
NEXT_PUBLIC_ONESIGNAL_APP_ID=your-app-id
ONESIGNAL_REST_API_KEY=your-api-key
```

> **Lưu ý:** File `.env.local` **không** được commit lên GitHub. 

---

## Các lệnh thường dùng

| Lệnh | Mô tả |
| ---- | ----- |
| `npm run dev` | Chạy server dev (lắng nghe `0.0.0.0:3000`) |
| `npm run build` | Build phiên bản production (Chuẩn bị deploy) |
| `npm run start` | Chạy bản build production |
| `npm run lint` | Kiểm tra code với ESLint & TypeScript |
| `npx supabase db push` | Đẩy cấu trúc Database Migration lên Server |

---

## Triển khai

Nền tảng khuyến nghị: [Vercel](https://vercel.com/)

1. Push code lên GitHub
2. Import repository vào Vercel
3. Thêm toàn bộ các biến môi trường (`.env.local`) trong Project Settings
4. Bấm Deploy
5. *(Tuỳ chọn)* Đăng ký đường dẫn Webhook tại `my.payos.vn`: `https://<ten-mien-cua-ban>.vercel.app/api/donations/webhook`

PWA sẽ tự kích hoạt ở môi trường production (`next-pwa`).

---

> Dự án thuộc sở hữu riêng của R.E.A.C.H Church Vietnam. Không sao chép hoặc phân phối trái phép.
