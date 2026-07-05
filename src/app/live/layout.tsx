import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trực Tiếp',
  description: 'Tham gia xem trực tiếp các bài giảng và chương trình thờ phượng từ Hội Thánh R.E.A.C.H Vietnam.',
  keywords: ['trực tiếp', 'livestream', 'hội thánh', 'thờ phượng', 'REACH Church', 'bài giảng'],
  openGraph: {
    title: 'Trực Tiếp | R.E.A.C.H Church Vietnam',
    description: 'Tham gia trực tiếp các chương trình thờ phượng của REACH Church.',
    type: 'website',
  },
};

export default function LiveLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
