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
- [Liên hệ](#liên-hệ)

---

## Giới thiệu

**R.E.A.C.H Church Vietnam** là ứng dụng web được thiết kế theo hướng **mobile-first**, giúp tín hữu và khách thăm:

- Cập nhật bản tin, sự kiện và bài giảng của hội thánh
- Đọc Kinh Thánh tiếng Việt trực tuyến
- Theo dõi chương trình dưỡng linh hàng ngày
- Khám phá các ban ngành và mục vụ
- Gửi nhu cầu cầu nguyện và quản lý hồ sơ cá nhân

Ứng dụng hỗ trợ **PWA** (Progressive Web App), có thể cài đặt lên màn hình điện thoại như app native.

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
| **Quyên góp** | `/donate` | Dâng hiến qua QR tĩnh, chuyển khoản thủ công kèm biên lai, tích hợp PayOS |
| **Cầu nguyện** | `/prayer` | Gửi nhu cầu cầu nguyện đến ban cầu nguyện |
| **Dưỡng linh** | `/devotional` | Bài đọc dưỡng linh chi tiết, chia sẻ |
| **Tin tức** | `/news/[id]` | Chi tiết bản tin / thông báo |
| **Sự kiện** | `/events` | Lịch trình và đăng ký các sự kiện sắp tới |
| **Nhóm nhỏ** | `/groups` | Thông tin về các nhóm tế bào, đăng ký tham gia |
| **Trực tuyến** | `/live` | Xem phát trực tiếp bài giảng và sự kiện |
| **Tài khoản** | `/login`, `/register` | Xác thực người dùng qua Supabase |

### Quản trị

| Trang | Đường dẫn | Mô tả |
| ----- | --------- | ----- |
| **Admin** | `/admin` | Quản lý bài giảng, sách nói, PDF, dưỡng linh, sự kiện, tín hữu, cầu nguyện |
| **Thiết lập Admin** | `/setup-admin` | Công cụ gán quyền admin cho tài khoản (chỉ dùng cục bộ/dev) |

### API nội bộ

| Endpoint | Mô tả |
| -------- | ----- |
| `GET /api/bible` | Trả về các câu Kinh Thánh từ file JSON |
| `POST /api/donations/create-payment` | Xử lý tạo thanh toán PayOS / Chuyển khoản |
| `POST /api/donations/upload-receipt` | Upload biên lai thanh toán thủ công |
| `POST /api/webhooks/payos` | Nhận webhook trạng thái từ PayOS |

### Điều hướng

- **Bottom Navigation** cố định 5 tab: Trang chủ · Kinh Thánh · Thư viện · Mục vụ · Hồ sơ
- Giao diện tiếng Việt (`lang="vi"`)
- Màu chủ đạo: `#48BCE1` (REACH Blue)

---

## Công nghệ sử dụng

| Hạng mục | Công nghệ |
| -------- | --------- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router + Turbopack) |
| UI Library | [React 19](https://react.dev/) |
| Ngôn ngữ | [TypeScript 5](https://www.typescriptlang.org/) |
| Backend / Database | [Supabase](https://supabase.com/) |
| Payment Gateway | [PayOS](https://payos.vn/) |
| Error Tracking | [Sentry](https://sentry.io/) |
| Push Notification | [OneSignal](https://onesignal.com/) |
| Form Validation | Zod |
| Testing | Jest, React Testing Library |
| Icons | [Lucide React](https://lucide.dev/) |
| Rich Text Editor | react-quill-new (trang Admin) |
| PWA | next-pwa |
| Package Manager | npm |

---

## Yêu cầu hệ thống

- **Node.js** 20 trở lên — [nodejs.org](https://nodejs.org/)
- **npm** 10 trở lên
- **Git** — [git-scm.com](https://git-scm.com/)
- Tài khoản **Supabase** (URL + Anon Key)

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

Điền các giá trị Supabase vào `.env.local` (xem mục [Biến môi trường](#biến-môi-trường)).

### 4. Chạy server phát triển

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## Biến môi trường

| Biến | Mô tả | Bắt buộc |
| ---- | ----- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL dự án Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / public key Supabase | ✅ |

Ví dụ trong `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

> **Lưu ý:** File `.env.local` **không** được commit lên GitHub. Chỉ `.env.example` (mẫu trống) được đưa vào repo.

---

## Các lệnh thường dùng

| Lệnh | Mô tả |
| ---- | ----- |
| `npm run dev` | Chạy server dev (lắng nghe `0.0.0.0:3000`) |
| `npm run build` | Build phiên bản production |
| `npm run start` | Chạy bản build production |
| `npm run lint` | Kiểm tra code với ESLint |

---

## Cấu trúc thư mục

```text
reach-church/
├── public/
│   ├── logo.png              # Logo hội thánh
│   ├── manifest.json         # Cấu hình PWA
│   └── bible_vie.json        # Dữ liệu Kinh Thánh tiếng Việt
├── src/
│   ├── app/                  # Chứa toàn bộ các trang giao diện & API nội bộ
│   ├── components/           # Các component dùng chung (BottomNav, UI, ...)
│   └── lib/                  # Tiện ích, cấu hình Supabase, etc.
├── .env.example              # Mẫu biến môi trường
├── .gitignore
├── Dockerfile                # Cấu hình Docker build
├── docker-compose.yml        # Cấu hình Docker compose
├── eslint.config.mjs         # Cấu hình ESLint
├── jest.config.js            # Cấu hình Unit Tests (Jest)
├── next.config.mjs           # Cấu hình Next.js + PWA + Sentry
├── package.json              # Khai báo thư viện & scripts
├── sentry.*.config.ts        # Các file cấu hình Sentry (Client/Edge/Server)
└── tsconfig.json             # Cấu hình TypeScript
```

---

## Triển khai

Nền tảng khuyến nghị: [Vercel](https://vercel.com/)

1. Push code lên GitHub
2. Import repository vào Vercel
3. Thêm biến môi trường Supabase trong Project Settings
4. Deploy

PWA sẽ tự kích hoạt ở môi trường production (`next-pwa`).

---

## Đóng góp

Dự án thuộc REACH Church. Nếu bạn là thành viên team:

1. Tạo branch mới từ `main`
2. Thực hiện thay đổi và chạy `npm run lint`
3. Commit với message rõ ràng
4. Tạo Pull Request để review

---

## Liên hệ

**Repository:** [github.com/truonga-dev/REACH_Church_App](https://github.com/truonga-dev/REACH_Church_App)

Mọi thắc mắc về dự án, vui lòng liên hệ team phát triển REACH Church.

---

> Dự án thuộc sở hữu riêng của R.E.A.C.H Church Vietnam. Không sao chép hoặc phân phối trái phép.
