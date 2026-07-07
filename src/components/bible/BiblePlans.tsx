'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Flame, BookOpen, ChevronRight } from 'lucide-react';
import type { BibleReadingPlan, UserReadingProgress, UserStreak } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface BiblePlansProps {
  onStartReading?: () => void;
}

export default function BiblePlans({ onStartReading }: BiblePlansProps = {}) {
  const { t, getDbField } = useLanguage();
  const [plans, setPlans] = useState<BibleReadingPlan[]>([]);
  const [progress, setProgress] = useState<UserReadingProgress[]>([]);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (uid) setUserId(uid);

      // Fetch all available plans
      const { data: plansData } = await supabase.from('bible_reading_plans').select('*');
      if (plansData) setPlans(plansData);

      if (uid) {
        // Fetch user progress
        const { data: progressData } = await supabase
          .from('user_reading_progress')
          .select('*')
          .eq('user_id', uid);
        if (progressData) setProgress(progressData);

        // Fetch user streak
        const { data: streakData } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', uid)
          .single();
        if (streakData) setStreak(streakData);
      }
    } catch (error) {
      console.error('Error fetching bible plans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
        <Loader2 className="spin" size={24} style={{ margin: '0 auto 10px' }} />
        <p>{t('bible_plans.loading') || 'Đang tải kế hoạch...'}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', overflowY: 'auto', height: '100%' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #ff7a00, #ff3366)', 
        borderRadius: '16px', 
        padding: '20px', 
        color: 'white',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(255,122,0,0.25)'
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.25)', 
          borderRadius: '50%', 
          width: '64px', 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(10px)'
        }}>
          <Flame size={32} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 6px', fontWeight: 800 }}>{t('bible_plans.streak') || 'Chuỗi ngày đọc'}</h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
            {t('bible_plans.current') || 'Hiện tại:'} <strong>{streak?.current_streak || 0} {t('bible_plans.days') || 'ngày'}</strong> • {t('bible_plans.record') || 'Kỷ lục:'} {streak?.longest_streak || 0}
          </p>
        </div>
      </div>

      <h3 style={{ color: 'var(--color-text-main)', fontSize: '1.25rem', marginBottom: '20px', fontWeight: 800 }}>
        {t('bible_plans.recommended') || 'Kế Hoạch Khuyến Nghị'}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {plans.map(plan => {
          const planProgress = progress.filter(p => p.plan_id === plan.id);
          const percent = plan.duration_days > 0 ? Math.round((planProgress.length / plan.duration_days) * 100) : 0;

          return (
            <div key={plan.id} style={{ 
              background: 'var(--color-surface)', 
              borderRadius: '20px', 
              padding: '24px',
              border: '1px solid var(--color-border)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 800 }}>{getDbField(plan, 'title')}</h4>
                  <p style={{ color: 'var(--color-text-dim)', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {getDbField(plan, 'description')}
                  </p>
                </div>
                <div style={{ background: 'rgba(72,188,225,0.1)', color: '#48BCE1', padding: '6px 14px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {plan.duration_days} {t('bible_plans.days') || 'ngày'}
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--color-text-dim)', fontWeight: 600 }}>{t('bible_plans.progress') || 'Tiến độ'}</span>
                  <span style={{ color: 'var(--color-text-main)', fontWeight: 800 }}>{percent}%</span>
                </div>
                <div style={{ background: 'var(--color-border)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ background: '#48BCE1', width: `${percent}%`, height: '100%', borderRadius: '5px', transition: 'width 0.5s ease-out' }} />
                </div>
              </div>

              <button 
                onClick={() => {
                  if (onStartReading) onStartReading();
                }}
                style={{
                  width: '100%',
                  background: '#48BCE1',
                  color: '#fff',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '16px',
                  marginTop: '24px',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'transform 0.1s, opacity 0.2s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {t('bible_plans.continue') || 'Tiếp Tục Đọc'} <ChevronRight size={20} />
              </button>
            </div>
          );
        })}
        {plans.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-dim)', background: 'var(--color-surface)', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
            <BookOpen size={48} style={{ opacity: 0.3, margin: '0 auto 16px', color: 'var(--color-text-main)' }} />
            <p style={{ margin: 0, fontWeight: 500 }}>{t('bible_plans.no_plans') || 'Hiện chưa có kế hoạch nào được tạo.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
