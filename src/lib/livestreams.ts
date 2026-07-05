import { supabase, supabaseAdmin } from '@/lib/supabase';

export type Livestream = {
  id: string;
  title: string;
  title_en?: string | null;
  title_ko?: string | null;
  description: string | null;
  description_en?: string | null;
  description_ko?: string | null;
  youtube_id: string | null;
  facebook_url: string | null;
  is_live: boolean;
  scheduled_at: string | null;
  created_at: string;
};

export type LivestreamCreateInput = Omit<Livestream, 'id' | 'created_at'>;

export async function fetchLivestreams(limit = 20, offset = 0): Promise<{ data: Livestream[]; count: number }> {
  const { data, error, count } = await supabase
    .from('livestreams')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching livestreams:', error);
    throw error;
  }
  return { data: data as Livestream[], count: count || 0 };
}

export async function getActiveLivestream(): Promise<Livestream | null> {
  const { data, error } = await supabase
    .from('livestreams')
    .select('*')
    .eq('is_live', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // not found
    console.error('Error fetching active livestream:', error);
    return null;
  }
  return data as Livestream | null;
}

export async function createLivestream(input: LivestreamCreateInput): Promise<Livestream | null> {
  // If is_live is true, we might want to set others to false, but let's assume admin only sets one
  if (input.is_live) {
    await turnOffOtherLivestreams(null);
  }

  const { data, error } = await supabaseAdmin
    .from('livestreams')
    .insert([input])
    .select()
    .single();

  if (error) {
    console.error('Error creating livestream:', error.message, error.details, error.hint, error.code);
    throw error;
  }
  return data as Livestream;
}

export async function updateLivestream(id: string, input: Partial<LivestreamCreateInput>): Promise<Livestream | null> {
  if (input.is_live) {
    await turnOffOtherLivestreams(id);
  }

  const { data, error } = await supabaseAdmin
    .from('livestreams')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating livestream:', error);
    throw error;
  }
  return data as Livestream;
}

export async function deleteLivestream(id: string): Promise<boolean> {
  const { error } = await supabaseAdmin.from('livestreams').delete().eq('id', id);
  if (error) {
    console.error('Error deleting livestream:', error);
    throw error;
  }
  return true;
}

async function turnOffOtherLivestreams(excludeId: string | null) {
  let query = supabaseAdmin.from('livestreams').update({ is_live: false }).eq('is_live', true);
  if (excludeId) {
    query = query.neq('id', excludeId);
  }
  await query;
}

export type SermonNote = {
  id: string;
  user_id: string;
  livestream_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export async function getSermonNote(userId: string, livestreamId: string): Promise<SermonNote | null> {
  const { data, error } = await supabase
    .from('sermon_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('livestream_id', livestreamId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching sermon note:', error);
    return null;
  }
  return data as SermonNote | null;
}

export async function saveSermonNote(userId: string, livestreamId: string, content: string): Promise<void> {
  // We use upsert on unique constraint (user_id, livestream_id)
  const { error } = await supabase
    .from('sermon_notes')
    .upsert(
      { user_id: userId, livestream_id: livestreamId, content, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,livestream_id' }
    );
  if (error) {
    console.error('Error saving sermon note:', error);
    throw error;
  }
}

export async function getSermonNotesByUser(userId: string): Promise<(SermonNote & { livestreams: { title: string } })[]> {
  const { data, error } = await supabase
    .from('sermon_notes')
    .select('*, livestreams(title)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user sermon notes:', error);
    return [];
  }
  return data as any[];  
}
