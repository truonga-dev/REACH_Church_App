/**
 * Donations Management Library
 */

import { supabase } from './supabase';
import { formatSupabaseError } from './supabase-errors';

export type DonationStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface DonationProfile {
  full_name?: string;
  email?: string;
}

export interface Donation {
  id: string;
  user_id?: string | null;
  amount: number;
  currency: string;
  category: string;
  payment_method?: string | null;
  transaction_id?: string | null;
  donor_name?: string | null;
  admin_notes?: string | null;
  notes?: string | null;
  status: DonationStatus;
  created_at: string;
  updated_at?: string;
  profile?: DonationProfile | null;
  // PayOS fields
  payos_order_code?: number | null;
  payos_link_id?: string | null;
  checkout_url?: string | null;
  // Manual transfer fields
  receipt_image_url?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface DonationCreateInput {
  amount: number;
  currency?: string;
  category: string;
  payment_method?: string;
  transaction_id?: string;
  notes?: string;
  status?: DonationStatus;
}

export interface AdminDonationInput {
  amount: number;
  currency?: string;
  category: string;
  payment_method?: string;
  transaction_id?: string;
  donor_name?: string;
  admin_notes?: string;
  notes?: string;
  status?: DonationStatus;
  user_id?: string | null;
}

async function attachDonationProfiles(
  rows: Omit<Donation, 'profile'>[],
): Promise<Donation[]> {
  if (!rows.length) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const profileMap = new Map<string, DonationProfile>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email')
      .in('id', userIds);

    for (const p of profiles || []) {
      const entry = { full_name: p.full_name || undefined, email: p.email || undefined };
      if (p.id) profileMap.set(p.id, entry);
      if (p.user_id) profileMap.set(p.user_id, entry);
    }

    const missing = userIds.filter((id) => !profileMap.has(id));
    if (missing.length > 0) {
      const { data: byUserId } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email')
        .in('user_id', missing);

      for (const p of byUserId || []) {
        const entry = { full_name: p.full_name || undefined, email: p.email || undefined };
        if (p.id) profileMap.set(p.id, entry);
        if (p.user_id) profileMap.set(p.user_id, entry);
      }
    }
  }

  return rows.map((row) => ({
    ...row,
    profile: row.user_id ? profileMap.get(row.user_id) ?? null : null,
  }));
}

export function getDonorDisplayName(donation: Pick<Donation, 'donor_name' | 'profile'>): string {
  if (donation.donor_name?.trim()) return donation.donor_name.trim();
  if (donation.profile?.full_name?.trim()) return donation.profile.full_name.trim();
  if (donation.profile?.email?.trim()) return donation.profile.email.trim();
  return 'Ẩn danh';
}

export async function createDonation(
  input: DonationCreateInput,
  userId?: string,
): Promise<Donation | null> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert([
        {
          amount: input.amount,
          currency: input.currency || 'VND',
          category: input.category,
          payment_method: input.payment_method || null,
          transaction_id: input.transaction_id || null,
          notes: input.notes || null,
          user_id: userId ?? null,
          status: input.status || 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error creating donation:', formatSupabaseError(error));
    return null;
  }
}

export async function createAdminDonation(input: AdminDonationInput): Promise<Donation | null> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert([
        {
          amount: input.amount,
          currency: input.currency || 'VND',
          category: input.category,
          payment_method: input.payment_method || null,
          transaction_id: input.transaction_id || null,
          donor_name: input.donor_name || null,
          admin_notes: input.admin_notes || null,
          notes: input.notes || null,
          user_id: input.user_id ?? null,
          status: input.status || 'completed',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    const [withProfile] = await attachDonationProfiles(data ? [data] : []);
    return withProfile || null;
  } catch (error) {
    console.error('Error creating admin donation:', formatSupabaseError(error));
    return null;
  }
}

export async function updateDonationStatus(
  id: string,
  status: DonationStatus,
): Promise<Donation | null> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const [withProfile] = await attachDonationProfiles(data ? [data] : []);
    return withProfile || null;
  } catch (error) {
    console.error('Error updating donation status:', formatSupabaseError(error));
    return null;
  }
}

export async function updateDonation(
  id: string,
  updates: Partial<AdminDonationInput>,
): Promise<Donation | null> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const [withProfile] = await attachDonationProfiles(data ? [data] : []);
    return withProfile || null;
  } catch (error) {
    console.error('Error updating donation:', formatSupabaseError(error));
    return null;
  }
}

export async function deleteDonation(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('donations').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting donation:', formatSupabaseError(error));
    return false;
  }
}

export interface DonationFilters {
  category?: string;
  search?: string;
  status?: string;
}

export async function fetchDonationsPage(
  limit = 15,
  offset = 0,
  filters: DonationFilters = {},
): Promise<{ data: Donation[]; count: number }> {
  try {
    let query = supabase.from('donations').select('*', { count: 'exact' });

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.search?.trim()) {
      const q = filters.search.trim();
      query = query.or(
        `donor_name.ilike.%${q}%,notes.ilike.%${q}%,admin_notes.ilike.%${q}%,transaction_id.ilike.%${q}%,payment_method.ilike.%${q}%`,
      );
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return { data: [], count: 0 };
    const rows = await attachDonationProfiles(data || []);
    return { data: rows, count: count || 0 };
  } catch {
    return { data: [], count: 0 };
  }
}

