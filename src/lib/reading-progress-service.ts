/**
 * Reading Progress Service - Track user Bible reading
 */

import { supabase } from './supabase';

export interface ReadingProgress {
  id: string;
  user_id: string;
  book: number;
  chapter: number;
  verse: number;
  read_at: string;
  duration_ms?: number;
  notes?: string;
}

export interface ReadingStats {
  verses_read: number;
  chapters_read: number;
  books_read: number;
  last_read_at?: string;
  first_read_at?: string;
}

/**
 * Record that user read a verse
 */
export const recordVerseRead = async (
  userId: string | undefined,
  book: number,
  chapter: number,
  verse: number,
  durationMs?: number,
  notes?: string
): Promise<boolean> => {
  if (!userId) return false;

  const { error } = await supabase.from('reading_progress').upsert({
    user_id: userId,
    book,
    chapter,
    verse,
    read_at: new Date().toISOString(),
    duration_ms: durationMs,
    notes,
  });

  return !error;
};

/**
 * Get user's reading progress for a book
 */
export const getBookReadingProgress = async (
  userId: string | undefined,
  book: number
): Promise<ReadingProgress[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('book', book)
    .order('chapter, verse');

  return error ? [] : data || [];
};

/**
 * Get user's reading progress for a chapter
 */
export const getChapterReadingProgress = async (
  userId: string | undefined,
  book: number,
  chapter: number
): Promise<ReadingProgress[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('book', book)
    .eq('chapter', chapter)
    .order('verse');

  return error ? [] : data || [];
};

/**
 * Check if user has read a specific verse
 */
export const hasReadVerse = async (
  userId: string | undefined,
  book: number,
  chapter: number,
  verse: number
): Promise<boolean> => {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('reading_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('book', book)
    .eq('chapter', chapter)
    .eq('verse', verse)
    .single();

  return !error && !!data;
};

/**
 * Get user's reading statistics
 */
export const getReadingStats = async (userId: string | undefined): Promise<ReadingStats | null> => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_reading_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  return error ? null : data;
};

/**
 * Get user's recent reading activity
 */
export const getRecentReadingActivity = async (
  userId: string | undefined,
  limit = 20
): Promise<ReadingProgress[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .order('read_at', { ascending: false })
    .limit(limit);

  return error ? [] : data || [];
};

/**
 * Get reading streak (consecutive days of reading)
 */
export const getReadingStreak = async (userId: string | undefined): Promise<number> => {
  if (!userId) return 0;

  const { data, error } = await supabase
    .from('reading_progress')
    .select('read_at')
    .eq('user_id', userId)
    .order('read_at', { ascending: false });

  if (error || !data || data.length === 0) return 0;

  let streak = 1;
  let currentDate = new Date(data[0].read_at).toDateString();

  for (let i = 1; i < data.length; i++) {
    const previousDate = new Date(data[i].read_at).toDateString();
    const dayDiff =
      (new Date(currentDate).getTime() - new Date(previousDate).getTime()) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      streak++;
      currentDate = previousDate;
    } else {
      break;
    }
  }

  return streak;
};
