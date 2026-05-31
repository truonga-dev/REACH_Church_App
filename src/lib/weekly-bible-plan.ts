export interface DailyReading {
  id: string;
  weekday: number;
  label: string;
  passages: string[];
  theme: string;
}

/** Lịch đọc Kinh Thánh hằng tuần — 0 = Thứ Hai, 6 = Chủ Nhật */
export const WEEKLY_READING_PLAN: DailyReading[] = [
  {
    id: 'mon',
    weekday: 0,
    label: 'Thứ Hai',
    passages: ['Thi 1–2', 'Matthơ 5:1–16'],
    theme: 'Phước hạnh và sự khởi đầu',
  },
  {
    id: 'tue',
    weekday: 1,
    label: 'Thứ Ba',
    passages: ['Thi 23', 'Giăng 3:16–21'],
    theme: 'Chúa là Đấu Chăn Dắt',
  },
  {
    id: 'wed',
    weekday: 2,
    label: 'Thứ Tư',
    passages: ['Thi 51', 'Rô-ma 8:1–11'],
    theme: 'Ánh sáng và sự tha thứ',
  },
  {
    id: 'thu',
    weekday: 3,
    label: 'Thứ Năm',
    passages: ['Thi 119:105–112', 'Giăng 14:1–6'],
    theme: 'Lời Chúa dẫn đường',
  },
  {
    id: 'fri',
    weekday: 4,
    label: 'Thứ Sáu',
    passages: ['Thi 103', 'I Phi-e-rơ 5:6–7'],
    theme: 'Tạ ơn và phó thác',
  },
  {
    id: 'sat',
    weekday: 5,
    label: 'Thứ Bảy',
    passages: ['Thi 27', 'Phi-lip 4:4–9'],
    theme: 'Bình an trong Chúa',
  },
  {
    id: 'sun',
    weekday: 6,
    label: 'Chủ Nhật',
    passages: ['Thi 100', 'Cô-lô-se 3:12–17'],
    theme: 'Ngày Chúa — ca ngợi và hiệp hội',
  },
];

const DONE_PREFIX = 'reach_weekly_done';

function weekKey(): string {
  const now = new Date();
  const start = new Date(now);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(now.getDate() + diff);
  return start.toISOString().slice(0, 10);
}

export function getTodayWeekdayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

export function getTodayReading(): DailyReading {
  const idx = getTodayWeekdayIndex();
  return WEEKLY_READING_PLAN[idx];
}

export function isDayCompleted(dayId: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(`${DONE_PREFIX}_${weekKey()}_${dayId}`) === 'true';
}

export function setDayCompleted(dayId: string, done: boolean): void {
  localStorage.setItem(`${DONE_PREFIX}_${weekKey()}_${dayId}`, String(done));
}

export function getWeeklyProgress(): { done: number; total: number } {
  const done = WEEKLY_READING_PLAN.filter((d) => isDayCompleted(d.id)).length;
  return { done, total: WEEKLY_READING_PLAN.length };
}
