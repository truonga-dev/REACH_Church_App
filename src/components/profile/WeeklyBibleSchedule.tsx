'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Circle, BookOpen, Flame, CalendarDays, TrendingUp } from 'lucide-react';
import {
  WEEKLY_READING_PLAN,
  getTodayReading,
  getTodayWeekdayIndex,
  isDayCompleted,
  setDayCompleted,
  getWeeklyProgress,
} from '@/lib/weekly-bible-plan';

interface WeeklyBibleScheduleProps {
  onBack: () => void;
  readingStreak: number;
  readingDays: number;
}

export default function WeeklyBibleSchedule({ onBack, readingStreak, readingDays }: WeeklyBibleScheduleProps) {
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    WEEKLY_READING_PLAN.forEach((d) => {
      map[d.id] = isDayCompleted(d.id);
    });
    return map;
  });
  const [progress, setProgress] = useState(() => getWeeklyProgress());

  const refresh = () => {
    const map: Record<string, boolean> = {};
    WEEKLY_READING_PLAN.forEach((d) => {
      map[d.id] = isDayCompleted(d.id);
    });
    setCompleted(map);
    setProgress(getWeeklyProgress());
  };

  const todayIdx = getTodayWeekdayIndex();
  const todayPlan = getTodayReading();

  const toggleDone = (dayId: string) => {
    const next = !completed[dayId];
    setDayCompleted(dayId, next);
    refresh();
  };

  return (
    <div className="settings-screen">
      <button type="button" className="settings-back" onClick={onBack}>
        <ArrowLeft size={18} /> Lịch đọc Kinh Thánh hằng tuần
      </button>

      <section className="weekly-hero-card">
        <div className="weekly-hero-copy">
          <p className="weekly-kicker">Kế hoạch đọc cá nhân</p>
          <h2 className="weekly-hero-title">Đọc theo nhịp một tuần, gọn hơn và dễ theo dõi hơn</h2>
          <p className="weekly-hero-desc">
            Theo dõi tiến độ, đánh dấu đã đọc và mở nhanh Kinh Thánh ngay tại đây.
          </p>
        </div>
        <div className="weekly-hero-meta">
          <div className="weekly-meta-pill">
            <Flame size={16} /> <span>{readingStreak} ngày liên tiếp</span>
          </div>
          <div className="weekly-meta-pill">
            <TrendingUp size={16} /> <span>{readingDays} ngày tổng</span>
          </div>
          <div className="weekly-meta-pill">
            <CalendarDays size={16} /> <span>{progress.done}/{progress.total} của tuần này</span>
          </div>
        </div>
      </section>

      <div className="weekly-summary weekly-summary-grid">
        <div className="weekly-summary-stat weekly-stat-card">
          <span className="weekly-summary-num">{progress.done}/{progress.total}</span>
          <span className="weekly-summary-label">Bài đã đọc tuần này</span>
        </div>
        <div className="weekly-summary-stat weekly-stat-card">
          <span className="weekly-summary-num">{readingStreak}</span>
          <span className="weekly-summary-label">Chuỗi ngày liên tiếp</span>
        </div>
        <div className="weekly-summary-stat weekly-stat-card">
          <span className="weekly-summary-num">{readingDays}</span>
          <span className="weekly-summary-label">Tổng ngày đã đọc</span>
        </div>
      </div>

      <div className="weekly-today-card">
        <div className="weekly-today-head">
          <div>
            <p className="weekly-today-badge">Hôm nay</p>
            <h3 className="weekly-today-title">{todayPlan.label}</h3>
          </div>
          <span className={`weekly-today-status ${completed[todayPlan.id] ? 'done' : ''}`}>
            {completed[todayPlan.id] ? 'Đã hoàn thành' : 'Đang đọc'}
          </span>
        </div>

        <h4 className="weekly-today-theme">{todayPlan.theme}</h4>
        <ul className="weekly-passage-list">
          {todayPlan.passages.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <div className="weekly-actions">
          <Link href="/bible" className="btn-primary weekly-read-btn">
            <BookOpen size={16} /> Mở Kinh Thánh
          </Link>
          <button
            type="button"
            className={`weekly-mark-btn ${completed[todayPlan.id] ? 'done' : ''}`}
            onClick={() => toggleDone(todayPlan.id)}
          >
            {completed[todayPlan.id] ? <CheckCircle size={16} /> : <Circle size={16} />}
            {completed[todayPlan.id] ? 'Đã đọc hôm nay' : 'Đánh dấu đã đọc'}
          </button>
        </div>
      </div>

      <h3 className="section-title-sm weekly-section-title">Lịch cả tuần</h3>
      <div className="weekly-plan-list">
        {WEEKLY_READING_PLAN.map((day, idx) => (
          <div
            key={day.id}
            className={`weekly-day-card ${idx === todayIdx ? 'today' : ''} ${completed[day.id] ? 'completed' : ''}`}
          >
            <div className="weekly-day-head">
              <span className="weekly-day-label">{day.label}</span>
              {idx === todayIdx && <span className="weekly-day-badge">Hôm nay</span>}
              <button
                type="button"
                className="weekly-day-check"
                aria-label={completed[day.id] ? 'Bỏ đánh dấu' : 'Đánh dấu đã đọc'}
                onClick={() => toggleDone(day.id)}
              >
                {completed[day.id] ? <CheckCircle size={18} className="icon-done" /> : <Circle size={18} />}
              </button>
            </div>
            <p className="weekly-day-theme">{day.theme}</p>
            <p className="weekly-day-passages">{day.passages.join(' • ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