/** Lấy dữ liệu cho biểu đồ/báo cáo (tối đa 500 bản ghi) */
export async function fetchDonationsForReport(
  year: number,
  filters: DonationFilters = {},
): Promise<Donation[]> {
  try {
    const start = `${year}-01-01T00:00:00.000Z`;
    const end = `${year}-12-31T23:59:59.999Z`;

    let query = supabase
      .from('donations')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end);

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) return [];
    let rows = await attachDonationProfiles(data || []);

    if (filters.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter((d) => {
        const donor = getDonorDisplayName(d).toLowerCase();
        return (
          donor.includes(q) ||
          (d.notes || '').toLowerCase().includes(q) ||
          (d.admin_notes || '').toLowerCase().includes(q) ||
          (d.transaction_id || '').toLowerCase().includes(q) ||
          (d.payment_method || '').toLowerCase().includes(q)
        );
      });
    }

    if (filters.status && filters.status !== 'all') {
      rows = rows.filter((d) => d.status === filters.status);
    }

    return rows;
  } catch {
    return [];
  }
}

export async function fetchAllDonations(limit = 200, offset = 0): Promise<Donation[]> {
  const { data } = await fetchDonationsPage(limit, offset);
  return data;
}

/** Lấy khoản có mã GD để đối soát trùng lặp */
export async function fetchDonationsForReconciliation(limit = 1000): Promise<Donation[]> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .not('transaction_id', 'is', null)
      .neq('transaction_id', '')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return attachDonationProfiles(data || []);
  } catch {
    return [];
  }
}

/** Khoản pending quá hạn (mặc định 7 ngày) */
export async function fetchOverduePendingDonations(days = 7): Promise<Donation[]> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', cutoff.toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) return [];
    return attachDonationProfiles(data || []);
  } catch {
    return [];
  }
}

export async function fetchUserDonations(userId: string): Promise<Donation[]> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getDonationStatistics(): Promise<{
  totalDonations: number;
  totalAmount: number;
  averageDonation: number;
  topCategory: string;
}> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('status', 'completed');

    if (error) {
      return { totalDonations: 0, totalAmount: 0, averageDonation: 0, topCategory: 'other' };
    }

    const donations = data || [];
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    const categoryCounts: Record<string, number> = {};
    donations.forEach((d) => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + (Number(d.amount) || 0);
    });

    const keys = Object.keys(categoryCounts);
    const topCategory = keys.length > 0
      ? keys.reduce((a, b) => (categoryCounts[a] > categoryCounts[b] ? a : b))
      : 'other';

    return {
      totalDonations,
      totalAmount,
      averageDonation: Math.round(averageDonation),
      topCategory,
    };
  } catch {
    return { totalDonations: 0, totalAmount: 0, averageDonation: 0, topCategory: 'other' };
  }
}

export async function getDonationsByCategory(category: string): Promise<Donation[]> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('category', category)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getTotalDonationsInDateRange(
  startDate: string,
  endDate: string,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('amount')
      .eq('status', 'completed')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) return 0;
    return (data || []).reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  } catch {
    return 0;
  }
}

// ───────────────────────────────────────────────────
// PayOS Integration Helpers
// ───────────────────────────────────────────────────

export interface PayOSDonationInput {
  amount: number;
  currency?: string;
  category: string;
  notes?: string;
  user_id?: string | null;
  donor_name?: string | null;
  payos_order_code: number;
  payos_link_id?: string;
  checkout_url?: string;
}

/**
 * Tạo donation row cho luồng PayOS (status = pending)
 */
export async function createPayOSDonation(
  input: PayOSDonationInput,
): Promise<Donation | null> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert([{
        amount: input.amount,
        currency: input.currency || 'VND',
        category: input.category,
        payment_method: 'PayOS',
        notes: input.notes || null,
        user_id: input.user_id ?? null,
        donor_name: input.donor_name ?? null,
        status: 'pending' as DonationStatus,
        payos_order_code: input.payos_order_code,
        payos_link_id: input.payos_link_id ?? null,
        checkout_url: input.checkout_url ?? null,
      }])
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error creating PayOS donation:', formatSupabaseError(error));
    return null;
  }
}

/**
 * Webhook callback: xác nhận thanh toán thành công qua orderCode
 */
export async function confirmDonationByOrderCode(
  orderCode: number,
): Promise<Donation | null> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('payos_order_code', orderCode)
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error confirming PayOS donation:', formatSupabaseError(error));
    return null;
  }
}

/**
 * Lưu URL ảnh biên lai chuyển khoản thủ công
 */
export async function updateDonationReceipt(
  id: string,
  receiptImageUrl: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('donations')
      .update({ receipt_image_url: receiptImageUrl, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating receipt:', formatSupabaseError(error));
    return false;
  }
}

/**
 * Admin xác nhận thủ công (duyệt biên lai)
 */
export async function adminApproveDonation(
  id: string,
  adminUserId: string,
): Promise<Donation | null> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .update({
        status: 'completed',
        reviewed_by: adminUserId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error approving donation:', formatSupabaseError(error));
    return null;
  }
}
