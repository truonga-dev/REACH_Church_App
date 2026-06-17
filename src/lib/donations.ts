/**
 * Donations Management Library
 * Handles donation tracking and management
 */

import { supabase } from './supabase';

export interface Donation {
  id: string;
  user_id?: string;
  amount: number;
  currency: string;
  category: string;
  payment_method: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface DonationCreateInput {
  amount: number;
  currency?: string;
  category: string;
  payment_method: string;
  transaction_id?: string;
}

/**
 * Create new donation
 */
export async function createDonation(
  input: DonationCreateInput,
  userId?: string,
): Promise<Donation | null> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert([
        {
          ...input,
          user_id: userId,
          currency: input.currency || 'VND',
          status: 'completed',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error creating donation:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      throw error;
    }
    return data || null;
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    const errorMessage = error?.message || String(error) || 'Unknown error';
    console.error('Error creating donation:', errorMessage);
    return null;
  }
}

/**
 * Fetch all donations (admin only)
 */
export async function fetchAllDonations(limit = 20, offset = 0): Promise<Donation[]> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      // Return empty array instead of throwing to prevent Next.js error overlay
      // if the table doesn't exist yet
      return [];
    }
    return data || [];
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return [];
  }
}

/**
 * Fetch user's donations
 */
export async function fetchUserDonations(userId: string): Promise<Donation[]> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return [];
  }
}

/**
 * Get donation statistics
 */
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
      return {
        totalDonations: 0,
        totalAmount: 0,
        averageDonation: 0,
        topCategory: 'general',
      };
    }

    const donations = data || [];
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    // Find most donated category
    const categoryCounts: Record<string, number> = {};
    donations.forEach((d) => {
      categoryCounts[d.category] = (categoryCounts[d.category] || 0) + (d.amount || 0);
    });

    const topCategory =
      Object.keys(categoryCounts).reduce((a, b) =>
        categoryCounts[a] > categoryCounts[b] ? a : b,
      ) || 'general';

    return {
      totalDonations,
      totalAmount,
      averageDonation: Math.round(averageDonation),
      topCategory,
    };
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return {
      totalDonations: 0,
      totalAmount: 0,
      averageDonation: 0,
      topCategory: 'general',
    };
  }
}

/**
 * Get donations by category
 */
export async function getDonationsByCategory(category: string): Promise<Donation[]> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .eq('category', category)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }
    return data || [];
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return [];
  }
}

/**
 * Calculate total donations in date range
 */
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

    if (error) {
      return 0;
    }

    return (data || []).reduce((sum, d) => sum + (d.amount || 0), 0);
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    return 0;
  }
}
