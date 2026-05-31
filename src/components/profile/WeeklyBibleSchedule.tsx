'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Circle, BookOpen } from 'lucide-react';
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
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState({ done: 0, total: 7 });

  const refresh = () => {
    const map: Record<string, boolean> = {};
    WEEKLY_READING_PLAN.forEach((d) => {
      map[d.id] = isDayCompleted(d.id);
    });
    setCompleted(map);
    setProgress(getWeeklyProgress());
  };

  useEffect(() => {
    refresh();
  }, []);

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

      <div className="weekly-summary">
        <div className="weekly-summary-stat">
          <span className="weekly-summary-num">{progress.done}/{progress.total}</span>
          <span className="weekly-summary-label">Tuần này</span>
        </div>
        <div className="weekly-summary-stat">
          <span className="weekly-summary-num">{readingStreak}</span>
          <span className="weekly-summary-label">Chuỗi ngày</span>
        </div>
        <div className="weekly-summary-stat">
          <span className="weekly-summary-num">{readingDays}</span>
          <span className="weekly-summary-label">Tổng ngày</span>
        </div>
      </div>

      <div className="weekly-today-card">
        <p className="weekly-today-badge">Hôm nay — {todayPlan.label}</p>
        <h3 className="weekly-today-theme">{todayPlan.theme}</h3>
        <ul className="weekly-passage-list">
          {todayPlan.passages.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <Link href="/bible" className="btn-primary weekly-read-btn">
          <BookOpen size={16} /> Mở Kinh Thánh
        </Link>
        <button
          type="button"
          className={`weekly-mark-btn ${completed[todayPlan.id] ? 'done' : ''}`}
          onClick={() => toggleDone(todayPlan.id)}
        >
          {completed[todayPlan.id] ? <CheckCircle size={16} /> : <Circle size={16} />}
          {completed[todayPlan.id] ? 'Đã hoàn thành hôm nay' : 'Đánh dấu đã đọc hôm nay'}
        </button>
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
