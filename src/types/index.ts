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

export const PRAYER_TOPICS: Record<string, string> = {
  health: 'Sức khỏe',
  family: 'Gia đình',
  work: 'Công việc / Tài chính',
  faith: 'Đời sống thuộc linh',
  other: 'Khác',
};
