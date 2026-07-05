import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hồ Sơ Cá Nhân',
  description: 'Quản lý hồ sơ cá nhân, đề mục cầu nguyện và cài đặt thông báo của bạn.',
  // Profile page should not be indexed by search engines
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
