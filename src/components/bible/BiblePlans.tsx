'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Flame, BookOpen, ChevronRight, ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import type { BibleReadingPlan, UserReadingProgress, UserStreak, BiblePlanDay } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface BiblePlansProps {
  onStartReading?: (book?: number, chapter?: number) => void;
}

const BIBLE_BOOKS = [
  'Sáng-thế Ký', 'Xuất Ê-díp-tô Ký', 'Lê-vi Ký', 'Dân-số Ký', 'Phục-truyền Luật-lệ Ký',
  'Giô-suê', 'Các Quan Xét', 'Ru-tơ', '1 Sa-mu-ên', '2 Sa-mu-ên', '1 Các Vua', '2 Các Vua',
  '1 Sử-ký', '2 Sử-ký', 'Ê-xơ-ra', 'Nê-hê-mi', 'Ê-xơ-tê', 'Gióp', 'Thi-thiên', 'Châm-ngôn',
  'Truyền-đạo', 'Nhã-ca', 'Ê-sai', 'Giê-rê-mi', 'Ca-thương', 'Ê-xê-chi-ên', 'Đa-ni-ên',
  'Ô-sê', 'Giô-ên', 'A-mốt', 'Áp-đia', 'Giô-na', 'Mi-chê', 'Na-hum', 'Ha-ba-cúc', 'Sô-phô-ni',
  'A-gai', 'Xa-cha-ri', 'Ma-la-chi', 'Ma-thi-ơ', 'Mác', 'Lu-ca', 'Giăng', 'Công-vụ các Sứ-đồ',
  'Rô-ma', '1 Cô-rinh-tô', '2 Cô-rinh-tô', 'Ga-la-ti', 'Ê-phê-sô', 'Phi-líp', 'Cô-lô-se',
  '1 Tê-sa-lô-ni-ca', '2 Tê-sa-lô-ni-ca', '1 Ti-mô-thê', '2 Ti-mô-thê', 'Tít', 'Phi-lê-môn',
  'Hê-bơ-rơ', 'Gia-cơ', '1 Phi-e-rơ', '2 Phi-e-rơ', '1 Giăng', '2 Giăng', '3 Giăng', 'Giu-đe', 'Khải-huyền',
];

function extractBookAndChapter(referenceText: string) {
  const normalized = referenceText.toLowerCase().replace(/-/g, ' ');
  for (let i = 0; i < BIBLE_BOOKS.length; i++) {
    const bookName = BIBLE_BOOKS[i].toLowerCase().replace(/-/g, ' ');
    if (normalized.includes(bookName)) {
      const regex = new RegExp(bookName + "\\s+(\\d+)", "i");
      const match = normalized.match(regex);
      if (match) {
        return { book: i + 1, chapter: parseInt(match[1]) };
      }
    }
  }
  return { book: null, chapter: null };
}

