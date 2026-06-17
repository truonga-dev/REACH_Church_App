/**
 * Events Management Library
 * Handles fetching, creating, and managing church events
 */

import { supabase } from './supabase';
import { formatSupabaseError } from './supabase-errors';

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  department_id?: string;
  max_attendees?: number;
  registrations_count: number;
  created_at: string;
  updated_at?: string;
}

export interface EventCreateInput {
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  department_id?: string;
  max_attendees?: number;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
  profiles?: {
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

/**
 * Fetch all events (for Admin)
 */
export async function fetchAllEvents(limit = 10, offset = 0): Promise<{ data: Event[], count: number }> {
  try {
    const { data, count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('event_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return { data: [], count: 0 };
    return { data: data || [], count: count || 0 };
  } catch {
    return { data: [], count: 0 };
  }
}

/**
 * Fetch upcoming events
 */
export async function fetchUpcomingEvents(limit = 10): Promise<Event[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', now)
      .order('event_date', { ascending: true })
      .limit(limit);

    if (error) return []; // table may not exist yet
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch past events
 */
export async function fetchPastEvents(limit = 10): Promise<Event[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .lt('event_date', now)
      .order('event_date', { ascending: false })
      .limit(limit);

    if (error) return []; // table may not exist yet
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Fetch single event by ID
 */
export async function fetchEventById(id: string): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

/**
 * Fetch events by department
 */
export async function fetchEventsByDepartment(departmentId: string): Promise<Event[]> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('department_id', departmentId)
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events by department:', error);
    return [];
  }
}

/**
 * Create new event (admin only)
 */
export async function createEvent(input: EventCreateInput): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          ...input,
          registrations_count: 0,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
}

/**
 * Update event (admin only)
 */
export async function updateEvent(id: string, updates: Partial<EventCreateInput>): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
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
    console.error('Error updating event:', error);
    return null;
  }
}

/**
 * Delete event (admin only)
 */
export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}

/**
 * Register user for event
 */
export async function registerForEvent(eventId: string, userId: string): Promise<EventRegistration | null> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert([{ event_id: eventId, user_id: userId }])
      .select()
      .single();

    if (error) return null;

    // Increment registration count
    const { data: event } = await supabase
      .from('events')
      .select('registrations_count')
      .eq('id', eventId)
      .single();

    if (event) {
      await supabase
        .from('events')
        .update({ registrations_count: (event.registrations_count || 0) + 1 })
        .eq('id', eventId);
    }

    return data || null;
  } catch {
    return null;
  }
}

/**
 * Cancel event registration
 */
export async function cancelEventRegistration(eventId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);

    if (error) return false;

    const { data: event } = await supabase
      .from('events')
      .select('registrations_count')
      .eq('id', eventId)
      .single();

    if (event && event.registrations_count > 0) {
      await supabase
        .from('events')
        .update({ registrations_count: event.registrations_count - 1 })
        .eq('id', eventId);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user is registered for event
 */
export async function isUserRegisteredForEvent(eventId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Get event registrations
 */
export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  try {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') return [];
      throw error;
    }
    if (!data?.length) return [];

    const userIds = [...new Set(data.map((row) => row.user_id).filter(Boolean))];
    const profileMap = new Map<string, { full_name: string; email: string; avatar_url: string }>();

    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, avatar_url')
        .in('id', userIds);

      if (!profileError && profiles) {
        for (const profile of profiles) {
          const entry = {
            full_name: profile.full_name || '',
            email: profile.email || '',
            avatar_url: profile.avatar_url || '',
          };
          if (profile.id) profileMap.set(profile.id, entry);
          if (profile.user_id) profileMap.set(profile.user_id, entry);
        }
      }

      const missingIds = userIds.filter((id) => !profileMap.has(id));
      if (missingIds.length > 0) {
        const { data: byUserId } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, email, avatar_url')
          .in('user_id', missingIds);

        for (const profile of byUserId || []) {
          const entry = {
            full_name: profile.full_name || '',
            email: profile.email || '',
            avatar_url: profile.avatar_url || '',
          };
          if (profile.id) profileMap.set(profile.id, entry);
          if (profile.user_id) profileMap.set(profile.user_id, entry);
        }
      }
    }

    return data.map((row) => ({
      ...row,
      profiles: profileMap.get(row.user_id),
    }));
  } catch (error) {
    console.warn('Error getting event registrations:', formatSupabaseError(error));
    return [];
  }
}
