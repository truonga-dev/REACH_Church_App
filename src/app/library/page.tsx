'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Headphones, Video, BookOpen, Loader2, PlayCircle, X, ChevronRight, ExternalLink, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Sermon, NewsItem } from '@/types';
import { getYoutubeId, getYoutubeThumbnailUrl } from '@/lib/youtube';
import CommentSection from '@/components/CommentSection';
import './page.css';

type Tab = 'sermons' | 'audiobooks' | 'pdfs' | 'devotionals' | 'events';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'sermons',    label: 'Bài giảng', icon: Video      },
  { id: 'audiobooks', label: 'Sách nói',  icon: Headphones },
  { id: 'pdfs',       label: 'Sách PDF',  icon: FileText   },
  { id: 'devotionals',label: 'Dưỡng linh',icon: BookOpen   },
  { id: 'events',     label: 'Sự kiện',   icon: Calendar   },
];

const SERMON_FILTERS = ['Tất cả', 'Pastor David Tô', 'Mục sư Tín', 'Mục sư An', 'Mục sư Bích', 'Chấp Sự Phục Sinh'];
const CONTENT_FILTERS = ['Tất cả', 'Gia đình', 'Thánh Linh', 'Hôn nhân đắc thắng', 'Đức tin', 'Khác'];

export default function Library() {
  const router = useRouter();
  const [activeTab, setActiveTab]           = useState<Tab>('sermons');
  const [sermons, setSermons]               = useState<Sermon[]>([]);
  const [audiobooks, setAudiobooks]         = useState<NewsItem[]>([]);
  const [pdfs, setPdfs]                     = useState<NewsItem[]>([]);
  const [devotionals, setDevotionals]       = useState<NewsItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [playingSermon, setPlayingSermon]   = useState<Sermon | null>(null);
  const [activeFilter, setActiveFilter]     = useState('Tất cả');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sermonsRes, newsRes, devotionalsRes] = await Promise.all([
        supabase.from('sermons').select('*').order('created_at', { ascending: false }),
        supabase.from('news').select('*').order('created_at', { ascending: false }),
        supabase.from('devotionals').select('*').order('published_at', { ascending: false }),
      ]);
      if (sermonsRes.data) setSermons(sermonsRes.data as Sermon[]);
      if (newsRes.data) {
        const news = newsRes.data as NewsItem[];
        setAudiobooks(news.filter(n => n.type === 'Sách Nói'));
        setPdfs(news.filter(n => n.type === 'Tài liệu'));
      }
      if (devotionalsRes.data) {
        setDevotionals(devotionalsRes.data as any[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (id: Tab) => {
    if (id === 'events') {
      router.push('/events');
      return;
    }
    setActiveTab(id);
    setActiveFilter('Tất cả');
  };

  const filters = activeTab === 'sermons' ? SERMON_FILTERS : CONTENT_FILTERS;

  /* ── Filter logic ── */
  const filteredSermons = activeFilter === 'Tất cả'
    ? sermons
    : sermons.filter(s => (s.preacher || s.speaker || '').includes(activeFilter) || (s.series || '').includes(activeFilter));

  const filteredAudio = activeFilter === 'Tất cả'
    ? audiobooks
    : audiobooks.filter(a => a.title.includes(activeFilter) || (a.content || '').includes(activeFilter));

  const filteredPdfs = activeFilter === 'Tất cả'
    ? pdfs
    : pdfs.filter(p => p.title.includes(activeFilter) || (p.content || '').includes(activeFilter));

  const filteredDev = activeFilter === 'Tất cả'
    ? devotionals
    : devotionals.filter(d => d.title.includes(activeFilter) || (d.content || '').includes(activeFilter));

  /* ── Render content per tab ── */
  const renderContent = () => {
    if (loading) return (
      <div className="lib-loading">
        <Loader2 size={28} className="spin" />
        <p>Đang tải thư viện...</p>
      </div>
    );

    /* SERMONS */
    if (activeTab === 'sermons') {
      if (filteredSermons.length === 0) return <p className="lib-empty">Chưa có bài giảng nào trong danh mục này.</p>;
      return (
        <div className="sermon-grid">
          {filteredSermons.map(s => {
            const thumb = getYoutubeThumbnailUrl(s.youtube_url || s.youtube_id || s.video_url);
            return (
              <div key={s.id} className="sermon-card" onClick={() => setPlayingSermon(s)}>
                <div className="lib-sermon-thumb">
                  {thumb
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={thumb} alt={s.title} />
                    : (
                      <div className="lib-sermon-thumb-placeholder">
                        <Video size={32} color="rgba(255,255,255,0.2)" />
                      </div>
                    )
                  }
                  <div className="sermon-play-btn">
                    <div className="sermon-play-icon">
                      <PlayCircle size={22} />
                    </div>
                  </div>
                </div>
                <div className="sermon-card-body">
                  {s.series && <span className="sermon-series-tag">{s.series}</span>}
                  <h4 className="sermon-card-title">{s.title}</h4>
                  <div className="sermon-card-meta">
                    <span>{s.preacher || s.speaker || 'REACH Church'}</span>
                    {(s.sermon_date || s.date) && <><span className="sermon-card-dot">•</span><span>{new Date(s.sermon_date || s.date as string).toLocaleDateString('vi-VN')}</span></>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    /* AUDIOBOOKS */
    if (activeTab === 'audiobooks') {
      if (filteredAudio.length === 0) return <p className="lib-empty">Chưa có sách nói nào trong danh mục này.</p>;
      return (
        <div className="audio-grid">
          {filteredAudio.map(a => (
            <div key={a.id} className="audio-card">
              <div className="audio-card-top">
                <div className="audio-icon-wrap"><Headphones size={22} /></div>
                <div className="audio-card-info">
                  <p className="audio-card-title">{a.title}</p>
                  <p className="audio-card-type">Sách Nói</p>
                </div>
              </div>
              {a.audio_url
                ? <audio controls src={a.audio_url} className="lib-audio" />
                : <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Chưa có file audio</p>
              }
            </div>
          ))}
        </div>
      );
    }

    /* PDFs */
    if (activeTab === 'pdfs') {
      if (filteredPdfs.length === 0) return <p className="lib-empty">Chưa có tài liệu PDF nào trong danh mục này.</p>;
      return (
        <div className="pdf-grid">
          {filteredPdfs.map(pdf => (
            <div key={pdf.id} className="pdf-card">
              <div className="pdf-card-top">
                <div className="pdf-icon-wrap"><FileText size={20} /></div>
                <div className="pdf-card-info">
                  <p className="pdf-card-title">{pdf.title}</p>
                  <p className="pdf-card-type">{pdf.type || 'Tài liệu'}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-read"
                onClick={() => pdf.pdf_url ? window.open(pdf.pdf_url, '_blank') : alert('Tài liệu chưa có file PDF.')}
              >
                <ExternalLink size={14} />
                Mở tài liệu
              </button>
            </div>
          ))}
        </div>
      );
    }

    /* DEVOTIONALS */
    if (filteredDev.length === 0) return <p className="lib-empty">Chưa có bài dưỡng linh nào trong danh mục này.</p>;
    return (
      <div className="dev-grid">
        {filteredDev.map(d => (
          <Link
            key={d.id}
            href={`/devotional?id=${d.id}&title=${encodeURIComponent(d.title)}&text=${encodeURIComponent(d.content?.slice(0, 200) || '')}&day=Thư viện&duration=5 phút`}
            className="dev-card"
          >
            <div className="dev-icon-wrap"><BookOpen size={22} /></div>
            <div className="dev-card-info">
              <p className="dev-card-title">{d.title}</p>
              <p className="dev-card-type">{d.type || 'Dưỡng linh'}</p>
            </div>
            <ChevronRight size={18} className="dev-card-arrow" />
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="library-container">
      {/* ── Header ── */}
      <header className="lib-header">
        <div className="lib-header-bg" />
        <h1 className="lib-title">Thư viện</h1>
        <p className="lib-subtitle">Tài nguyên thuộc linh của REACH Church</p>
      </header>

      {/* ── Tabs ── */}
      <div className="library-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`lib-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => handleTabChange(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filter chips ── */}
      <div className="lib-filters">
        {filters.map(f => (
          <button
            key={f}
            className={`lib-chip ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <section>{renderContent()}</section>

      {/* ── Sermon Player Modal ── */}
      {playingSermon && (
        <div className="sermon-modal-overlay" onClick={() => setPlayingSermon(null)}>
          <div className="sermon-modal" onClick={e => e.stopPropagation()}>
            <div className="sermon-modal-handle" />
            <div className="sermon-modal-header">
              <div>
                {playingSermon.series && <p className="sermon-modal-series">{playingSermon.series}</p>}
                <h3 className="sermon-modal-title">{playingSermon.title}</h3>
                {(playingSermon.preacher || playingSermon.speaker) && <p className="sermon-modal-speaker">{playingSermon.preacher || playingSermon.speaker} · {playingSermon.sermon_date || playingSermon.date ? new Date(playingSermon.sermon_date || playingSermon.date as string).toLocaleDateString('vi-VN') : ''}</p>}
              </div>
              <button type="button" onClick={() => setPlayingSermon(null)} aria-label="Đóng">
                <X size={18} />
              </button>
            </div>

            {getYoutubeId(playingSermon.youtube_url || playingSermon.youtube_id || playingSermon.video_url) ? (
              <div className="sermon-video-wrap">
                <iframe
                  title={playingSermon.title}
                  src={`https://www.youtube.com/embed/${getYoutubeId(playingSermon.youtube_url || playingSermon.youtube_id || playingSermon.video_url)}?autoplay=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="lib-empty">Không có video YouTube cho bài giảng này.</p>
            )}

            {playingSermon.content && (
              <div
                className="sermon-modal-content rich-text-content"
                dangerouslySetInnerHTML={{ __html: playingSermon.content }}
              />
            )}
            
            <CommentSection postType="sermon" postId={playingSermon.id} />
          </div>
        </div>
      )}
    </div>
  );
}
