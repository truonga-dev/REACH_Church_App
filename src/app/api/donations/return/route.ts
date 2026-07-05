/**
 * GET /api/donations/return
 * PayOS redirect người dùng về đây sau khi thanh toán xong.
 * Chuyển tiếp sang trang /donate với query params trạng thái.
 */
import { NextRequest, NextResponse } from 'next/server';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status') ?? '';
  const orderCode = searchParams.get('orderCode') ?? '';
  const code = searchParams.get('code') ?? '';

  // PayOS trả về code=00 khi thành công
  const isSuccess = code === '00' || status === 'PAID';

  const redirectUrl = isSuccess
    ? `${BASE_URL}/donate/success?orderCode=${orderCode}`
    : `${BASE_URL}/donate?status=cancel&orderCode=${orderCode}`;

  return NextResponse.redirect(redirectUrl);
}
