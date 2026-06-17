/**
 * Favorites Service - Handle user likes for verses, news, sermons
 */

import { supabase } from './supabase';

export interface Favorite {
  id: string;
  user_id: string;
  content_type: 'verse' | 'news' | 'sermon';
  content_id: string;
  created_at: string;
}

/**
 * Check if user has favorited content
 */
export const isFavorited = async (
  userId: string | undefined,
  contentType: 'verse' | 'news' | 'sermon',
  contentId: string
): Promise<boolean> => {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .single();

  return !error && !!data;
};

/**
 * Add to favorites
 */
export const addFavorite = async (
  userId: string | undefined,
  contentType: 'verse' | 'news' | 'sermon',
  contentId: string
): Promise<boolean> => {
  if (!userId) return false;

  const { error } = await supabase.from('favorites').insert({
    user_id: userId,
    content_type: contentType,
    content_id: contentId,
  });

  return !error;
};

/**
 * Remove from favorites
 */
export const removeFavorite = async (
  userId: string | undefined,
  contentType: 'verse' | 'news' | 'sermon',
  contentId: string
): Promise<boolean> => {
  if (!userId) return false;

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('content_id', contentId);

  return !error;
};

/**
 * Toggle favorite (add if not favorited, remove if favorited)
 */
export const toggleFavorite = async (
  userId: string | undefined,
  contentType: 'verse' | 'news' | 'sermon',
  contentId: string
): Promise<boolean> => {
  if (!userId) return false;

  const isFav = await isFavorited(userId, contentType, contentId);
  return isFav
    ? removeFavorite(userId, contentType, contentId)
    : addFavorite(userId, contentType, contentId);
};

/**
 * Get all favorites for user
 */
export const getUserFavorites = async (
  userId: string | undefined,
  contentType?: 'verse' | 'news' | 'sermon'
): Promise<Favorite[]> => {
  if (!userId) return [];

  let query = supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId);

  if (contentType) {
    query = query.eq('content_type', contentType);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  return error ? [] : data || [];
};

/**
 * Get favorite count for content
 */
export const getFavoriteCount = async (
  contentType: 'verse' | 'news' | 'sermon',
  contentId: string
): Promise<number> => {
  const { count, error } = await supabase
    .from('favorites')
    .select('id', { count: 'exact' })
    .eq('content_type', contentType)
    .eq('content_id', contentId);

  return error ? 0 : count || 0;
};
