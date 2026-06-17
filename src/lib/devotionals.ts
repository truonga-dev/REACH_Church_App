/**
 * Devotionals Management Library
 * Handles fetching, creating, and managing devotional content
 */

import { supabase } from './supabase';

export interface Devotional {
  id: string;
  title: string;
  content: string;
  author: string;
  featured_image_url?: string;
  published_at: string;
  created_at: string;
  updated_at?: string;
  likes_count?: number;
  views_count?: number;
}

export interface DevotionalCreateInput {
  title: string;
  content: string;
  author: string;
  featured_image_url?: string;
}

/**
 * Fetch all published devotionals
 */
export async function fetchDevotionals(limit = 10, offset = 0): Promise<{ data: Devotional[], count: number }> {
  try {
    const { data, count, error } = await supabase
      .from('devotionals')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('Error fetching devotionals:', error);
    return { data: [], count: 0 };
  }
}

/**
 * Fetch single devotional by ID
 */
export async function fetchDevotionalById(id: string): Promise<Devotional | null> {
  try {
    const { data, error } = await supabase
      .from('devotionals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Increment views count
    if (data) {
      await supabase
        .from('devotionals')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id);
    }
    
    return data || null;
  } catch (error) {
    console.error('Error fetching devotional:', error);
    return null;
  }
}

/**
 * Fetch today's devotional
 */
export async function fetchTodayDevotional(): Promise<Devotional | null> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('devotionals')
      .select('*')
      .gte('published_at', today.toISOString())
      .lt('published_at', tomorrow.toISOString())
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching today devotional:', error);
    return null;
  }
}

/**
 * Search devotionals by title or content
 */
export async function searchDevotionals(query: string): Promise<Devotional[]> {
  try {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('devotionals')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching devotionals:', error);
    return [];
  }
}

/**
 * Create new devotional (admin only)
 */
export async function createDevotional(input: DevotionalCreateInput): Promise<Devotional | null> {
  try {
    const { data, error } = await supabase
      .from('devotionals')
      .insert([
        {
          ...input,
          published_at: new Date().toISOString(),
          views_count: 0,
          likes_count: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error creating devotional:', error);
    return null;
  }
}

/**
 * Update devotional (admin only)
 */
export async function updateDevotional(
  id: string,
  updates: Partial<DevotionalCreateInput>,
): Promise<Devotional | null> {
  try {
    const { data, error } = await supabase
      .from('devotionals')
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
    console.error('Error updating devotional:', error);
    return null;
  }
}

/**
 * Delete devotional (admin only)
 */
export async function deleteDevotional(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('devotionals').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting devotional:', error);
    return false;
  }
}

/**
 * Like a devotional
 */
export async function likeDevotional(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('devotionals')
      .select('likes_count')
      .eq('id', id)
      .single();

    if (error) throw error;

    const newCount = (data?.likes_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('devotionals')
      .update({ likes_count: newCount })
      .eq('id', id);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error liking devotional:', error);
    return false;
  }
}
