'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Music } from 'lucide-react';

export default function NewsDetail() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchNews = async () => {
      const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
      if (data) setNews(data);
      setLoading(false);
    };
    fetchNews();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Đang tải...</div>;
  if (!news) return <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>Không tìm thấy bài viết.</div>;

  return (
    <div style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto', color: '#fff', paddingBottom: '80px' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#48BCE1', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>
        <ArrowLeft size={20} /> Quay lại
      </button>

      {news.image_url && (
        <img src={news.image_url} alt="Cover" style={{ width: '100%', borderRadius: '16px', marginBottom: '1.5rem', objectFit: 'cover', maxHeight: '300px' }} />
      )}

      <div style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '8px', backgroundColor: '#48BCE122', color: '#48BCE1', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        {news.type || news.tag}
      </div>
      
      <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', lineHeight: '1.3' }}>{news.title}</h1>
      <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        {new Date(news.created_at).toLocaleDateString('vi-VN')}
      </p>

      {news.audio_url && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Music size={20} color="#F4CC30" /> <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Nghe Audio</span>
          </div>
          <audio controls src={news.audio_url} style={{ width: '100%', height: '40px', outline: 'none' }}></audio>
        </div>
      )}

      <div style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap', marginBottom: '2rem', fontSize: '1.1rem' }}>
        {news.content}
      </div>

      {news.pdf_url && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <a href={news.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', backgroundColor: '#F12D5C', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(241, 45, 92, 0.3)' }}>
            <FileText size={22} /> Mở file PDF đính kèm
          </a>
        </div>
      )}
    </div>
  );
}
