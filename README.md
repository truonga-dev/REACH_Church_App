# REACH Church App

Ứng dụng web dành cho **REACH Church** — nền tảng số giúp hội thánh kết nối, chia sẻ thông tin và mang trải nghiệm mượt mà trên mọi thiết bị.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

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

**REACH Church App** là dự án ứng dụng web chính thức của REACH Church, được xây dựng trên nền tảng [Next.js App Router](https://nextjs.org/docs/app) và TypeScript.

Dự án đang trong giai đoạn phát triển ban đầu, tập trung thiết lập kiến trúc nền tảng và quy trình làm việc. Trong tương lai, ứng dụng sẽ hỗ trợ các tính năng phục vụ cộng đồng hội thánh như thông báo, sự kiện, thư viện media và tài nguyên dành cho thành viên.

---

## Tính năng

### Hiện có

- Next.js 16 App Router kết hợp React 19
- TypeScript — code an toàn, dễ bảo trì
- ESLint — kiểm tra chất lượng mã nguồn
- Font tối ưu qua `next/font`
- Cấu hình môi trường qua file `.env.local` (không đẩy lên Git)

### Dự kiến phát triển

- Trang chủ và thông tin nhà thờ
- Sự kiện & thông báo
- Thư viện bài giảng / media
- Tài nguyên thành viên & form liên hệ
- Quản trị nội dung (admin)

---

## Công nghệ sử dụng

| Hạng mục        | Công nghệ |
| --------------- | --------- |
| Framework       | [Next.js 16](https://nextjs.org/) |
| Thư viện UI     | [React 19](https://react.dev/) |
| Ngôn ngữ        | [TypeScript 5](https://www.typescriptlang.org/) |
| Kiểm tra code   | ESLint + `eslint-config-next` |
| Quản lý gói     | npm |

---

## Yêu cầu hệ thống

- **Node.js** 20 trở lên — [nodejs.org](https://nodejs.org/)
- **npm** 10 trở lên (đi kèm Node.js)
- **Git** — [git-scm.com](https://git-scm.com/)

---

## Cài đặt & chạy dự án

### 1. Clone repository

```bash
git clone https://github.com/truonga-dev/REACH_Church_App.git
cd REACH_Church_App
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

```bash
cp .env.example .env.local
```

Chỉnh sửa `.env.local` theo môi trường của bạn. Chi tiết xem mục [Biến môi trường](#biến-môi-trường).

> **Lưu ý:** Không bao giờ commit file `.env.local` hoặc bất kỳ file nào chứa secret. Các file này đã được loại trừ trong `.gitignore`.

### 4. Chạy server phát triển

```bash
npm run dev
```

Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).

---

## Biến môi trường

Sao chép `.env.example` thành `.env.local` và điền giá trị phù hợp.

| Biến | Mô tả | Bắt buộc |
| ---- | ----- | -------- |
| — | Bổ sung thêm khi dự án phát triển | — |

File `.env.local` chỉ dùng trên máy local và **không** được đẩy lên GitHub.

---

## Các lệnh thường dùng

| Lệnh | Mô tả |
| ---- | ----- |
| `npm run dev` | Chạy server phát triển |
| `npm run build` | Build phiên bản production |
| `npm run start` | Chạy bản build production trên local |
| `npm run lint` | Kiểm tra code với ESLint |

---

## Cấu trúc thư mục

```
reach-church/
├── public/              # Tài nguyên tĩnh (hình ảnh, icon)
├── src/
│   └── app/             # Trang & layout (Next.js App Router)
│       ├── layout.tsx   # Layout gốc và metadata
│       ├── page.tsx     # Trang chủ
│       └── globals.css  # CSS toàn cục
├── .env.example         # Mẫu biến môi trường (được commit)
├── .gitignore           # Quy tắc loại trừ file khỏi Git
├── eslint.config.mjs    # Cấu hình ESLint
├── next.config.ts       # Cấu hình Next.js
├── package.json         # Dependencies và scripts
└── tsconfig.json        # Cấu hình TypeScript
```

---

## Triển khai

Nền tảng được khuyến nghị cho Next.js là [Vercel](https://vercel.com/):

1. Push code lên GitHub
2. Import repository vào Vercel
3. Thêm biến môi trường trong cài đặt dự án
4. Deploy

Xem thêm [tài liệu triển khai Next.js](https://nextjs.org/docs/app/building-your-application/deploying).

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

> Dự án thuộc sở hữu riêng của REACH Church. Không sao chép hoặc phân phối trái phép.
