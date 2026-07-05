/**
 * POST /api/donations/create-payment
 * Tạo PayOS payment link và lưu donation row vào DB.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPayOS } from '@/lib/payos';
import { createPayOSDonation } from '@/lib/donations';
import { createClient } from '@supabase/supabase-js';

// Supabase admin client (bypass RLS) – chỉ dùng server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, category, notes, userId, donorName } = body as {
      amount: number;
      category: string;
      notes?: string;
      userId?: string;
      donorName?: string;
    };

    // Validate
    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Số tiền dâng hiến tối thiểu là 1,000 VND' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'Vui lòng chọn mục đích dâng hiến' }, { status: 400 });
    }

    // Tạo orderCode unique (số nguyên, tối đa 9 chữ số theo giới hạn PayOS)
    const orderCode = Number(String(Date.now()).slice(-9));

    // Tên người dùng để hiển thị trong PayOS
    let displayName = donorName?.trim() || '';
    if (!displayName && userId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .single();
      displayName = profile?.full_name || '';
    }

    const categoryLabels: Record<string, string> = {
      tithe: 'Một phần mười',
      offering: 'Dâng hiến',
      missions: 'Truyền giáo',
      building: 'Xây dựng',
      other: 'Dâng hiến khác',
    };
    const description = `REACH ${categoryLabels[category] ?? category}`.slice(0, 25);

    // Gọi PayOS API
    const payos = getPayOS();
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount,
      description,
      cancelUrl: `${BASE_URL}/donate?status=cancel`,
      returnUrl: `${BASE_URL}/api/donations/return`,
      buyerName: displayName || undefined,
    });

    // Lưu vào DB
    const donation = await createPayOSDonation({
      amount,
      category,
      notes,
      user_id: userId ?? null,
      donor_name: displayName || null,
      payos_order_code: orderCode,
      payos_link_id: paymentLink.paymentLinkId,
      checkout_url: paymentLink.checkoutUrl,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode,
      donationId: donation?.id,
    });
  } catch (err: unknown) {
    console.error('[PayOS] create-payment error:', err);
    const msg = err instanceof Error ? err.message : 'Lỗi tạo link thanh toán';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
