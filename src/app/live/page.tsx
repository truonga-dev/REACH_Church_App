'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Edit3, Heart, CreditCard, Send, Loader2, Save,
  Play, Tv2, Radio, Share2, Users, Clock, Wifi, X, Link2
} from 'lucide-react';
import SharePlatformIcon from '@/components/bible/SharePlatformIcon';
import { LivestreamSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getActiveLivestream, getSermonNote, saveSermonNote } from '@/lib/livestreams';
import type { Livestream, SermonNote } from '@/lib/livestreams';
import { getYoutubeId } from '@/lib/youtube';
import { useLanguage } from '@/contexts/LanguageContext';
import './page.css';

type VideoSource = 'youtube' | 'facebook';

function getFacebookVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Support: https://www.facebook.com/watch?v=ID or /videos/ID or fb.watch/ID
  const m = url.match(/(?:watch\?v=|\/videos\/|fb\.watch\/)([0-9]+)/);
  return m ? m[1] : null;
}

function FacebookPlayer({ url }: { url: string }) {
  const encodedUrl = encodeURIComponent(url);
  return (
    <iframe
      src={`https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=false&autoplay=true&mute=false`}
      className="youtube-iframe"
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen
      style={{ border: 'none' }}
    />
  );
}

export default function LivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, getDbField } = useLanguage();
  
  const [livestream, setLivestream] = useState<Livestream | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'note' | 'prayer' | 'donate'>('note');
  const [videoSource, setVideoSource] = useState<VideoSource>('youtube');
  const [shareOpen, setShareOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Note state
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Prayer state
  const [prayerContent, setPrayerContent] = useState('');
  const [prayerSubmitting, setPrayerSubmitting] = useState(false);
  const [prayerSuccess, setPrayerSuccess] = useState(false);

  useEffect(() => {
    fetchLive();
  }, []);

  const fetchLive = async () => {
    try {
      const live = await getActiveLivestream();
      setLivestream(live);
      if (live) {
        // Prefer YouTube; fall back to Facebook
        if (live.facebook_url && !live.youtube_id) setVideoSource('facebook');
        else setVideoSource('youtube');
        if (user) {
          const existingNote = await getSermonNote(user.id, live.id);
          if (existingNote) setNoteContent(existingNote.content);
        }
      }
    } catch (error) {
      console.error('Failed to fetch livestream:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save
  useEffect(() => {
    if (!user || !livestream || noteContent.trim() === '') return;
    const tid = setTimeout(async () => {
      setNoteSaving(true);
      try {
        await saveSermonNote(user.id, livestream.id, noteContent);
        setLastSaved(new Date());
      } catch (e) { console.error('Auto-save failed:', e); }
      finally { setNoteSaving(false); }
    }, 2000);
    return () => clearTimeout(tid);
  }, [noteContent, user, livestream]);

  const handlePrayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !prayerContent.trim()) return;
    setPrayerSubmitting(true);
    try {
      await supabase.from('prayers').insert([{
        user_id: user.id,
        author_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        title: 'Cầu nguyện khẩn cấp (từ Livestream)',
        description: prayerContent,
        status: 'ongoing'
      }]);
      setPrayerSuccess(true);
      setPrayerContent('');
      setTimeout(() => setPrayerSuccess(false), 5000);
    } catch (e) { console.error(e); }
    finally { setPrayerSubmitting(false); }
  };

  const handleShareClick = (platform: string) => {
    const shareUrl = window.location.href;
    const shareText = `Đang phát trực tiếp: ${getDbField(livestream, 'title')}`;
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'zalo':
        window.open(`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'x':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'instagram':
        navigator.clipboard.writeText(shareUrl);
        setToastMsg('Đã sao chép link! Hãy dán vào Instagram.');
        setTimeout(() => setToastMsg(''), 3000);
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        setToastMsg('Đã sao chép link!');
        setTimeout(() => setToastMsg(''), 3000);
        break;
    }
    setShareOpen(false);
  };

  if (loading) return <LivestreamSkeleton />;

  if (!livestream) {
    return (
      <div className="live-page-container center">
        <button onClick={() => router.push('/')} className="back-btn" style={{ position: 'absolute', top: 16, left: 16 }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Wifi size={32} color="#ef4444" />
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: 10 }}>Chưa có chương trình trực tiếp</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>Hội thánh hiện chưa phát sóng. Vui lòng quay lại sau.</p>
          <button onClick={() => router.push('/')} style={{ background: 'linear-gradient(135deg,#48BCE1,#6366f1)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}>
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const hasYoutube = !!livestream.youtube_id;
  const hasFacebook = !!livestream.facebook_url;
  const showSourcePicker = hasYoutube && hasFacebook;
  const youtubeId = getYoutubeId(livestream.youtube_id);

  return (
    <div className="live-page-container">
      {/* Header */}
      <div className="live-header">
        <button onClick={() => router.push('/')} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="live-badge">
            <span style={{ display: 'inline-block', width: 7, height: 7, background: '#fff', borderRadius: '50%', marginRight: 5, animation: 'pulse 1.5s infinite' }} />
            TRỰC TIẾP
          </div>
          {showSourcePicker && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 3, gap: 2 }}>
              <button
                onClick={() => setVideoSource('youtube')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, background: videoSource === 'youtube' ? '#ef4444' : 'transparent', color: '#fff', transition: 'all 0.2s' }}
              >
                <Play size={13} /> YouTube
              </button>
              <button
                onClick={() => setVideoSource('facebook')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, background: videoSource === 'facebook' ? '#1877f2' : 'transparent', color: '#fff', transition: 'all 0.2s' }}
              >
                <Radio size={13} /> Facebook
              </button>
            </div>
          )}
        </div>
        <button onClick={() => setShareOpen(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Share2 size={18} />
        </button>
      </div>

      {/* Video */}
      <div className="video-container">
        {videoSource === 'facebook' && hasFacebook ? (
          <FacebookPlayer url={livestream.facebook_url!} />
        ) : hasYoutube && youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title="Livestream"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="youtube-iframe"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', flexDirection: 'column', gap: 12 }}>
            <Wifi size={40} color="#334155" />
            <p style={{ color: '#475569', fontSize: '0.9rem' }}>Không có nguồn video</p>
          </div>
        )}

        {/* Source badge if only one source */}
        {!showSourcePicker && (hasYoutube || hasFacebook) && (
          <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 2 }}>
            {hasYoutube ? (
              <div style={{ background: '#ef4444', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Play size={12} /> YouTube
              </div>
            ) : (
              <div style={{ background: '#1877f2', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Radio size={12} /> Facebook
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="live-info" style={{ background: 'linear-gradient(180deg,#111827,#0a0f1e)', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 className="live-title">{getDbField(livestream, 'title')}</h1>
        <div className="live-desc" dangerouslySetInnerHTML={{ __html: getDbField(livestream, 'description') || '' }} />
        {livestream.scheduled_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#64748b', fontSize: '0.8rem' }}>
            <Clock size={13} />
            {new Date(livestream.scheduled_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        )}
        {/* Multi-platform links */}
        {showSourcePicker && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {hasYoutube && (
              <a href={`https://youtube.com/watch?v=${youtubeId}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: '0.78rem', textDecoration: 'none' }}>
                <Play size={13} /> Mở trên YouTube
              </a>
            )}
            {hasFacebook && (
              <a href={livestream.facebook_url!} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: 'rgba(24,119,242,0.12)', border: '1px solid rgba(24,119,242,0.3)', color: '#60a5fa', fontSize: '0.78rem', textDecoration: 'none' }}>
                <Radio size={13} /> Mở trên Facebook
              </a>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="live-tabs-nav">
        <button className={`tab-btn ${activeTab === 'note' ? 'active' : ''}`} onClick={() => setActiveTab('note')}>
          <Edit3 size={18} /> Ghi chú
        </button>
        <button className={`tab-btn ${activeTab === 'prayer' ? 'active' : ''}`} onClick={() => setActiveTab('prayer')}>
          <Heart size={18} /> Cầu nguyện
        </button>
        <button className={`tab-btn ${activeTab === 'donate' ? 'active' : ''}`} onClick={() => setActiveTab('donate')}>
          <CreditCard size={18} /> Dâng hiến
        </button>
      </div>

      {/* Tab content */}
      <div className="live-tab-content">
        {activeTab === 'note' && (
          <div className="note-tab">
            <div className="note-header">
              <h3>Ghi chép cá nhân</h3>
              <span className="save-status">
                {noteSaving ? (<><Loader2 size={12} className="spinner" /> Đang lưu...</>) : lastSaved ? (<><Save size={12} /> Đã lưu {lastSaved.toLocaleTimeString('vi-VN')}</>) : null}
              </span>
            </div>
            {!user ? (
              <div className="auth-warning">Vui lòng <Link href="/login">đăng nhập</Link> để lưu ghi chú bài giảng.</div>
            ) : (
              <textarea className="note-textarea" placeholder="Ghi chú những điều Chúa soi sáng cho bạn hôm nay..." value={noteContent} onChange={e => setNoteContent(e.target.value)} />
            )}
          </div>
        )}

        {activeTab === 'prayer' && (
          <div className="prayer-tab">
            <h3>Gửi yêu cầu cầu nguyện</h3>
            <p>Ban Cầu Nguyện sẽ cùng hiệp ý ngay lập tức.</p>
            {!user ? (
              <div className="auth-warning">Vui lòng <Link href="/login">đăng nhập</Link> để gửi yêu cầu.</div>
            ) : prayerSuccess ? (
              <div className="prayer-success">
                <Heart size={32} color="#f43f5e" />
                <h4>Đã gửi thành công!</h4>
                <p>Mục sư và Ban Cầu Nguyện đã nhận được yêu cầu của bạn.</p>
              </div>
            ) : (
              <form onSubmit={handlePrayerSubmit}>
                <textarea className="note-textarea" style={{ minHeight: '100px' }} placeholder="Xin hãy cầu nguyện cho tôi về việc..." value={prayerContent} onChange={e => setPrayerContent(e.target.value)} required />
                <button type="submit" className="submit-prayer-btn" disabled={prayerSubmitting}>
                  {prayerSubmitting ? <Loader2 className="spinner" size={18} /> : <Send size={18} />}
                  Gửi yêu cầu
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'donate' && (
          <div className="donate-tab">
            <h3>Dâng hiến trực tuyến</h3>
            <p>Sử dụng MoMo / VNPay để dâng hiến nhanh chóng không cần thoát khỏi trang này.</p>
            <div className="donate-action-box">
              <Link href="/donate" className="go-donate-btn" target="_blank">
                <CreditCard size={18} /> Đi tới trang Dâng hiến
              </Link>
              <p className="donate-hint">Trang dâng hiến sẽ được mở ở tab mới để không làm gián đoạn video.</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Toast Message */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#48BCE1', color: '#fff', padding: '10px 20px', borderRadius: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toastMsg}
        </div>
      )}

      {/* Share Modal — Bottom Sheet */}
      {shareOpen && (
        <>
          <div className="share-overlay" onClick={() => setShareOpen(false)} />
          <div className="share-modal-card">
            {/* Handle bar */}
            <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4, margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>Chia sẻ trực tiếp</h3>
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
                <span>Sao chép link</span>
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
