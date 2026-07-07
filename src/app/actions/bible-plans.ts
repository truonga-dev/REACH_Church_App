'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with the service role key to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function saveBiblePlanDay(planId: string, dayNumber: number, verses: string) {
  try {
    // Check if day exists
    const { data: existing } = await supabaseAdmin
      .from('bible_plan_days')
      .select('id')
      .eq('plan_id', planId)
      .eq('day_number', dayNumber)
      .single();

    if (existing) {
      const { error } = await supabaseAdmin
        .from('bible_plan_days')
        .update({ verses })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from('bible_plan_days')
        .insert([{ plan_id: planId, day_number: dayNumber, verses }]);
      if (error) throw error;
    }
    return { success: true };
  } catch (error: any) {
    console.error('Error in saveBiblePlanDay:', error);
    return { error: error.message };
  }
}

export async function deleteBiblePlanDay(planId: string, dayId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('bible_plan_days')
      .delete()
      .eq('id', dayId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteBiblePlanDay:', error);
    return { error: error.message };
  }
}

export async function deleteBiblePlanDayByNumber(planId: string, dayNumber: number) {
  try {
    const { error } = await supabaseAdmin
      .from('bible_plan_days')
      .delete()
      .eq('plan_id', planId)
      .eq('day_number', dayNumber);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteBiblePlanDayByNumber:', error);
    return { error: error.message };
  }
}
