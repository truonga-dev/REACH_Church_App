import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cầu Nguyện',
  description:
    'Gửi nhu cầu cầu nguyện và đồng lòng cầu nguyện cùng cộng đồng Hội Thánh R.E.A.C.H Vietnam. Mọi lời cầu nguyện đều được Chúa lắng nghe.',
  keywords: ['cầu nguyện', 'prayer', 'nhu cầu cầu nguyện', 'hội thánh', 'REACH Church'],
  openGraph: {
    title: 'Cầu Nguyện | R.E.A.C.H Church Vietnam',
    description: 'Gửi nhu cầu cầu nguyện và cầu nguyện cùng cộng đồng REACH Church.',
    type: 'website',
  },
};

export default function PrayerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
