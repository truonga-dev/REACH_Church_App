import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sự Kiện',
  description:
    'Các sự kiện, chương trình và hoạt động sắp tới của Hội Thánh R.E.A.C.H Vietnam. Đăng ký tham dự và không bỏ lỡ bất kỳ sự kiện nào.',
  keywords: ['sự kiện', 'events', 'chương trình', 'hội thánh', 'REACH Church', 'đăng ký'],
  openGraph: {
    title: 'Sự Kiện | R.E.A.C.H Church Vietnam',
    description: 'Sự kiện và chương trình sắp tới của REACH Church Vietnam.',
    type: 'website',
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
