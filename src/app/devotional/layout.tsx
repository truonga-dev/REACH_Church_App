import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dưỡng Linh Hằng Ngày',
  description:
    'Bài đọc dưỡng linh hằng ngày từ Hội Thánh R.E.A.C.H Vietnam. Nuôi dưỡng đức tin qua lời Chúa mỗi ngày.',
  keywords: ['dưỡng linh', 'devotional', 'lời Chúa', 'đức tin', 'hội thánh', 'REACH Church'],
  openGraph: {
    title: 'Dưỡng Linh Hằng Ngày | R.E.A.C.H Church Vietnam',
    description: 'Bài dưỡng linh hằng ngày — nuôi dưỡng đức tin qua lời Chúa.',
    type: 'article',
  },
};

export default function DevotionalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
