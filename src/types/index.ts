export type PrayerStatus = 'ongoing' | 'answered' | 'completed' | 'pending' | 'reviewed' | 'closed';

export interface Profile {
  id?: string;
  user_id?: string;
  full_name: string;
  username: string;
  role: string;
  avatar_url: string;
  bio: string;
  email?: string;
  cover_url?: string;
  custom_permissions?: string[];
}

export interface Prayer {
  id: string;
  title: string;
  content?: string;
  description?: string;
  category?: string;
  status: PrayerStatus | string;
  created_at: string;
  user_id?: string;
  author_name?: string;
  topic?: string;
  is_private?: boolean;
  prayer_count?: number;
  pray_count?: number;
  notes?: string;
}

export interface Donation {
  id: string;
  user_id: string;
  amount: number;
  message: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: 'payos' | 'manual';
  payment_link_id: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

// --- CELL GROUPS ---
export interface CellGroup {
  id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  meeting_time: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  
  // Relations (optional, joined from queries)
  leader?: Profile;
  member_count?: number;
}

export interface CellGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'member' | 'co_leader' | 'leader';
  status: 'pending' | 'approved' | 'rejected';
  joined_at: string;
  
  // Relations
  profile?: Profile;
  group?: CellGroup;
}

export interface Sermon {
  id: string;
  title: string;
  speaker?: string;
  preacher?: string;
  series?: string;
  date?: string;
  sermon_date?: string;
  youtube_url?: string;
  youtube_id?: string;
  video_url?: string;
  audio_url?: string;
  content?: string;
  created_at?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  type: string;
  content: string;
  image_url?: string;
  pdf_url?: string;
  audio_url?: string;
  categories?: string[] | string;
  status?: 'published' | 'draft' | string;
  created_at?: string;
}

// --- EVENTS & VOLUNTEERING ---
export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventVolunteer {
  id: string;
  event_id: string;
  user_id: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;

  // Relations
  event?: Event;
  profile?: Profile;
}

export const PRAYER_TOPICS: Record<string, string> = {
  health: 'Sức khỏe',
  family: 'Gia đình',
  work: 'Công việc / Tài chính',
  faith: 'Đời sống thuộc linh',
  other: 'Khác',
};

// --- BIBLE READING PLANS & STREAKS ---
export interface BibleReadingPlan {
  id: string;
  title: string;
  description: string | null;
  duration_days: number;
  created_at: string;
}

export interface BiblePlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  verses: string;
  created_at: string;
}

export interface UserReadingProgress {
  id: string;
  user_id: string;
  plan_id: string;
  day_number: number;
  completed_at: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'registered' | 'attended' | 'cancelled';
  check_in_time: string | null;
  created_at: string;

  // Optional relations
  event?: Event;
  profile?: Profile;
}
