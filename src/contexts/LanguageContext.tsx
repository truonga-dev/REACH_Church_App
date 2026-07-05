'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import vi from '@/locales/vi.json';
import en from '@/locales/en.json';
import ko from '@/locales/ko.json';

type Language = 'vi' | 'en' | 'ko';

const translations = {
  vi,
  en,
  ko,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  getDbField: (item: any, fieldName: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  t: (key: string) => key,
  getDbField: () => '',
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('vi');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && ['vi', 'en', 'ko'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Fallback to key if not found
      }
    }
    
    return typeof result === 'string' ? result : key;
  };

  /**
   * Helper to get translated field from DB object.
   * Ex: getDbField(event, 'title') -> checks event.title_en if lang='en', falls back to event.title
   */
  const getDbField = (item: any, fieldName: string): string => {
    if (!item) return '';
    if (language === 'vi') return item[fieldName] || '';
    
    const localizedField = `${fieldName}_${language}`;
    return item[localizedField] || item[fieldName] || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getDbField }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
