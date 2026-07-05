'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Flame, BookOpen, ChevronRight } from 'lucide-react';
import type { BibleReadingPlan, UserReadingProgress, UserStreak } from '@/types';

interface BiblePlansProps {
  onStartReading?: () => void;
}

export default function BiblePlans({ onStartReading }: BiblePlansProps = {}) {
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
        <p>Đang tải kế hoạch...</p>
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
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(255,122,0,0.3)'
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '50%', 
          width: '60px', 
          height: '60px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Flame size={32} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 4px', fontWeight: 800 }}>Chuỗi ngày đọc (Streak)</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Hiện tại: <strong>{streak?.current_streak || 0} ngày</strong> • Kỷ lục: {streak?.longest_streak || 0} ngày
          </p>
        </div>
      </div>

      <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '16px', fontWeight: 700 }}>
        Kế Hoạch Khuyến Nghị
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {plans.map(plan => {
          const planProgress = progress.filter(p => p.plan_id === plan.id);
          const percent = plan.duration_days > 0 ? Math.round((planProgress.length / plan.duration_days) * 100) : 0;

          return (
            <div key={plan.id} style={{ 
              background: 'rgba(255,255,255,0.05)', 
              borderRadius: '16px', 
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ color: '#48BCE1', margin: '0 0 8px', fontSize: '1.1rem' }}>{plan.title}</h4>
                  <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {plan.description}
                  </p>
                </div>
                <div style={{ background: 'rgba(72,188,225,0.1)', color: '#48BCE1', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                  {plan.duration_days} ngày
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#888' }}>Tiến độ</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{percent}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#48BCE1', width: `${percent}%`, height: '100%', borderRadius: '4px' }} />
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
                  padding: '14px',
                  borderRadius: '12px',
                  marginTop: '20px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Tiếp Tục Đọc <ChevronRight size={18} />
              </button>
            </div>
          );
        })}
        {plans.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            <BookOpen size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <p>Hiện chưa có kế hoạch nào được tạo.</p>
          </div>
        )}
      </div>
    </div>
  );
}
