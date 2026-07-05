'use client';

import React from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TopHeader() {
  const { language, setLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
          <span className="text-[#121212] font-bold text-lg">R</span>
        </div>
        <span className="font-semibold text-lg text-white">REACH Church</span>
      </Link>

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          className="bg-white/10 text-white border-none rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-white/20 outline-none"
        >
          <option value="vi">VI</option>
          <option value="en">EN</option>
          <option value="ko">KO</option>
        </select>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
