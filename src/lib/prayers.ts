/**
 * Prayers Management Library
 * Handles fetching, creating, and managing prayer requests
 */

import { supabase } from './supabase';

export interface PrayerRequest {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  category: string;
  status: 'pending' | 'reviewed' | 'answered' | 'closed';
  is_private: boolean;
  prayer_count: number;
  created_at: string;
  updated_at?: string;
}

export interface PrayerCreateInput {
  title: string;
  content: string;
  category: string;
  is_private?: boolean;
}

/**
 * Fetch all public prayer requests
 */
export async function fetchPrayerRequests(limit = 20, offset = 0): Promise<PrayerRequest[]> {
  try {
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return [];
    }
    return data || [];
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */) {
    return [];
  }
}

/**
 * Fetch user's own prayer requests
 */
export async function fetchUserPrayerRequests(userId: string): Promise<PrayerRequest[]> {
  try {
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */) {
    return [];
  }
}

/**
 * Create new prayer request
 */
export async function createPrayerRequest(
  input: PrayerCreateInput,
  userId?: string,
): Promise<PrayerRequest | null> {
  try {
    const { data, error } = await supabase
      .from('prayers')
      .insert([
        {
          ...input,
          user_id: userId,
          status: 'pending',
          prayer_count: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error creating prayer request:', {
        code: error.code,
        message: error.message,
      });
      throw error;
    }
    return data || null;
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    const errorMessage = error?.message || String(error) || 'Unknown error';
    console.error('Error creating prayer request:', errorMessage);
    return null;
  }
}

/**
 * Increment prayer count for a request
 */
export async function incrementPrayerCount(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('prayers')
      .select('prayer_count')
      .eq('id', id)
      .single();

    if (error) {
      return false;
    }

    const newCount = (data?.prayer_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('prayers')
      .update({ prayer_count: newCount })
      .eq('id', id);

    if (updateError) {
      console.error('Supabase Error updating prayer count:', {
        code: updateError.code,
        message: updateError.message,
      });
      throw updateError;
    }
    return true;
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    const errorMessage = error?.message || String(error) || 'Unknown error';
    console.error('Error incrementing prayer count:', errorMessage);
    return false;
  }
}

/**
 * Update prayer request status
 */
export async function updatePrayerStatus(
  id: string,
  status: PrayerRequest['status'] | 'ongoing' | 'completed',
): Promise<PrayerRequest | null> {
  const dbStatus =
    status === 'ongoing' ? 'pending' :
    status === 'completed' ? 'closed' :
    status;
  try {
    const { data, error } = await supabase
      .from('prayers')
      .update({ status: dbStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error updating prayer status:', {
        code: error.code,
        message: error.message,
      });
      throw error;
    }
    return data || null;
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    const errorMessage = error?.message || String(error) || 'Unknown error';
    console.error('Error updating prayer status:', errorMessage);
    return null;
  }
}

/**
 * Delete prayer request
 */
export async function deletePrayerRequest(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('prayers').delete().eq('id', id);

    if (error) {
      console.error('Supabase Error deleting prayer request:', {
        code: error.code,
        message: error.message,
      });
      throw error;
    }
    return true;
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    const errorMessage = error?.message || String(error) || 'Unknown error';
    console.error('Error deleting prayer request:', errorMessage);
    return false;
  }
}

/**
 * Search prayer requests by category
 */
export async function searchPrayersByCategory(category: string): Promise<PrayerRequest[]> {
  try {
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .eq('category', category)
      .eq('is_private', false)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */) {
    return [];
  }
}

/**
 * Get prayer statistics
 */
export async function getPrayerStatistics(): Promise<{
  totalPrayers: number;
  totalIntercessors: number;
  activeCategory: string;
}> {
  try {
    const { data: prayers, error: prayerError } = await supabase
      .from('prayers')
      .select('*', { count: 'exact' })
      .eq('is_private', false);

    if (prayerError) {
      return {
        totalPrayers: 0,
        totalIntercessors: 0,
        activeCategory: 'health',
      };
    }

    const totalPrayers = prayers?.length || 0;
    const totalIntercessors = new Set(prayers?.map((p) => p.user_id)).size;

    // Find most common category
    const categoryCounts: Record<string, number> = {};
    prayers?.forEach((p) => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    const keys = Object.keys(categoryCounts);
    const activeCategory = keys.length > 0
      ? keys.reduce((a, b) => (categoryCounts[a] > categoryCounts[b] ? a : b))
      : 'health';

    return {
      totalPrayers,
      totalIntercessors,
      activeCategory,
    };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */) {
    return {
      totalPrayers: 0,
      totalIntercessors: 0,
      activeCategory: 'health',
    };
  }
}
