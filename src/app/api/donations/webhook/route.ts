/**
 * POST /api/donations/webhook
 * PayOS gọi endpoint này khi có thanh toán thành công.
 * Đăng ký URL này tại: my.payos.vn → Webhook URL
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPayOS } from '@/lib/payos';
import { confirmDonationByOrderCode } from '@/lib/donations';
import type { Webhook } from '@payos/node';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Webhook;

    // Xác thực chữ ký từ PayOS (async)
    const payos = getPayOS();
    const webhookData = await payos.webhooks.verify(body);

    // Chỉ xử lý khi thanh toán thành công (code = '00')
    if (body.code === '00' && webhookData?.orderCode) {
      const orderCode = Number(webhookData.orderCode);
      await confirmDonationByOrderCode(orderCode);
      console.log(`[Webhook] PayOS donation confirmed: orderCode=${orderCode}`);
    }

    return NextResponse.json({ code: '00', desc: 'success' });
  } catch (err: unknown) {
    console.error('[Webhook] PayOS verification failed:', err);
    return NextResponse.json({ code: '01', desc: 'fail' }, { status: 400 });
  }
}

// GET: PayOS dùng để verify webhook URL
export async function GET() {
  return NextResponse.json({ code: '00', desc: 'Webhook endpoint active' });
}
