'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Library, Users, UserCircle2, Heart } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { name: 'Trang chủ', path: '/', icon: Home },
  { name: 'Kinh Thánh', path: '/bible', icon: BookOpen },
  { name: 'Thư viện', path: '/library', icon: Library },
  { name: 'Mục vụ', path: '/ministry', icon: Users },
  { name: 'Hồ sơ', path: '/profile', icon: UserCircle2 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
        const Icon = item.icon;
        
        return (
          <Link 
            key={item.path} 
            href={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" size={24} />
            <span className="nav-label">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
