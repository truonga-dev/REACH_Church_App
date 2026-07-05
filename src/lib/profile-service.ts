import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('fetchProfile error:', error);
      return null;
    }
    return data as Profile | null;
  } catch (err) {
    console.error('fetchProfile exception:', err);
    return null;
  }
}

export async function ensureProfile(user: User, fullName?: string): Promise<Profile> {
  try {
    const existing = await fetchProfile(user.id);
    if (existing) return existing;

    const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
    const payload = {
      id: user.id,
      user_id: user.id,
      full_name: fullName || user.user_metadata?.full_name || username,
      username,
      role: 'Hội viên',
      avatar_url: '',
      bio: '',
      email: user.email || '',
    };

    const { data, error } = await supabase.from('profiles').upsert(payload).select().single();
    if (error) {
      console.warn('ensureProfile upsert failed:', error.message);
      return payload as Profile;
    }
    return data as Profile;
  } catch (err) {
    console.error('ensureProfile exception:', err);
    const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
    return {
      id: user.id,
      user_id: user.id,
      full_name: fullName || user.user_metadata?.full_name || username,
      username,
      role: 'Hội viên',
      avatar_url: '',
      bio: '',
      email: user.email || '',
    } as Profile;
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  try {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) {
      console.error('updateProfile error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('updateProfile exception:', err);
    return false;
  }
}
