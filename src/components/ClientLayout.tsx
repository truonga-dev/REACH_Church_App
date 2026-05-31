'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import { AuthProvider } from '@/contexts/AuthContext';

const FULL_BLEED_PATHS = ['/login', '/register', '/admin'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullBleed = FULL_BLEED_PATHS.some((p) => pathname?.startsWith(p));

  return (
    <AuthProvider>
      {fullBleed ? (
        children
      ) : (
        <div className="app-container">
          <main className={`main-content${pathname?.startsWith('/profile') ? ' main-content--profile' : ''}`}>
            {children}
          </main>
          <BottomNav />
        </div>
      )}
    </AuthProvider>
  );
}
