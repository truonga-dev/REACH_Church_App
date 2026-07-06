'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Headphones, Video, BookOpen, PlayCircle, X, ChevronRight, ExternalLink, Calendar, Heart } from 'lucide-react';
import { LibrarySkeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';
import type { Sermon, NewsItem } from '@/types';
import { getYoutubeId, getYoutubeThumbnailUrl } from '@/lib/youtube';
import CommentSection from '@/components/CommentSection';
import MediaPlayer from '@/components/library/MediaPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsFavorite, addFavorite, removeFavorite } from '@/lib/favorites';
import { useDraggableScroll } from '@/hooks/useDraggableScroll';
import { useLanguage } from '@/contexts/LanguageContext';
import './page.css';

type Tab = 'sermons' | 'audiobooks' | 'pdfs' | 'devotionals' | 'events';

export default function Library() {
  const router = useRouter();
  const [activeTab, setActiveTab]           = useState<Tab>('sermons');
  const [sermons, setSermons]               = useState<Sermon[]>([]);
  const [audiobooks, setAudiobooks]         = useState<NewsItem[]>([]);
  const [pdfs, setPdfs]                     = useState<NewsItem[]>([]);
  const [devotionals, setDevotionals]       = useState<NewsItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [playingSermon, setPlayingSermon]   = useState<Sermon | null>(null);
  const [playingMedia, setPlayingMedia]     = useState<any>(null);  
  const [playingPdf, setPlayingPdf]         = useState<NewsItem | null>(null);
  const [activeFilter, setActiveFilter]     = useState('Tất cả');
  const { user } = useAuth();
  const { t, getDbField } = useLanguage();

  const TABS = [
    { id: 'sermons',    label: t('page_library.tab_sermons'), icon: Video      },
    { id: 'audiobooks', label: t('page_library.tab_audiobooks'),  icon: Headphones },
    { id: 'pdfs',       label: t('page_library.tab_pdfs'),  icon: FileText   },
    { id: 'devotionals',label: t('page_library.tab_devotionals'),icon: BookOpen   },
    { id: 'events',     label: t('page_library.tab_events'),   icon: Calendar   },
  ];

  const SERMON_FILTERS = [t('page_library.filter_all'), 'Pastor David Tín', 'Mục sư Tín', 'Mục sư An', 'Mục sư Bích', 'Chấp Sự Phúc Sinh'];
  const CONTENT_FILTERS = [t('page_library.filter_all'), t('page_library.filter_family'), t('page_library.filter_spirit'), t('page_library.filter_marriage'), t('page_library.filter_faith'), t('page_library.filter_other')];
  const [likedSermon, setLikedSermon]       = useState(false);
  const [likedPdf, setLikedPdf]             = useState(false);

  useEffect(() => {
    if (user && playingSermon) {
      checkIsFavorite(user.id, 'sermon', playingSermon.id).then(setLikedSermon);
    }
  }, [user, playingSermon]);

  useEffect(() => {
    if (user && playingPdf) {
      checkIsFavorite(user.id, 'pdf', playingPdf.id).then(setLikedPdf);
    }
  }, [user, playingPdf]);

  const handleFavoriteSermon = async () => {
    if (!user || !playingSermon) return alert(t('page_library.login_required'));
    if (likedSermon) {
      const ok = await removeFavorite(user.id, 'sermon', playingSermon.id);
      if (ok) setLikedSermon(false);
    } else {
      const ok = await addFavorite(user.id, 'sermon', playingSermon.id);
      if (ok) setLikedSermon(true);
    }
  };

  const handleFavoritePdf = async () => {
    if (!user || !playingPdf) return alert(t('page_library.login_required'));
    if (likedPdf) {
      const ok = await removeFavorite(user.id, 'pdf', playingPdf.id);
      if (ok) setLikedPdf(false);
    } else {
      const ok = await addFavorite(user.id, 'pdf', playingPdf.id);
      if (ok) setLikedPdf(true);
    }
  };

  const tabsScroll = useDraggableScroll<HTMLDivElement>();
  const filtersScroll = useDraggableScroll<HTMLDivElement>();

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
    setActiveFilter(t('page_library.filter_all'));
  };

  const filters = activeTab === 'sermons' ? SERMON_FILTERS : CONTENT_FILTERS;

  /* ── Filter logic ── */
  const filteredSermons = activeFilter === t('page_library.filter_all')
    ? sermons
    : sermons.filter(s => (s.preacher || s.speaker || '').includes(activeFilter) || (s.series || '').includes(activeFilter));

  const filteredAudio = activeFilter === t('page_library.filter_all')
    ? audiobooks
    : audiobooks.filter(a => a.title.includes(activeFilter) || (a.content || '').includes(activeFilter));

  const filteredPdfs = activeFilter === t('page_library.filter_all')
    ? pdfs
    : pdfs.filter(p => p.title.includes(activeFilter) || (p.content || '').includes(activeFilter));

  const filteredDev = activeFilter === t('page_library.filter_all')
    ? devotionals
    : devotionals.filter(d => d.title.includes(activeFilter) || (d.content || '').includes(activeFilter));

  const renderContent = () => {
    if (loading) return <LibrarySkeleton />;

    /* SERMONS */
    if (activeTab === 'sermons') {
      if (filteredSermons.length === 0) return <p className="lib-empty">{t('page_library.empty_sermons')}</p>;
      return (
        <div className="sermon-grid">
          {filteredSermons.map(s => {
            const thumb = getYoutubeThumbnailUrl(s.youtube_url || s.youtube_id || s.video_url);
            return (
              <div key={s.id} className="sermon-card" onClick={() => setPlayingSermon(s)}>
                <div className="lib-sermon-thumb">
                  {thumb
                     
                    ? <img src={thumb} alt={getDbField(s, 'title')} />
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
                  <h4 className="sermon-card-title">{getDbField(s, 'title')}</h4>
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
      if (filteredAudio.length === 0) return <p className="lib-empty">{t('page_library.empty_audiobooks')}</p>;
      return (
        <div className="audio-grid">
          {filteredAudio.map(a => (
            <div key={a.id} className="audio-card">
              <div className="audio-card-top">
                <div className="audio-icon-wrap"><Headphones size={22} /></div>
                <div className="audio-card-info">
                  <p className="audio-card-title">{getDbField(a, 'title')}</p>
                  <p className="audio-card-type">{t('page_library.audio_type')}</p>
                </div>
              </div>
              {a.audio_url
                ? (
                  <button 
                    className="btn-read" 
                    onClick={() => setPlayingMedia({ id: a.id, title: getDbField(a, 'title'), url: a.audio_url, type: 'audio' })}
                  >
                    <PlayCircle size={16} /> {t('page_library.play_audio')}
                  </button>
                )
                : <p className="lib-empty">{t('page_library.empty_audio')}</p>
              }
            </div>
          ))}
        </div>
      );
    }

    /* PDFs */
    if (activeTab === 'pdfs') {
      if (filteredPdfs.length === 0) return <p className="lib-empty">{t('page_library.empty_pdfs')}</p>;
      return (
        <div className="pdf-grid">
          {filteredPdfs.map(pdf => (
            <div key={pdf.id} className="pdf-card">
              <div className="pdf-card-top">
                <div className="pdf-icon-wrap"><FileText size={20} /></div>
                <div className="pdf-card-info">
                  <p className="pdf-card-title">{getDbField(pdf, 'title')}</p>
                  <p className="pdf-card-type">{pdf.type || t('page_library.pdf_type')}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-read"
                onClick={() => pdf.pdf_url ? setPlayingPdf(pdf) : alert(t('page_library.no_pdf'))}
              >
                <ExternalLink size={14} />
                {t('page_library.view_pdf')}
              </button>
            </div>
          ))}
        </div>
      );
    }

    /* DEVOTIONALS */
    if (filteredDev.length === 0) return <p className="lib-empty">{t('page_library.empty_devotionals')}</p>;
    return (
      <div className="dev-grid">
        {filteredDev.map(d => (
          <Link
            key={d.id}
            href={`/devotional?id=${d.id}&title=${encodeURIComponent(getDbField(d, 'title'))}&text=${encodeURIComponent(getDbField(d, 'content')?.slice(0, 200) || '')}&day=Thư viện&duration=5 phút`}
            className="dev-card"
          >
            <div className="dev-icon-wrap"><BookOpen size={22} /></div>
            <div className="dev-card-info">
              <p className="dev-card-title">{getDbField(d, 'title')}</p>
              <p className="dev-card-type">{d.type || t('page_library.tab_devotionals')}</p>
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
        <h1 className="lib-title">{t('page_library.title')}</h1>
        <p className="lib-subtitle">{t('page_library.subtitle')}</p>
      </header>

      {/* ── Tabs ── */}
      <div 
        className="library-tabs"
        ref={tabsScroll.ref}
        onMouseDown={tabsScroll.onMouseDown}
        onMouseLeave={tabsScroll.onMouseLeave}
        onMouseUp={tabsScroll.onMouseUp}
        onMouseMove={tabsScroll.onMouseMove}
        style={tabsScroll.style}
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`lib-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => handleTabChange(id as Tab)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filter chips ── */}
      <div 
        className="lib-filters"
        ref={filtersScroll.ref}
        onMouseDown={filtersScroll.onMouseDown}
        onMouseLeave={filtersScroll.onMouseLeave}
        onMouseUp={filtersScroll.onMouseUp}
        onMouseMove={filtersScroll.onMouseMove}
        style={filtersScroll.style}
      >
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
                <h3 className="sermon-modal-title">{getDbField(playingSermon, 'title')}</h3>
                {(playingSermon.preacher || playingSermon.speaker) && <p className="sermon-modal-speaker">{playingSermon.preacher || playingSermon.speaker} · {playingSermon.sermon_date || playingSermon.date ? new Date(playingSermon.sermon_date || playingSermon.date as string).toLocaleDateString('vi-VN') : ''}</p>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="button" onClick={handleFavoriteSermon} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: likedSermon ? '#ef4444' : '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={18} fill={likedSermon ? "#ef4444" : "none"} />
                </button>
                <button type="button" onClick={() => setPlayingSermon(null)} aria-label="Đóng" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
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
              <p className="lib-empty">{t('page_library.no_youtube')}</p>
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

      {/* ── PDF Viewer Modal ── */}
      {playingPdf && (
        <div className="sermon-modal-overlay" onClick={() => setPlayingPdf(null)} style={{ zIndex: 10000 }}>
          <div className="sermon-modal" onClick={e => e.stopPropagation()} style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="sermon-modal-handle" />
            <div className="sermon-modal-header">
              <div>
                <p className="sermon-modal-series">{playingPdf.type || t('page_library.pdf_type')}</p>
                <h3 className="sermon-modal-title">{getDbField(playingPdf, 'title')}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="button" onClick={handleFavoritePdf} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: likedPdf ? '#ef4444' : '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Heart size={18} fill={likedPdf ? "#ef4444" : "none"} />
                </button>
                <button type="button" onClick={() => setPlayingPdf(null)} aria-label="Đóng" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
            </div>
            
            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
              <iframe 
                src={`${playingPdf.pdf_url}#toolbar=0`} 
                width="100%" 
                height="100%" 
                style={{ border: 'none' }}
                title={playingPdf.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Media Player ── */}
      <MediaPlayer item={playingMedia} onClose={() => setPlayingMedia(null)} />
    </div>
  );
}
