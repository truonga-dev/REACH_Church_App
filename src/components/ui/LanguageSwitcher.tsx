'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as any)}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '4px 6px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        outline: 'none',
        cursor: 'pointer',
      }}
      className="lang-switcher"
    >
      <option value="vi" style={{ color: '#000' }}>VI</option>
      <option value="en" style={{ color: '#000' }}>EN</option>
      <option value="ko" style={{ color: '#000' }}>KO</option>
    </select>
  );
}
