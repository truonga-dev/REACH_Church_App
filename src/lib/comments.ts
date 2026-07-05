/**
 * Comments Management Library
 * Handles comments on devotionals, news, and sermons
 */

import { supabase } from './supabase';

export interface CommentProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

export interface Comment {
  id: string;
  user_id: string;
  post_type: 'devotional' | 'news_post' | 'sermon';
  post_id: string;
  content: string;
  likes_count: number;
  parent_id?: string;
  created_at: string;
  updated_at?: string;
  profile?: CommentProfile | null;
}

export interface CommentCreateInput {
  content: string;
  parent_id?: string;
}

/**
 * Fetch comments for a specific post with user profiles
 */
export async function fetchComments(
  postType: 'devotional' | 'news_post' | 'sermon',
  postId: string,
): Promise<Comment[]> {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_type', postType)
      .eq('post_id', postId)
      .order('created_at', { ascending: true }); // Ascending so replies come after

    if (error) throw error;
    if (!comments || comments.length === 0) return [];

    // Fetch user profiles for the comments
    const userIds = Array.from(new Set(comments.map(c => c.user_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .in('id', userIds);

    const profileMap = new Map<string, CommentProfile>();
    profiles?.forEach(p => profileMap.set(p.id, p));

    return comments.map(c => ({
      ...c,
      profile: profileMap.get(c.user_id) || null
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

/**
 * Fetch single comment by ID
 */
export async function fetchCommentById(id: string): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching comment:', error);
    return null;
  }
}

/**
 * Create new comment
 */
export async function createComment(
  postType: 'devotional' | 'news_post' | 'sermon',
  postId: string,
  userId: string,
  input: CommentCreateInput,
): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          post_type: postType,
          post_id: postId,
          user_id: userId,
          content: input.content,
          parent_id: input.parent_id || null,
          likes_count: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    if (data) {
      // Fetch profile for the newly created comment
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .eq('id', userId)
        .single();
      return { ...data, profile: profileData || null };
    }
    return null;
  } catch (error) {
    console.error('Error creating comment:', error);
    return null;
  }
}

/**
 * Update comment
 */
export async function updateComment(
  id: string,
  input: Partial<CommentCreateInput>,
): Promise<Comment | null> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error updating comment:', error);
    return null;
  }
}

/**
 * Delete comment
 */
export async function deleteComment(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('comments').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
}

/**
 * Like a comment
 */
export async function likeComment(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('likes_count')
      .eq('id', id)
      .single();

    if (error) throw error;

    const newCount = (data?.likes_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('comments')
      .update({ likes_count: newCount })
      .eq('id', id);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error liking comment:', error);
    return false;
  }
}

/**
 * Get comment count for a post
 */
export async function getCommentCount(
  postType: 'devotional' | 'news_post' | 'sermon',
  postId: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_type', postType)
      .eq('post_id', postId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting comment count:', error);
    return 0;
  }
}

/**
 * Get user's comments
 */
export async function getUserComments(userId: string): Promise<Comment[]> {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting user comments:', error);
    return [];
  }
}
