import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import OneSignalInit from '@/components/OneSignalInit';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });

export const viewport: Viewport = {
  themeColor: '#48BCE1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://reach-church.vercel.app'
  ),
  title: {
    default: 'R.E.A.C.H Church Vietnam',
    template: '%s | R.E.A.C.H Church Vietnam',
  },
  description:
    'Ứng dụng dưỡng linh & kết nối Hội Thánh R.E.A.C.H Vietnam — Kinh Thánh, bài giảng, tin tức, cầu nguyện và mục vụ.',
  keywords: ['REACH Church', 'hội thánh', 'kinh thánh', 'bài giảng', 'cầu nguyện', 'dưỡng linh', 'Vietnam', 'Tin Lành'],
  authors: [{ name: 'R.E.A.C.H Church Vietnam' }],
  creator: 'R.E.A.C.H Church Vietnam',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'R.E.A.C.H Church Vietnam',
    title: 'R.E.A.C.H Church Vietnam',
    description: 'Ứng dụng dưỡng linh & kết nối Hội Thánh R.E.A.C.H Vietnam',
    images: [{ url: '/icons/icon-512x512.png', width: 512, height: 512, alt: 'REACH Church' }],
  },
  twitter: {
    card: 'summary',
    title: 'R.E.A.C.H Church Vietnam',
    description: 'Ứng dụng dưỡng linh & kết nối Hội Thánh R.E.A.C.H Vietnam',
    images: ['/icons/icon-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable}`} suppressHydrationWarning>
        <OneSignalInit />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
