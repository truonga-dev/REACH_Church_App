'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Edit3, Heart, CreditCard, Send, Loader2, Save
} from 'lucide-react';
import { LivestreamSkeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getActiveLivestream, getSermonNote, saveSermonNote } from '@/lib/livestreams';
import type { Livestream, SermonNote } from '@/lib/livestreams';
import './page.css';

export default function LivePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [livestream, setLivestream] = useState<Livestream | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'note' | 'prayer' | 'donate'>('note');

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
      if (live && user) {
        const existingNote = await getSermonNote(user.id, live.id);
        if (existingNote) {
          setNoteContent(existingNote.content);
        }
      }
    } catch (error) {
      console.error('Failed to fetch livestream:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!user || !livestream || noteContent.trim() === '') return;
    
    const timeoutId = setTimeout(async () => {
      setNoteSaving(true);
      try {
        await saveSermonNote(user.id, livestream.id, noteContent);
        setLastSaved(new Date());
      } catch (e) {
        console.error('Auto-save failed:', e);
      } finally {
        setNoteSaving(false);
      }
    }, 2000); // Save 2 seconds after last keystroke

    return () => clearTimeout(timeoutId);
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
    } catch (e) {
      console.error(e);
    } finally {
      setPrayerSubmitting(false);
    }
  };

  if (loading) {
    return <LivestreamSkeleton />;
  }

  if (!livestream) {
    return (
      <div className="live-page-container center">
        <ArrowLeft className="back-btn" onClick={() => router.push('/')} />
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <h2>Hiện tại không có chương trình trực tiếp nào.</h2>
          <p style={{ opacity: 0.7, marginTop: 10 }}>Vui lòng quay lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="live-page-container">
      <div className="live-header">
        <button onClick={() => router.push('/')} className="back-btn">
          <ArrowLeft size={24} />
        </button>
        <div className="live-badge">🔴 TRỰC TIẾP</div>
      </div>

      <div className="video-container">
        <iframe
          src={`https://www.youtube.com/embed/${livestream.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
          title="Livestream"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="youtube-iframe"
        />
      </div>

      <div className="live-info">
        <h1 className="live-title">{livestream.title}</h1>
        {livestream.description && <p className="live-desc">{livestream.description}</p>}
      </div>

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

      <div className="live-tab-content">
        {activeTab === 'note' && (
          <div className="note-tab">
            <div className="note-header">
              <h3>Ghi chép cá nhân</h3>
              <span className="save-status">
                {noteSaving ? (
                  <><Loader2 size={12} className="spinner" /> Đang lưu...</>
                ) : lastSaved ? (
                  <><Save size={12} /> Đã lưu {lastSaved.toLocaleTimeString('vi-VN')}</>
                ) : null}
              </span>
            </div>
            {!user ? (
              <div className="auth-warning">
                Vui lòng <Link href="/login">đăng nhập</Link> để lưu ghi chú bài giảng.
              </div>
            ) : (
              <textarea
                className="note-textarea"
                placeholder="Ghi chú những điều Chúa soi sáng cho bạn hôm nay..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
            )}
          </div>
        )}

        {activeTab === 'prayer' && (
          <div className="prayer-tab">
            <h3>Gửi yêu cầu cầu nguyện</h3>
            <p>Ban Cầu Nguyện sẽ cùng hiệp ý ngay lập tức.</p>
            {!user ? (
              <div className="auth-warning">
                Vui lòng <Link href="/login">đăng nhập</Link> để gửi yêu cầu.
              </div>
            ) : prayerSuccess ? (
              <div className="prayer-success">
                <Heart size={32} color="#f43f5e" />
                <h4>Đã gửi thành công!</h4>
                <p>Mục sư và Ban Cầu Nguyện đã nhận được yêu cầu của bạn.</p>
              </div>
            ) : (
              <form onSubmit={handlePrayerSubmit}>
                <textarea
                  className="note-textarea"
                  style={{ minHeight: '100px' }}
                  placeholder="Xin hãy cầu nguyện cho tôi về việc..."
                  value={prayerContent}
                  onChange={(e) => setPrayerContent(e.target.value)}
                  required
                />
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
    </div>
  );
}