export default function BiblePlans({ onStartReading }: BiblePlansProps = {}) {
  const { t, getDbField } = useLanguage();
  const [plans, setPlans] = useState<BibleReadingPlan[]>([]);
  const [progress, setProgress] = useState<UserReadingProgress[]>([]);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Detail View State
  const [selectedPlan, setSelectedPlan] = useState<BibleReadingPlan | null>(null);
  const [planDays, setPlanDays] = useState<BiblePlanDay[]>([]);
  const [loadingDays, setLoadingDays] = useState(false);
  const [markingDay, setMarkingDay] = useState<number | null>(null);

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

  const loadPlanDetails = async (plan: BibleReadingPlan) => {
    setSelectedPlan(plan);
    setLoadingDays(true);
    try {
      const { data } = await supabase
        .from('bible_plan_days')
        .select('*')
        .eq('plan_id', plan.id)
        .order('day_number', { ascending: true });
      if (data) setPlanDays(data);
    } catch (error) {
      console.error('Error fetching plan days:', error);
    } finally {
      setLoadingDays(false);
    }
  };

  const handleMarkDayComplete = async (planId: string, dayNumber: number) => {
    if (!userId) {
      alert("Vui lòng đăng nhập để lưu tiến độ đọc.");
      return;
    }
    setMarkingDay(dayNumber);
    try {
      // 1. Insert progress
      const { error: progressError } = await supabase
        .from('user_reading_progress')
        .insert([{ user_id: userId, plan_id: planId, day_number: dayNumber }]);
      
      if (progressError) throw progressError;

      // 2. Update local progress state
      const newProgress: UserReadingProgress = {
        id: Math.random().toString(),
        user_id: userId,
        plan_id: planId,
        day_number: dayNumber,
        completed_at: new Date().toISOString()
      };
      setProgress(prev => [...prev, newProgress]);

      // 3. Update Streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let newStreak = { ...streak } as UserStreak;
      if (!streak) {
        newStreak = {
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_read_date: today.toISOString(),
          updated_at: new Date().toISOString()
        };
        await supabase.from('user_streaks').insert([newStreak]);
      } else {
        const lastRead = streak.last_read_date ? new Date(streak.last_read_date) : null;
        if (lastRead) lastRead.setHours(0, 0, 0, 0);
        
        const diffTime = lastRead ? Math.abs(today.getTime() - lastRead.getTime()) : -1;
        const diffDays = lastRead ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : -1;

        if (diffDays === 1) {
          // Read yesterday -> increase streak
          newStreak.current_streak += 1;
        } else if (diffDays > 1 || diffDays === -1) {
          // Missed a day -> reset streak
          newStreak.current_streak = 1;
        }
        
        if (newStreak.current_streak > newStreak.longest_streak) {
          newStreak.longest_streak = newStreak.current_streak;
        }
        newStreak.last_read_date = today.toISOString();
        
        await supabase.from('user_streaks').update(newStreak).eq('user_id', userId);
      }
      setStreak(newStreak);

    } catch (error) {
      console.error('Error marking day complete:', error);
      alert('Đã xảy ra lỗi khi lưu tiến độ. Vui lòng thử lại.');
    } finally {
      setMarkingDay(null);
    }
  };

  const handleStartReadingDay = (versesStr: string) => {
    if (!onStartReading) return;
    try {
      const parsed = JSON.parse(versesStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const { book, chapter } = extractBookAndChapter(parsed[0]);
        if (book !== null && chapter !== null) {
          onStartReading(book, chapter);
          return;
        }
      }
    } catch(e) {
      // Fallback if not valid JSON
      const { book, chapter } = extractBookAndChapter(versesStr);
      if (book !== null && chapter !== null) {
        onStartReading(book, chapter);
        return;
      }
    }
    // If we can't parse it, just open the reader
    onStartReading();
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
        <Loader2 className="spin" size={24} style={{ margin: '0 auto 10px' }} />
        <p>{t('bible_plans.loading') || 'Đang tải kế hoạch...'}</p>
      </div>
    );
  }

  // --- DETAILS VIEW ---
  if (selectedPlan) {
    const planProgress = progress.filter(p => p.plan_id === selectedPlan.id);
    const percent = selectedPlan.duration_days > 0 ? Math.round((planProgress.length / selectedPlan.duration_days) * 100) : 0;

    return (
      <div style={{ padding: '20px', paddingBottom: '100px', overflowY: 'auto', height: '100%' }}>
        <button 
          onClick={() => setSelectedPlan(null)}
          style={{ background: 'none', border: 'none', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0, marginBottom: '20px', fontSize: '1rem', fontWeight: 600 }}
        >
          <ArrowLeft size={20} /> Trở về
        </button>

        <h2 style={{ color: 'var(--color-text-main)', fontSize: '1.5rem', margin: '0 0 10px', fontWeight: 800 }}>
          {getDbField(selectedPlan, 'title')}
        </h2>
        <p style={{ color: 'var(--color-text-dim)', margin: '0 0 24px', lineHeight: 1.5 }}>
          {getDbField(selectedPlan, 'description')}
        </p>

        <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '20px', marginBottom: '24px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
            <span style={{ color: 'var(--color-text-dim)', fontWeight: 600 }}>{t('bible_plans.progress') || 'Tiến độ'}</span>
            <span style={{ color: '#48BCE1', fontWeight: 800 }}>{planProgress.length} / {selectedPlan.duration_days} {t('bible_plans.days') || 'ngày'} ({percent}%)</span>
          </div>
          <div style={{ background: 'var(--color-border)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ background: '#48BCE1', width: `${percent}%`, height: '100%', borderRadius: '6px', transition: 'width 0.5s ease-out' }} />
          </div>
        </div>

        {loadingDays ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Loader2 className="spin" size={24} style={{ margin: '0 auto', color: '#48bce1' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from({ length: selectedPlan.duration_days }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayData = planDays.find(d => d.day_number === dayNum);
              const isCompleted = progress.some(p => p.plan_id === selectedPlan.id && p.day_number === dayNum);
              
              let versesDisplay = 'Nghỉ ngơi';
              let rawVerses = '';
              if (dayData && dayData.verses) {
                rawVerses = dayData.verses;
                try {
                  const parsed = JSON.parse(dayData.verses);
                  if (Array.isArray(parsed)) versesDisplay = parsed.join(', ');
                } catch(e) {
                  versesDisplay = dayData.verses;
                }
              }

              return (
                <div key={dayNum} style={{ 
                  background: 'var(--color-surface)', 
                  borderRadius: '16px', 
                  padding: '16px',
                  border: `1px solid ${isCompleted ? '#48bce1' : 'var(--color-border)'}`,
                  opacity: isCompleted ? 0.7 : 1,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ color: isCompleted ? '#48bce1' : 'var(--color-text-dim)' }}>
                    {isCompleted ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: isCompleted ? '#48bce1' : 'var(--color-text-main)', fontWeight: 700 }}>
                      Ngày {dayNum}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                      {versesDisplay}
                    </p>
                  </div>
                  
                  {!isCompleted && dayData && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleStartReadingDay(rawVerses)}
                        style={{ background: 'rgba(72,188,225,0.1)', color: '#48bce1', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Đọc
                      </button>
                      <button 
                        disabled={markingDay === dayNum}
                        onClick={() => handleMarkDayComplete(selectedPlan.id, dayNum)}
                        style={{ background: '#48bce1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: markingDay === dayNum ? 'not-allowed' : 'pointer', opacity: markingDay === dayNum ? 0.5 : 1 }}
                      >
                        {markingDay === dayNum ? <Loader2 size={16} className="spin" /> : 'Hoàn thành'}
                      </button>
                    </div>
                  )}
                  {isCompleted && (
                    <div style={{ color: '#48bce1', fontWeight: 600, fontSize: '0.9rem', padding: '8px' }}>
                      Đã hoàn thành
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- LIST VIEW ---
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
                onClick={() => loadPlanDetails(plan)}
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
                {t('bible_plans.continue') || 'Xem Kế Hoạch'} <ChevronRight size={20} />
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
