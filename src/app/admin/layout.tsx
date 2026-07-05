import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản Trị',
  description: 'Trang quản trị nội bộ Hội Thánh R.E.A.C.H Vietnam.',
  // Admin panel must never be indexed
  robots: { index: false, follow: false, nosnippet: true, noarchive: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
