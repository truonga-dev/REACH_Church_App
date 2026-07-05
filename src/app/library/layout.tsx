import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thư Viện — Bài Giảng & Tài Liệu',
  description:
    'Thư viện bài giảng video, sách nói, PDF và bài dưỡng linh của Hội Thánh R.E.A.C.H Vietnam. Tìm kiếm và nghe bài giảng mọi lúc, mọi nơi.',
  keywords: ['bài giảng', 'sermon', 'sách nói', 'PDF', 'dưỡng linh', 'thư viện', 'REACH Church'],
  openGraph: {
    title: 'Thư Viện | R.E.A.C.H Church Vietnam',
    description: 'Bài giảng video, sách nói, PDF và dưỡng linh của REACH Church.',
    type: 'website',
  },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
