import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mục Vụ & Ban Ngành',
  description:
    'Khám phá các ban ngành và hoạt động mục vụ của Hội Thánh R.E.A.C.H Vietnam — Thiếu nhi, Thanh niên, Phụ nữ, Cầu nguyện và nhiều hơn nữa.',
  keywords: ['mục vụ', 'ban ngành', 'ministry', 'hội thánh', 'REACH Church'],
  openGraph: {
    title: 'Mục Vụ & Ban Ngành | R.E.A.C.H Church Vietnam',
    description: 'Các ban ngành và hoạt động mục vụ của REACH Church Vietnam.',
    type: 'website',
  },
};

export default function MinistryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
