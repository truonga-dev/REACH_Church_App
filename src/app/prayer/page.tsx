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
import { useLanguage } from '@/contexts/LanguageContext';
import './page.css';
import '../bible/page.css';

function useTimeAgo() {
  const { t } = useLanguage();
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t('page_prayer.time_just_now');
    if (hours < 24) return t('page_prayer.time_hours_ago').replace('{{hours}}', hours.toString());
    const days = Math.floor(hours / 24);
    if (days === 1) return t('page_prayer.time_yesterday');
    return t('page_prayer.time_days_ago').replace('{{days}}', days.toString());
  };
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
  const { t } = useLanguage();
  const timeAgo = useTimeAgo();

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
      showToast(t('page_prayer.toast_empty'));
      return;
    }

    setSubmitting(true);
    try {
      const topicLabel = t(`page_prayer.topic_${topic}`) || topic;
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

      showToast(t('page_prayer.toast_success'));
      setContent('');
      setName('');
      setIsPrivate(false);
      if (!isPrivate) fetchWall();
    } catch (err) {
      console.error('Không gửi được lời cầu nguyện:', formatSupabaseError(err));
      showToast(t('page_prayer.toast_error'));
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
        <h1 className="page-title mt-sm">{t('page_prayer.title')}</h1>
        <p className="page-subtitle">{t('page_prayer.subtitle')}</p>
        {!user && (
          <p className="text-sm" style={{ marginTop: '0.5rem' }}>
            <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t('page_prayer.login_prompt1')}</Link>
            {t('page_prayer.login_prompt2')}
          </p>
        )}
      </header>

      <section className="section">
        <div className="prayer-form-card">
          <h2 className="section-title mb-sm">{t('page_prayer.form_title')}</h2>
          <p className="text-muted text-sm mb-md">{t('page_prayer.form_desc')}</p>

          <form className="prayer-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">{t('page_prayer.label_name')}</label>
              <input
                type="text"
                id="name"
                placeholder={t('page_prayer.placeholder_name')}
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="topic">{t('page_prayer.label_topic')}</label>
              <select id="topic" className="form-control" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {Object.keys(PRAYER_TOPICS).map((k) => (
                  <option key={k} value={k}>{t(`page_prayer.topic_${k}`)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="content">{t('page_prayer.label_content')}</label>
              <textarea
                id="content"
                rows={4}
                required
                placeholder={t('page_prayer.placeholder_content')}
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
              <label htmlFor="private">{t('page_prayer.label_private')}</label>
            </div>

            <button type="submit" className="btn-primary w-full mt-sm flex-center" disabled={submitting}>
              <Send size={18} className="mr-sm" />
              {submitting ? t('page_prayer.btn_submitting') : t('page_prayer.btn_submit')}
            </button>
          </form>
        </div>
      </section>

      <section className="section mt-md">
        <h2 className="section-title">{t('page_prayer.wall_title')}</h2>
        {loadingWall ? (
          <PrayerWallSkeleton />
        ) : wall.length === 0 ? (
          <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '1rem' }}>
            {t('page_prayer.wall_empty')}
          </p>
        ) : (
          <div className="prayer-wall">
            {wall.map((p) => {
              const prayed = prayedIds.has(p.id);
              return (
                <div key={p.id} className="prayer-request">
                  <div className="prayer-meta">
                    <span className="prayer-author">{p.author_name || t('page_prayer.author_anonymous')}</span>
                    <span className="prayer-time">{timeAgo(p.created_at)}</span>
                  </div>
                  <p className="prayer-content">{prayerBody(p)}</p>
                  <button
                    type="button"
                    className={`btn-pray ${prayed ? 'active' : ''}`}
                    onClick={() => handlePrayFor(p)}
                  >
                    <Heart size={16} className="mr-xs" fill={prayed ? 'currentColor' : 'none'} />
                    {prayed ? t('page_prayer.btn_prayed') : t('page_prayer.btn_pray')} ({prayerIntercessionCount(p)})
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
