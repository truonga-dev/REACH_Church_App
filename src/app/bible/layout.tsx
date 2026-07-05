import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kinh Thánh Tiếng Việt',
  description:
    'Đọc Kinh Thánh tiếng Việt (1925 & bản mới) theo sách và chương. Tìm kiếm, highlight, chia sẻ câu Kinh Thánh và theo dõi tiến độ đọc hằng ngày.',
  keywords: ['kinh thánh', 'kinh thánh tiếng việt', 'bible', 'đọc kinh thánh', 'REACH Church'],
  openGraph: {
    title: 'Kinh Thánh Tiếng Việt | R.E.A.C.H Church',
    description: 'Đọc Kinh Thánh tiếng Việt theo sách và chương. Tìm kiếm, highlight và chia sẻ.',
    type: 'website',
  },
};

export default function BibleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
