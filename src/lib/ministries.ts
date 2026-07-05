/**
 * Ministries Management Library
 * Handles fetching, creating, and managing church ministries
 */

import { supabase } from './supabase';

export interface Ministry {
  id: string;
  category: string;
  name: string;
  icon?: string;
  image_url?: string;
  desc?: string;
  leader?: string;
  schedule?: string;
  location?: string;
  mission?: string;
  goal?: string;
  activities?: string[];
  details?: string;
  created_at: string;
  updated_at?: string;
}

export interface MinistryCreateInput {
  category: string;
  name: string;
  icon?: string;
  image_url?: string;
  desc?: string;
  leader?: string;
  schedule?: string;
  location?: string;
  mission?: string;
  goal?: string;
  activities?: string[];
  details?: string;
}

/**
 * Fetch all ministries
 */
export async function fetchMinistries(limit = 10, offset = 0): Promise<{ data: Ministry[], count: number }> {
  try {
    const { data, count, error } = await supabase
      .from('ministries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching ministries:', error);
      return { data: [], count: 0 };
    }
    return { data: data || [], count: count || 0 };
  } catch (error) {
    console.error('Error fetching ministries:', error);
    return { data: [], count: 0 };
  }
}

/**
 * Fetch single ministry by ID
 */
export async function fetchMinistryById(id: string): Promise<Ministry | null> {
  try {
    const { data, error } = await supabase
      .from('ministries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching ministry:', error);
    return null;
  }
}

/**
 * Create new ministry (admin only)
 */
export async function createMinistry(input: MinistryCreateInput): Promise<Ministry | null> {
  try {
    const { data, error } = await supabase
      .from('ministries')
      .insert([input])
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error creating ministry:', error);
    return null;
  }
}

/**
 * Update ministry (admin only)
 */
export async function updateMinistry(id: string, updates: Partial<MinistryCreateInput>): Promise<Ministry | null> {
  try {
    const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined)); // eslint-disable-line @typescript-eslint/no-unused-vars
    const { data, error } = await supabase
      .from('ministries')
      .update({
        ...cleanUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data || null;
  } catch (error: any) {  
    console.error('Error updating ministry:', error?.message || error, JSON.stringify(error));
    throw error;
  }
}

/**
 * Delete ministry (admin only)
 */
export async function deleteMinistry(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('ministries').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting ministry:', error);
    return false;
  }
}
