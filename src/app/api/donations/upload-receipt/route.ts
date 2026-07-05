/**
 * POST /api/donations/upload-receipt
 * Upload ảnh biên lai chuyển khoản thủ công lên Supabase Storage.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateDonationReceipt } from '@/lib/donations';

const BUCKET = 'donation-receipts';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Admin client để bypass RLS khi upload
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const donationId = formData.get('donationId') as string | null;

    if (!file || !donationId) {
      return NextResponse.json({ error: 'Thiếu file hoặc donationId' }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File quá lớn. Tối đa 5MB.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Chỉ hỗ trợ file ảnh (JPG, PNG, WEBP)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `receipts/${donationId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      console.error('[Upload] Supabase storage error:', uploadError);
      return NextResponse.json({ error: 'Lỗi upload ảnh. Vui lòng thử lại.' }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    await updateDonationReceipt(donationId, publicUrl);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (err: unknown) {
    console.error('[Upload] Error:', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
