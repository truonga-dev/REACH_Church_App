import type { Prayer } from '@/types';
import { PRAYER_TOPICS } from '@/types';

export type PrayerDbStatus = 'pending' | 'reviewed' | 'answered' | 'closed';

export const PRAYER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: '#f59e0b' },
  reviewed: { label: 'Đã duyệt', color: '#48bce1' },
  answered: { label: 'Đã nhậm', color: '#10b981' },
  closed: { label: 'Đã đóng', color: '#64748b' },
  ongoing: { label: 'Đang cầu nguyện', color: '#f59e0b' },
  completed: { label: 'Đã hoàn thành', color: '#64748b' },
};

export function prayerBody(prayer: Pick<Prayer, 'title' | 'description' | 'content'>): string {
  return prayer.content || prayer.description || prayer.title || '';
}

export function prayerIntercessionCount(
  prayer: Pick<Prayer, 'prayer_count' | 'pray_count'>,
): number {
  return prayer.prayer_count ?? prayer.pray_count ?? 0;
}

export function isPrayerActive(status: string): boolean {
  return status === 'ongoing' || status === 'pending' || status === 'reviewed';
}

export function isPrayerAnswered(status: string): boolean {
  return status === 'answered' || status === 'completed' || status === 'closed';
}

export function prayerCategory(prayer: Pick<Prayer, 'category' | 'topic'>): string {
  return prayer.category || prayer.topic || 'other';
}

export function prayerCategoryLabel(prayer: Pick<Prayer, 'category' | 'topic'>): string {
  const key = prayerCategory(prayer);
  return PRAYER_TOPICS[key] || key;
}

export function normalizePrayerStatus(status: string): string {
  if (status === 'ongoing') return 'pending';
  if (status === 'completed') return 'closed';
  return status;
}

export function getPrayerStatusConfig(status: string) {
  const normalized = normalizePrayerStatus(status);
  return PRAYER_STATUS_CONFIG[normalized] || PRAYER_STATUS_CONFIG.pending;
}

export function matchesPrayerStatusFilter(prayer: Prayer, filter: string): boolean {
  if (filter === 'all') return true;
  const status = normalizePrayerStatus(prayer.status);
  if (filter === 'active') return isPrayerActive(prayer.status);
  return status === filter;
}

export function canReviewPrayer(status: string): boolean {
  const s = normalizePrayerStatus(status);
  return s === 'pending';
}

export function canMarkAnswered(status: string): boolean {
  const s = normalizePrayerStatus(status);
  return s === 'pending' || s === 'reviewed';
}

export function canClosePrayer(status: string): boolean {
  const s = normalizePrayerStatus(status);
  return s === 'pending' || s === 'reviewed' || s === 'answered';
}

export function buildPrayerInsert(payload: {
  title: string;
  content: string;
  category?: string;
  userId?: string;
  isPrivate?: boolean;
}) {
  return {
    title: payload.title,
    content: payload.content,
    category: payload.category || 'other',
    status: 'pending' as const,
    user_id: payload.userId ?? null,
    is_private: payload.isPrivate ?? false,
    prayer_count: 0,
  };
}
