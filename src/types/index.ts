export type PrayerStatus = 'ongoing' | 'answered' | 'completed';

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
  description?: string;
  status: PrayerStatus | string;
  created_at: string;
  user_id?: string;
  author_name?: string;
  topic?: string;
  is_private?: boolean;
  pray_count?: number;
  notes?: string;
}

export interface Sermon {
  id: string;
  title: string;
  speaker?: string;
  series?: string;
  date?: string;
  youtube_url?: string;
  youtube_id?: string;
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
  created_at?: string;
}

export const PRAYER_TOPICS: Record<string, string> = {
  health: 'Sức khỏe',
  family: 'Gia đình',
  work: 'Công việc / Tài chính',
  faith: 'Đời sống thuộc linh',
  other: 'Khác',
};
