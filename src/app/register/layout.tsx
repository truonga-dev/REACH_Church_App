import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng Ký Tài Khoản',
  description: 'Tạo tài khoản mới để tham gia cộng đồng Hội Thánh R.E.A.C.H Vietnam.',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
