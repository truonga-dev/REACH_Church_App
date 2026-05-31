export type HighlightColor = 'yellow' | 'orange' | 'pink' | 'red' | 'green';

export interface VerseHighlight {
  id: string;
  book: number;
  chapter: number;
  verse: number;
  start: number;
  end: number;
  color: HighlightColor;
}

const STORAGE_KEY = 'reach_bible_highlights';

function loadAll(): VerseHighlight[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VerseHighlight[]) : [];
  } catch {
    return [];
  }
}

function saveAll(items: VerseHighlight[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getChapterHighlights(book: number, chapter: number): VerseHighlight[] {
  return loadAll().filter((h) => h.book === book && h.chapter === chapter);
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function splitHighlightsAroundRange(
  items: VerseHighlight[],
  book: number,
  chapter: number,
  verse: number,
  start: number,
  end: number,
): VerseHighlight[] {
  const kept: VerseHighlight[] = [];

  for (const h of items) {
    if (h.book !== book || h.chapter !== chapter || h.verse !== verse) {
      kept.push(h);
      continue;
    }

    if (h.end <= start || h.start >= end) {
      kept.push(h);
      continue;
    }

    if (h.start < start) {
      kept.push({ ...h, id: newId(), end: start });
    }
    if (h.end > end) {
      kept.push({ ...h, id: newId(), start: end });
    }
  }

  return kept;
}

export function setHighlightInRange(
  book: number,
  chapter: number,
  verse: number,
  start: number,
  end: number,
  color: HighlightColor,
): VerseHighlight | null {
  if (start >= end) return null;

  const trimmed = splitHighlightsAroundRange(loadAll(), book, chapter, verse, start, end);
  const item: VerseHighlight = { id: newId(), book, chapter, verse, start, end, color };
  saveAll([...trimmed, item]);
  return item;
}

export function addHighlight(entry: Omit<VerseHighlight, 'id'>): VerseHighlight {
  removeHighlightsInRange(entry.book, entry.chapter, entry.verse, entry.start, entry.end);
  const item: VerseHighlight = { ...entry, id: newId() };
  saveAll([...loadAll(), item]);
  return item;
}

export function removeHighlightsInRange(
  book: number,
  chapter: number,
  verse: number,
  start: number,
  end: number,
) {
  saveAll(splitHighlightsAroundRange(loadAll(), book, chapter, verse, start, end));
}

export function clearVerseHighlights(book: number, chapter: number, verse: number) {
  saveAll(loadAll().filter((h) => !(h.book === book && h.chapter === chapter && h.verse === verse)));
}

export const HIGHLIGHT_COLORS: { id: HighlightColor; label: string; css: string }[] = [
  { id: 'orange', label: 'Cam', css: '#fdba74' },
  { id: 'yellow', label: 'Vàng', css: '#fde047' },
  { id: 'pink', label: 'Hồng', css: '#f9a8d4' },
  { id: 'red', label: 'Đỏ', css: '#fca5a5' },
  { id: 'green', label: 'Xanh', css: '#86efac' },
];
