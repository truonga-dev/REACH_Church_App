import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tin Tức & Thông Báo',
  description: 'Cập nhật các tin tức, thông báo mới nhất từ Hội Thánh R.E.A.C.H Vietnam.',
  keywords: ['tin tức', 'thông báo', 'hội thánh', 'REACH Church'],
  openGraph: {
    title: 'Tin Tức | R.E.A.C.H Church Vietnam',
    description: 'Tin tức và thông báo mới nhất từ REACH Church.',
    type: 'website',
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
