/**
 * News & Posts Management Library
 * Handles fetching, creating, and managing news posts
 */

import { supabase } from './supabase';

export interface NewsPost {
  id: string;
  title: string;
  title_en?: string;
  title_ko?: string;
  content: string;
  content_en?: string;
  content_ko?: string;
  category: string;
  image_url?: string;
  published_at: string;
  author_id?: string;
  views_count: number;
  created_at: string;
  updated_at?: string;
}

export interface NewsPostCreateInput {
  title: string;
  title_en?: string;
  title_ko?: string;
  content: string;
  content_en?: string;
  content_ko?: string;
  category: string;
  image_url?: string;
}

/**
 * Fetch all published news posts
 */
export async function fetchNewsPosts(limit = 10, offset = 0): Promise<NewsPost[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching news posts:', error);
    return [];
  }
}

/**
 * Fetch single news post by ID
 */
export async function fetchNewsPostById(id: string): Promise<NewsPost | null> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Increment views
    if (data) {
      await supabase
        .from('news')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id);
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching news post:', error);
    return null;
  }
}

/**
 * Fetch news posts by category
 */
export async function fetchNewsPostsByCategory(category: string): Promise<NewsPost[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('category', category)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching news posts by category:', error);
    return [];
  }
}

/**
 * Search news posts
 */
export async function searchNewsPosts(query: string): Promise<NewsPost[]> {
  try {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('published_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching news posts:', error);
    return [];
  }
}

/**
 * Create new news post (admin only)
 */
export async function createNewsPost(input: NewsPostCreateInput, userId?: string): Promise<NewsPost | null> {
  try {
    const { data, error } = await supabase
      .from('news')
      .insert([
        {
          ...input,
          author_id: userId,
          published_at: new Date().toISOString(),
          views_count: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error creating news post:', error);
    return null;
  }
}

/**
 * Update news post (admin only)
 */
export async function updateNewsPost(
  id: string,
  updates: Partial<NewsPostCreateInput>,
): Promise<NewsPost | null> {
  try {
    const { data, error } = await supabase
      .from('news')
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
    console.error('Error updating news post:', error);
    return null;
  }
}

/**
 * Delete news post (admin only)
 */
export async function deleteNewsPost(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('news').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting news post:', error);
    return false;
  }
}

/**
 * Get latest news posts
 */
export async function getLatestNewsPosts(limit = 5): Promise<NewsPost[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting latest news posts:', error);
    return [];
  }
}

/**
 * Get featured news post
 */
export async function getFeaturedNewsPost(): Promise<NewsPost | null> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .not('image_url', 'is', null)
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error getting featured news post:', error);
    return null;
  }
}
