import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import OneSignalInit from '@/components/OneSignalInit';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'R.E.A.C.H Church Vietnam',
  description: 'Ứng dụng Dưỡng Linh & Kết Nối Hội Thánh R.E.A.C.H Vietnam',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/logo.png', type: 'image/png' }],
    apple: [{ url: '/logo.png', type: 'image/png' }],
    shortcut: '/logo.png',
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
