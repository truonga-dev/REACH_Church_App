'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Headphones, Video, BookOpen, Loader2, PlayCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Sermon, NewsItem } from '@/types';
import './page.css';

type Tab = 'sermons' | 'audiobooks' | 'pdfs' | 'devotionals';

const TABS: { id: Tab; label: string; icon: typeof Video }[] = [
  { id: 'sermons', label: 'Bài giảng', icon: Video },
  { id: 'audiobooks', label: 'Sách nói', icon: Headphones },
  { id: 'pdfs', label: 'Sách PDF', icon: FileText },
  { id: 'devotionals', label: 'Dưỡng linh', icon: BookOpen },
];

function getYoutubeId(source: string | null | undefined): string | null {
  if (!source) return null;
  if (source.length === 11 && /^[A-Za-z0-9_-]+$/.test(source)) return source;
  const match = source.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/);
  return match ? match[1] : null;
}

export default function Library() {
  const [activeTab, setActiveTab] = useState<Tab>('sermons');
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [audiobooks, setAudiobooks] = useState<NewsItem[]>([]);
  const [pdfs, setPdfs] = useState<NewsItem[]>([]);
  const [devotionals, setDevotionals] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingSermon, setPlayingSermon] = useState<Sermon | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sermonsRes, newsRes] = await Promise.all([
        supabase.from('sermons').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }),
      ]);

      if (sermonsRes.data) setSermons(sermonsRes.data as Sermon[]);
      if (newsRes.data) {
        const news = newsRes.data as NewsItem[];
        setAudiobooks(news.filter((n) => n.type === 'Sách Nói' || (n.audio_url && !n.pdf_url)));
        setPdfs(news.filter((n) => n.pdf_url));
        setDevotionals(news.filter((n) => n.type?.toLowerCase().includes('dưỡng linh')));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadPdf = (url: string) => {
    if (url) window.open(url, '_blank');
    else alert('Tài liệu chưa có file PDF.');
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="lib-loading">
          <Loader2 size={28} className="spin" />
          <p>Đang tải thư viện...</p>
        </div>
      );
    }

    if (activeTab === 'sermons') {
      if (sermons.length === 0) {
        return <p className="lib-empty">Chưa có bài giảng. Admin có thể thêm qua trang quản trị.</p>;
      }
      return (
        <div className="media-list">
          {sermons.map((s) => (
            <div key={s.id} className="media-item" onClick={() => setPlayingSermon(s)}>
              <div className="media-icon video-bg"><PlayCircle size={24} /></div>
              <div className="media-info">
                <h4>{s.title}</h4>
                <p>{s.speaker} • {s.series} • {s.date}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'audiobooks') {
      if (audiobooks.length === 0) {
        return <p className="lib-empty">Chưa có sách nói. Admin có thể tải lên MP3 qua trang quản trị.</p>;
      }
      return (
        <div className="media-list">
          {audiobooks.map((a) => (
            <div key={a.id} className="media-item audio-item">
              <div className="media-icon audio-bg"><Headphones size={24} /></div>
              <div className="media-info">
                <h4>{a.title}</h4>
                <p>{a.type}</p>
                {a.audio_url && <audio controls src={a.audio_url} className="lib-audio" />}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'pdfs') {
      if (pdfs.length === 0) {
        return <p className="lib-empty">Chưa có tài liệu PDF.</p>;
      }
      return (
        <div className="pdf-list">
          {pdfs.map((pdf) => (
            <div key={pdf.id} className="pdf-item">
              <div className="pdf-icon"><FileText size={24} /></div>
              <div className="pdf-info">
                <h4 className="pdf-title">{pdf.title}</h4>
                <p className="pdf-meta">{pdf.type || 'Tài liệu'}</p>
              </div>
              <button type="button" className="btn-read" onClick={() => handleReadPdf(pdf.pdf_url!)}>Đọc</button>
            </div>
          ))}
        </div>
      );
    }

    if (devotionals.length === 0) {
      return <p className="lib-empty">Chưa có bài dưỡng linh trong thư viện.</p>;
    }
    return (
      <div className="media-list">
        {devotionals.map((d) => (
          <Link
            key={d.id}
            href={`/devotional?title=${encodeURIComponent(d.title)}&text=${encodeURIComponent(d.content?.slice(0, 200) || '')}&day=Thư viện&duration=5 phút`}
            className="media-item"
          >
            <div className="media-icon dev-bg"><BookOpen size={24} /></div>
            <div className="media-info">
              <h4>{d.title}</h4>
              <p>{d.type}</p>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="library-container">
      <header className="page-header">
        <h1 className="page-title">Thư viện</h1>
        <p className="page-subtitle">Tài nguyên thuộc linh của REACH Church</p>
      </header>

      <div className="library-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`lib-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      <section className="recent-section">{renderContent()}</section>

      {playingSermon && (
        <div className="sermon-modal-overlay" onClick={() => setPlayingSermon(null)}>
          <div className="sermon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sermon-modal-header">
              <div>
                <p className="sermon-series">{playingSermon.series}</p>
                <h3>{playingSermon.title}</h3>
                <p className="sermon-speaker">{playingSermon.speaker}</p>
              </div>
              <button type="button" onClick={() => setPlayingSermon(null)} aria-label="Đóng"><X size={20} /></button>
            </div>
            {getYoutubeId(playingSermon.youtube_url || playingSermon.youtube_id) ? (
              <iframe
                title={playingSermon.title}
                width="100%"
                height="280"
                src={`https://www.youtube.com/embed/${getYoutubeId(playingSermon.youtube_url || playingSermon.youtube_id)}?autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <p className="lib-empty">Không có video YouTube cho bài giảng này.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
