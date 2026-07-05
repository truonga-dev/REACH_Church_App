import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng Nhập',
  description: 'Đăng nhập vào ứng dụng Hội Thánh R.E.A.C.H Vietnam.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
