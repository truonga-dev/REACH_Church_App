'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import './page.css';

// Tên sách Kinh Thánh tiếng Việt
const books = [
  "Sáng-thế Ký", "Xuất Ê-díp-tô Ký", "Lê-vi Ký", "Dân-số Ký", "Phục-truyền Luật-lệ Ký",
  "Giô-suê", "Các Quan Xét", "Ru-tơ", "1 Sa-mu-ên", "2 Sa-mu-ên", "1 Các Vua", "2 Các Vua",
  "1 Sử-ký", "2 Sử-ký", "Ê-xơ-ra", "Nê-hê-mi", "Ê-xơ-tê", "Gióp", "Thi-thiên", "Châm-ngôn",
  "Truyền-đạo", "Nhã-ca", "Ê-sai", "Giê-rê-mi", "Ca-thương", "Ê-xê-chi-ên", "Đa-ni-ên",
  "Ô-sê", "Giô-ên", "A-mốt", "Áp-đia", "Giô-na", "Mi-chê", "Na-hum", "Ha-ba-cúc", "Sô-phô-ni",
  "A-gai", "Xa-cha-ri", "Ma-la-chi", "Ma-thi-ơ", "Mác", "Lu-ca", "Giăng", "Công-vụ các Sứ-đồ",
  "Rô-ma", "1 Cô-rinh-tô", "2 Cô-rinh-tô", "Ga-la-ti", "Ê-phê-sô", "Phi-líp", "Cô-lô-se",
  "1 Tê-sa-lô-ni-ca", "2 Tê-sa-lô-ni-ca", "1 Ti-mô-thê", "2 Ti-mô-thê", "Tít", "Phi-lê-môn",
  "Hê-bơ-rơ", "Gia-cơ", "1 Phi-e-rơ", "2 Phi-e-rơ", "1 Giăng", "2 Giăng", "3 Giăng", "Giu-đe", "Khải-huyền"
];

export default function BiblePage() {
  const [bookIndex, setBookIndex] = useState(1);
  const [chapter, setChapter] = useState(1);
  
  const [verses, setVerses] = useState<{verse: number, text: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchChapter(bookIndex, chapter);
  }, [bookIndex, chapter]);

  const fetchChapter = async (bIndex: number, cIndex: number) => {
    setLoading(true);
    setError(false);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`/api/bible?book=${bIndex}&chapter=${cIndex}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (!data.verses || data.error) throw new Error('No verses');
      setVerses(data.verses);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bible-container">

      <header className="bible-header">
        <select 
          className="book-selector" 
          value={bookIndex} 
          onChange={(e) => {
            setBookIndex(Number(e.target.value));
            setChapter(1);
          }}
          style={{ appearance: 'none', backgroundImage: 'none' }}
        >
          {books.map((b, idx) => (
            <option key={idx} value={idx + 1}>{b}</option>
          ))}
        </select>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="chapter-selector" onClick={() => setChapter(Math.max(1, chapter - 1))}>«</button>
          <span style={{ color: 'white', fontWeight: 'bold' }}>Ch. {chapter}</span>
          <button className="chapter-selector" onClick={() => setChapter(chapter + 1)}>»</button>
        </div>
      </header>

      <main className="bible-reader">
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#48BCE1' }}>
          {books[bookIndex - 1]} {chapter}
        </h2>
        
        {loading && <div style={{ textAlign: 'center', color: '#888' }}><Loader2 size={24} className="spin" style={{ margin: '0 auto' }} /> Đang tải Kinh Thánh...</div>}
        
        {error && !loading && (
          <div style={{ textAlign: 'center', color: '#F12D5C' }}>
            Không thể kết nối đến máy chủ Kinh Thánh. (Vui lòng thử lại sau hoặc chương này không tồn tại).
          </div>
        )}

        {!loading && !error && verses.map((v) => (
          <span key={v.verse} className="verse">
            <span className="verse-num">{v.verse}</span>
            {v.text}
          </span>
        ))}
      </main>
    </div>
  );
}
