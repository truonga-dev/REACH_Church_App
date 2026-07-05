'use client';

import { useState, useEffect } from 'react';
import { Heart, Send } from 'lucide-react';
import { PrayerWallSkeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatSupabaseError } from '@/lib/supabase-errors';
import { buildPrayerInsert, prayerBody, prayerIntercessionCount } from '@/lib/prayer-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { PRAYER_TOPICS, type Prayer } from '@/types';
import './page.css';
import '../bible/page.css';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Vừa xong';
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}

export default function PrayerPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('health');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');
  const [wall, setWall] = useState<Prayer[]>([]);
  const [loadingWall, setLoadingWall] = useState(true);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('reach_prayed_ids');
    if (saved) setPrayedIds(new Set(JSON.parse(saved)));
    fetchWall();
  }, []);

  const fetchWall = async () => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .or('is_private.is.null,is_private.eq.false')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setWall((data as Prayer[]) || []);
    } catch (err) {
      console.error('Không tải bức tường cầu nguyện:', formatSupabaseError(err));
    } finally {
      setLoadingWall(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Vui lòng nhập nội dung cầu nguyện.');
      return;
    }

    setSubmitting(true);
    try {
      const topicLabel = PRAYER_TOPICS[topic] || topic;
      const trimmed = content.trim();
      const payload = buildPrayerInsert({
        title: `[${topicLabel}] ${trimmed.slice(0, 80)}${trimmed.length > 80 ? '...' : ''}`,
        content: trimmed,
        category: topic,
        userId: user?.id,
        isPrivate,
      });

      const { error } = await supabase.from('prayers').insert([payload]);
      if (error) throw error;

      showToast('🙏 Đã gửi lời cầu nguyện. Ban cầu nguyện sẽ đồng hành cùng bạn!');
      setContent('');
      setName('');
      setIsPrivate(false);
      if (!isPrivate) fetchWall();
    } catch (err) {
      console.error('Không gửi được lời cầu nguyện:', formatSupabaseError(err));
      showToast('Không gửi được. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrayFor = async (prayer: Prayer) => {
    if (prayedIds.has(prayer.id)) return;

    const newCount = prayerIntercessionCount(prayer) + 1;
    const { error } = await supabase
      .from('prayers')
      .update({ prayer_count: newCount })
      .eq('id', prayer.id);

    if (!error) {
      const updated = new Set(prayedIds);
      updated.add(prayer.id);
      setPrayedIds(updated);
      localStorage.setItem('reach_prayed_ids', JSON.stringify([...updated]));
      setWall((prev) =>
        prev.map((p) => (p.id === prayer.id ? { ...p, prayer_count: newCount, pray_count: newCount } : p)),
      );
    }
  };

  return (
    <div className="page-container">
      {toast && <div className="prayer-toast">{toast}</div>}

      <header className="page-header text-center">
        <div className="heart-icon-wrapper mx-auto">
          <Heart size={32} className="text-accent" />
        </div>
        <h1 className="page-title mt-sm">Cầu Nguyện</h1>
        <p className="page-subtitle">&quot;Hãy vui mừng mãi mãi, cầu nguyện không thôi&quot; - 1 Tê-sa-lô-ni-ca 5:16-17</p>
        {!user && (
          <p className="text-sm" style={{ marginTop: '0.5rem' }}>
            <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Đăng nhập</Link>
            {' '}để theo dõi đề mục cầu nguyện của bạn.
          </p>
        )}
      </header>

      <section className="section">
        <div className="prayer-form-card">
          <h2 className="section-title mb-sm">Gửi Nhu Cầu Cầu Nguyện</h2>
          <p className="text-muted text-sm mb-md">Mục sư và Ban cầu nguyện luôn sẵn sàng đồng hành cùng bạn trong sự cầu thay.</p>

          <form className="prayer-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Họ và tên (Tùy chọn)</label>
              <input
                type="text"
                id="name"
                placeholder="Nhập tên của bạn"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="topic">Chủ đề</label>
              <select id="topic" className="form-control" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {Object.entries(PRAYER_TOPICS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="content">Nội dung cầu nguyện</label>
              <textarea
                id="content"
                rows={4}
                required
                placeholder="Xin hãy cầu nguyện cho..."
                className="form-control"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              <label htmlFor="private">Chỉ gửi riêng cho Mục sư (Không công khai)</label>
            </div>

            <button type="submit" className="btn-primary w-full mt-sm flex-center" disabled={submitting}>
              <Send size={18} className="mr-sm" />
              {submitting ? 'Đang gửi...' : 'Gửi lời cầu nguyện'}
            </button>
          </form>
        </div>
      </section>

      <section className="section mt-md">
        <h2 className="section-title">Danh Sách Cầu Nguyện</h2>
        {loadingWall ? (
          <PrayerWallSkeleton />
        ) : wall.length === 0 ? (
          <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '1rem' }}>
            Chưa có lời cầu nguyện công khai. Hãy là người đầu tiên!
          </p>
        ) : (
          <div className="prayer-wall">
            {wall.map((p) => {
              const prayed = prayedIds.has(p.id);
              return (
                <div key={p.id} className="prayer-request">
                  <div className="prayer-meta">
                    <span className="prayer-author">{p.author_name || 'Ẩn danh'}</span>
                    <span className="prayer-time">{timeAgo(p.created_at)}</span>
                  </div>
                  <p className="prayer-content">{prayerBody(p)}</p>
                  <button
                    type="button"
                    className={`btn-pray ${prayed ? 'active' : ''}`}
                    onClick={() => handlePrayFor(p)}
                  >
                    <Heart size={16} className="mr-xs" fill={prayed ? 'currentColor' : 'none'} />
                    {prayed ? 'Đã cầu nguyện' : 'Cầu nguyện'} ({prayerIntercessionCount(p)})
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
