/**
 * Sermons Management Library
 * Handles fetching, searching, and managing sermon content
 */

import { supabase } from './supabase';

export interface Sermon {
  id: string;
  title: string;
  title_en?: string;
  title_ko?: string;
  description?: string;
  description_en?: string;
  description_ko?: string;
  audio_url?: string;
  video_url?: string;
  preacher: string;
  sermon_date: string;
  duration_minutes?: number;
  created_at: string;
  updated_at?: string;
  views_count?: number;
  likes_count?: number;
}

export interface SermonCreateInput {
  title: string;
  title_en?: string;
  title_ko?: string;
  description?: string;
  description_en?: string;
  description_ko?: string;
  audio_url?: string;
  video_url?: string;
  preacher: string;
  sermon_date: string;
  duration_minutes?: number;
}

/**
 * Fetch all sermons
 */
export async function fetchSermons(limit = 10, offset = 0): Promise<{ data: Sermon[], count: number }> {
  try {
    const { data, count, error } = await supabase
      .from('sermons')
      .select('*', { count: 'exact' })
      .order('sermon_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('Error fetching sermons:', error);
    return { data: [], count: 0 };
  }
}

/**
 * Fetch single sermon by ID
 */
export async function fetchSermonById(id: string): Promise<Sermon | null> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Increment views
    if (data) {
      await supabase
        .from('sermons')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id);
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching sermon:', error);
    return null;
  }
}

/**
 * Fetch sermons by preacher
 */
export async function fetchSermonsByPreacher(preacher: string): Promise<Sermon[]> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .eq('preacher', preacher)
      .order('sermon_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching sermons by preacher:', error);
    return [];
  }
}

/**
 * Search sermons by title or description
 */
export async function searchSermons(query: string): Promise<Sermon[]> {
  try {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('sermon_date', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching sermons:', error);
    return [];
  }
}

/**
 * Create new sermon (admin only)
 */
export async function createSermon(input: SermonCreateInput): Promise<Sermon | null> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .insert([
        {
          ...input,
          views_count: 0,
          likes_count: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error creating sermon:', error);
    return null;
  }
}

/**
 * Update sermon (admin only)
 */
export async function updateSermon(
  id: string,
  updates: Partial<SermonCreateInput>,
): Promise<Sermon | null> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error updating sermon:', error);
    return null;
  }
}

/**
 * Delete sermon (admin only)
 */
export async function deleteSermon(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('sermons').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting sermon:', error);
    return false;
  }
}

/**
 * Like a sermon
 */
export async function likeSermon(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .select('likes_count')
      .eq('id', id)
      .single();

    if (error) throw error;

    const newCount = (data?.likes_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('sermons')
      .update({ likes_count: newCount })
      .eq('id', id);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error liking sermon:', error);
    return false;
  }
}

/**
 * Get latest sermons
 */
export async function getLatestSermons(limit = 5): Promise<Sermon[]> {
  try {
    const { data, error } = await supabase
      .from('sermons')
      .select('*')
      .order('sermon_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting latest sermons:', error);
    return [];
  }
}
