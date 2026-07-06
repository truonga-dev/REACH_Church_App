'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, BookOpen, Clock, Heart, Share2, X, Link2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { parseVerseReference } from '@/lib/bible-share';
import CommentSection from '@/components/CommentSection';
import SharePlatformIcon from '@/components/bible/SharePlatformIcon';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsFavorite, addFavorite, removeFavorite } from '@/lib/favorites';
import { useLanguage } from '@/contexts/LanguageContext';
import './page.css';

function DevotionalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [devotionalData, setDevotionalData] = useState<any>(null);  

  const title = searchParams.get('title') || t('page_devotional.default_title');
  const verse = searchParams.get('verse') || t('page_devotional.default_verse');
  const text = searchParams.get('text') || t('page_devotional.default_text');
  const day = searchParams.get('day') || t('page_devotional.default_day');
  const duration = searchParams.get('duration') || t('page_devotional.default_duration');
  const id = searchParams.get('id') || btoa(encodeURIComponent(title));

  useEffect(() => {
    // Fetch devotional details to get author and published_at
    const fetchDevotional = async () => {
      try {
        const { data } = await supabase
          .from('devotionals')
          .select('author, published_at')
          .eq('id', id)
          .single();
        if (data) setDevotionalData(data);
      } catch (err) {
        console.error(err);
      }
    };
    if (id && id.length > 20) { // Valid UUID check roughly
      fetchDevotional();
    }
  }, [id]);

  useEffect(() => {
    // Check if user has favorited
    if (user && id) {
      checkIsFavorite(user.id, 'devotional', id).then(isFav => setLiked(isFav));
    }
  }, [user, id]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleFavorite = async () => {
    if (!user) {
      showToastMsg(t('page_devotional.toast_login'));
      return;
    }
    if (liked) {
      const ok = await removeFavorite(user.id, 'devotional', id);
      if (ok) setLiked(false);
    } else {
      const ok = await addFavorite(user.id, 'devotional', id);
      if (ok) setLiked(true);
    }
  };

  const handleShareClick = async (platform: 'zalo' | 'facebook' | 'x' | 'instagram' | 'copy') => {
    const url = window.location.href;
    const shareTitle = `Dưỡng linh: ${title}`;

    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      showToastMsg(t('page_devotional.toast_copied'));
      setShareOpen(false);
      return;
    }
    
    if (platform === 'instagram') {
      await navigator.clipboard.writeText(url);
      showToastMsg(t('page_devotional.toast_copied_ig'));
      setTimeout(() => {
        window.open('https://instagram.com', '_blank');
      }, 1000);
      setShareOpen(false);
      return;
    }

    let shareUrl = '';
    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    } else if (platform === 'x') {
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareTitle)}`;
    } else if (platform === 'zalo') {
      shareUrl = `https://zalo.me/share?url=${encodeURIComponent(url)}`;
    }
    
    if (shareUrl) window.open(shareUrl, '_blank');
    setShareOpen(false);
  };

  const getFormattedDate = () => {
    if (devotionalData?.published_at) {
      const d = new Date(devotionalData.published_at);
      const days = [
        t('page_devotional.days.sun'),
        t('page_devotional.days.mon'),
        t('page_devotional.days.tue'),
        t('page_devotional.days.wed'),
        t('page_devotional.days.thu'),
        t('page_devotional.days.fri'),
        t('page_devotional.days.sat')
      ];
      return `${days[d.getDay()]}, ${d.getDate()} ${t('page_devotional.month_prefix')} ${d.getMonth() + 1}, ${d.getFullYear()}`;
    }
    return day;
  };

  return (
    <div className="devotional-reader-container">
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#48BCE1', color: '#fff', padding: '10px 20px', borderRadius: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <header className="devotional-reader-header">
        <button onClick={() => router.back()} className="back-btn">
          <ChevronLeft size={24} /> {t('page_devotional.btn_back')}
        </button>
        <div className="header-actions">
          <button className="action-btn" onClick={handleFavorite}>
            <Heart size={20} fill={liked ? "#F12D5C" : "none"} color={liked ? "#F12D5C" : "currentColor"} />
          </button>
          <button className="action-btn" onClick={() => setShareOpen(true)}>
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <main className="devotional-reader-main">
        <div className="dev-meta" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="dev-badge" style={{ textTransform: 'capitalize' }}>{getFormattedDate()}</span>
            <span className="dev-time"><Clock size={14} /> {duration}</span>
          </div>
          {devotionalData?.author && (
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
              {t('page_devotional.author_prefix')} {devotionalData.author}
            </span>
          )}
        </div>

        <h1 className="dev-reader-title">{title}</h1>

        <div className="dev-verse-box">
          <BookOpen size={24} className="verse-icon" />
          <p className="dev-verse-text">"{text}"</p>
          {(() => {
            const parsed = parseVerseReference(verse);
            if (parsed.book && parsed.chapter) {
              const href = `/bible?book=${parsed.book}&chapter=${parsed.chapter}${parsed.verse ? `&verse=${parsed.verse}` : ''}`;
              return (
                <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <p className="dev-verse-ref" style={{ textDecoration: 'underline', textDecorationStyle: 'dashed', textUnderlineOffset: '4px' }}>— {verse}</p>
                </Link>
              );
            }
            return <p className="dev-verse-ref">— {verse}</p>;
          })()}
        </div>

        <div className="dev-content">
          <p>
            {t('page_devotional.content_p1')}
          </p>
          <p>
            {t('page_devotional.content_p2')}
          </p>
          <p>
            <strong>{t('page_devotional.prayer_label')}</strong><br/>
            {t('page_devotional.prayer_text')}
          </p>
        </div>
        
        <CommentSection postType="devotional" postId={id} />
      </main>

      {/* Share Modal — Bottom Sheet */}
      {shareOpen && (
        <>
          <div className="share-overlay" onClick={() => setShareOpen(false)} />
          <div className="share-modal-card">
            {/* Handle bar */}
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4, margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>{t('page_devotional.share_title')}</h3>
              <button
                onClick={() => setShareOpen(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', color: '#9ca3af', cursor: 'pointer', padding: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="share-grid">
              <button className="share-btn" onClick={() => handleShareClick('facebook')}>
                <div className="share-icon-wrap facebook">
                  <SharePlatformIcon id="facebook" />
                </div>
                <span>Facebook</span>
              </button>

              <button className="share-btn" onClick={() => handleShareClick('zalo')}>
                <div className="share-icon-wrap zalo">
                  <SharePlatformIcon id="zalo" />
                </div>
                <span>Zalo</span>
              </button>

              <button className="share-btn" onClick={() => handleShareClick('x')}>
                <div className="share-icon-wrap x">
                  <SharePlatformIcon id="x" />
                </div>
                <span>X (Twitter)</span>
              </button>

              <button className="share-btn" onClick={() => handleShareClick('instagram')}>
                <div className="share-icon-wrap instagram">
                  <SharePlatformIcon id="instagram" />
                </div>
                <span>Instagram</span>
              </button>

              <button className="share-btn" onClick={() => handleShareClick('copy')}>
                <div className="share-icon-wrap copy">
                  <Link2 size={22} color="#fff" />
                </div>
                <span>{t('page_devotional.copy_link')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DevotionalReader() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>{t('page_devotional.loading')}</div>}>
      <DevotionalContent />
    </Suspense>
  );
}
