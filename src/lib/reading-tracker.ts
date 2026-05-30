const STORAGE_KEY = 'reach_bible_reading';

export interface ReadingRecord {
  dates: string[];
  chapters: string[];
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getReadingRecord(): ReadingRecord {
  if (typeof window === 'undefined') return { dates: [], chapters: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dates: [], chapters: [] };
    return JSON.parse(raw) as ReadingRecord;
  } catch {
    return { dates: [], chapters: [] };
  }
}

export function recordChapterRead(bookIndex: number, chapter: number): ReadingRecord {
  const record = getReadingRecord();
  const today = todayKey();
  const chapterKey = `${bookIndex}:${chapter}`;

  if (!record.dates.includes(today)) {
    record.dates.push(today);
  }
  if (!record.chapters.includes(chapterKey)) {
    record.chapters.push(chapterKey);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function getReadingStreak(): number {
  const { dates } = getReadingRecord();
  if (dates.length === 0) return 0;

  const sorted = [...new Set(dates)].sort().reverse();
  let streak = 0;
  const cursor = new Date();

  for (let i = 0; i < sorted.length; i++) {
    const expected = cursor.toISOString().slice(0, 10);
    if (sorted[i] === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (sorted[i] === yesterday.toISOString().slice(0, 10)) {
        streak++;
        cursor.setDate(cursor.getDate() - 2);
      } else {
        break;
      }
    } else {
      break;
    }
  }
  return streak;
}

export function getTotalReadingDays(): number {
  return new Set(getReadingRecord().dates).size;
}
