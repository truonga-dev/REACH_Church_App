'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Library, Users, UserCircle2, Radio } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import './BottomNav.css';

const getNavItems = (t: any) => [
  { name: t('home'), path: '/', icon: Home },
  { name: t('bible'), path: '/bible', icon: BookOpen },
  { name: t('library'), path: '/library', icon: Library },
  { name: t('ministry'), path: '/ministry', icon: Users },
  { name: t('profile'), path: '/profile', icon: UserCircle2 },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isLive, setIsLive] = useState(false);
  const { t } = useLanguage();
  
  const baseNavItems = getNavItems(t);

  useEffect(() => {
    const checkLive = async () => {
      try {
        const { data } = await supabase
          .from('livestreams')
          .select('id')
          .eq('is_live', true)
          .limit(1);
        setIsLive(!!data && data.length > 0);
      } catch (err) {
        console.error('Error checking live status', err);
      }
    };

    checkLive();

    const channel = supabase.channel(`public:livestreams_bottomnav_${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'livestreams' }, () => {
        checkLive();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navItems = baseNavItems;

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(`${item.path}/`));
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.path} 
            href={item.path}
            className={`nav-item ${isActive ? 'active' : ''} ${(item as any).isLiveIcon ? 'live-item' : ''}`}
          >
            <div className="nav-icon-wrap">
              <Icon className="nav-icon" size={24} />
              {(item as any).isLiveIcon && <div className="live-indicator-dot" />}
            </div>
            <span className="nav-label">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
