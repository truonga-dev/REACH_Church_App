/**
 * Comments Service - Handle comments on news
 */

import { supabase } from './supabase';

export interface Comment {
  id: string;
  news_id: string;
  user_id?: string;
  author_name: string;
  content: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new comment
 */
export const createComment = async (
  newsId: string,
  userId: string | undefined,
  authorName: string,
  content: string
): Promise<Comment | null> => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      news_id: newsId,
      user_id: userId || null,
      author_name: authorName,
      content: content,
      is_approved: false, // Moderate by default
    })
    .select()
    .single();

  return error ? null : data;
};

/**
 * Get approved comments for news
 */
export const getNewsComments = async (newsId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('news_id', newsId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return error ? [] : data || [];
};

/**
 * Get comment count for news
 */
export const getCommentCount = async (newsId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('comments')
    .select('id', { count: 'exact' })
    .eq('news_id', newsId)
    .eq('is_approved', true);

  return error ? 0 : count || 0;
};

/**
 * Update comment (user can only update own)
 */
export const updateComment = async (
  commentId: string,
  userId: string | undefined,
  content: string
): Promise<boolean> => {
  if (!userId) return false;

  const { error } = await supabase
    .from('comments')
    .update({ content })
    .eq('id', commentId)
    .eq('user_id', userId);

  return !error;
};

/**
 * Delete comment (user can only delete own)
 */
export const deleteComment = async (
  commentId: string,
  userId: string | undefined
): Promise<boolean> => {
  if (!userId) return false;

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  return !error;
};
