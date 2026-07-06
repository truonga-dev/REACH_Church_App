'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Monitor, Moon, Sun, Type } from 'lucide-react';
import './BibleSettings.css';

const FONTS = [
  { id: 'Inter', name: 'Inter (Mặc định)' },
  { id: 'Merriweather', name: 'Merriweather' },
  { id: 'Lora', name: 'Lora' },
  { id: 'Roboto', name: 'Roboto' }
];

export default function BibleSettings() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        // Load from local storage if not logged in
        const savedSize = localStorage.getItem('bibleFontSize');
        const savedFamily = localStorage.getItem('bibleFontFamily');
        if (savedSize) setFontSize(Number(savedSize));
        if (savedFamily) setFontFamily(savedFamily);
        setLoaded(true);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('bible_font_size, bible_font_family')
        .eq('id', user.id)
        .single();
      
      if (data) {
        if (data.bible_font_size) setFontSize(data.bible_font_size);
        if (data.bible_font_family) setFontFamily(data.bible_font_family);
      }
      setLoaded(true);
    }
    loadPreferences();
  }, [user]);

  const handleSave = async (newSize: number, newFamily: string) => {
    setFontSize(newSize);
    setFontFamily(newFamily);
    
    // Save to local storage as fallback
    localStorage.setItem('bibleFontSize', newSize.toString());
    localStorage.setItem('bibleFontFamily', newFamily);

    if (user) {
      setIsSaving(true);
      await supabase
        .from('profiles')
        .update({ 
          bible_font_size: newSize,
          bible_font_family: newFamily
        })
        .eq('id', user.id);
      setIsSaving(false);
    }
  };

  if (!loaded) return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>;

  return (
    <div className="bible-settings-container">
      {/* THEME */}
      <div className="bs-section">
        <h3>Giao diện</h3>
        <div className="bs-theme-options">
          <button 
            className={`bs-theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={20} />
            <span>Sáng</span>
          </button>
          <button 
            className={`bs-theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={20} />
            <span>Tối</span>
          </button>
          <button 
            className={`bs-theme-btn ${theme === 'system' ? 'active' : ''}`}
            onClick={() => setTheme('system')}
          >
            <Monitor size={20} />
            <span>Hệ thống</span>
          </button>
        </div>
      </div>

      {/* FONT SIZE */}
      <div className="bs-section">
        <div className="bs-section-header">
          <h3>Kích thước chữ</h3>
          <span className="bs-value">{fontSize}px</span>
        </div>
        <div className="bs-slider-container">
          <Type size={16} color="var(--color-text-muted)" />
          <input 
            type="range" 
            min="14" max="28" step="1" 
            value={fontSize}
            onChange={(e) => handleSave(Number(e.target.value), fontFamily)}
            className="bs-slider"
          />
          <Type size={24} color="var(--color-text-muted)" />
        </div>
      </div>

      {/* FONT FAMILY */}
      <div className="bs-section">
        <h3>Phông chữ</h3>
        <div className="bs-font-list">
          {FONTS.map(font => (
            <button 
              key={font.id}
              className={`bs-font-btn ${fontFamily === font.id ? 'active' : ''}`}
              style={{ fontFamily: font.id }}
              onClick={() => handleSave(fontSize, font.id)}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bs-preview" style={{ fontSize: `${fontSize}px`, fontFamily }}>
        Ban đầu Đức Chúa Trời dựng nên trời đất. Vả, đất là vô hình và trống không, sự mờ tối ở trên mặt vực...
      </div>
    </div>
  );
}
