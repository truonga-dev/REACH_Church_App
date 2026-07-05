'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import './page.css';

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
const AMOUNT_PRESETS = [
  { value: 50000,  label: '50K',  sub: 'Năm mươi ngàn' },
  { value: 100000, label: '100K', sub: 'Một trăm ngàn' },
  { value: 200000, label: '200K', sub: 'Hai trăm ngàn' },
  { value: 500000, label: '500K', sub: 'Năm trăm ngàn' },
  { value: 1000000, label: '1M', sub: 'Một triệu' },
  { value: 0,      label: 'Khác', sub: 'Tự nhập' },
];

const CATEGORIES = [
  { value: 'tithe',    label: 'Một phần mười', icon: '🙏' },
  { value: 'offering', label: 'Dâng hiến',     icon: '💝' },
  { value: 'missions', label: 'Truyền giáo',   icon: '🌏' },
  { value: 'building', label: 'Xây dựng',      icon: '🏛️' },
  { value: 'other',    label: 'Khác',           icon: '✨' },
];

const PAYMENT_METHODS = [
  {
    value: 'ewallet',
    name: 'MoMo / VNPay',
    icon: '📱',
    desc: 'Quét mã QR qua app ngân hàng. Xác nhận tự động.',
  },
  {
    value: 'manual',
    name: 'Chuyển khoản',
    icon: '🏦',
    desc: 'Chuyển khoản thủ công & gửi biên lai.',
  },
];

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount);
}

// ─────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────
function DonateContent() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const cancelledFromUrl = searchParams.get('status') === 'cancel';

  // Form state
  const [selectedPreset, setSelectedPreset] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState('');
  const [category, setCategory] = useState('offering');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ewallet' | 'manual' | 'payos'>('ewallet');

  // E-wallet / Donation state
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [currentDonationId, setCurrentDonationId] = useState<string | null>(null);

  // Manual transfer state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptUploaded, setReceiptUploaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(cancelledFromUrl ? 'Giao dịch đã bị huỷ.' : null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const finalAmount = selectedPreset > 0 ? selectedPreset : Number(customAmount.replace(/\D/g, ''));

  // Bank info from env
  const bankName    = process.env.NEXT_PUBLIC_CHURCH_BANK_NAME    ?? 'Vietcombank';
  const bankAccount = process.env.NEXT_PUBLIC_CHURCH_BANK_ACCOUNT ?? '1234 5678 9012';
  const bankHolder  = process.env.NEXT_PUBLIC_CHURCH_BANK_HOLDER  ?? 'Hội Thánh REACH';
  const bankBranch  = process.env.NEXT_PUBLIC_CHURCH_BANK_BRANCH  ?? '';

  // ── Handlers ──────────────────────────────
  const handlePresetClick = (value: number) => {
    setSelectedPreset(value);
    if (value > 0) setCustomAmount('');
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCustomAmount(raw);
    setSelectedPreset(0);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(bankAccount.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File quá lớn. Tối đa 5MB.');
      return;
    }
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── E-wallet Submit ────────────────────────
  const handleEwalletSubmit = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // 1. Tạo donation row thủ công (pending)
      const { createDonation } = await import('@/lib/donations');
      const donation = await createDonation(
        {
          amount: finalAmount,
          category,
          payment_method: 'MoMo / VNPay (QR)',
          notes: notes.trim() || undefined,
          status: 'pending',
        },
        user?.id,
      );

      if (!donation?.id) throw new Error('Không thể tạo giao dịch. Thử lại.');
      setCurrentDonationId(donation.id);

      // 2. Tạo Static QR Code từ VietQR.io
      // Hỗ trợ short name như 'vietcombank', 'mbbank', v.v.
      const bankId = bankName.toLowerCase().replace(/\s+/g, '');
      const accountNo = bankAccount.replace(/\s+/g, '');
      const addInfo = encodeURIComponent(`REACH ${category} ${notes}`.substring(0, 50).trim());
      const accountNameEncoded = encodeURIComponent(bankHolder);
      
      const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${finalAmount}&addInfo=${addInfo}&accountName=${accountNameEncoded}`;
      setCheckoutUrl(qrUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [finalAmount, category, notes, user, profile, bankName, bankAccount, bankHolder]);

  // ── Manual Submit ───────────────────────
  const handleManualSubmit = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      // 1. Tạo donation row với status = pending
      await fetch('/api/donations/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          category,
          notes: notes.trim() || undefined,
          userId: user?.id,
          donorName: profile?.full_name,
          paymentMethod: 'manual',
        }),
      });

      // Tạo donation thủ công trực tiếp (không cần PayOS)
      const { createDonation } = await import('@/lib/donations');
      const donation = await createDonation(
        {
          amount: finalAmount,
          category,
          payment_method: 'Chuyển khoản',
          notes: notes.trim() || undefined,
          status: 'pending',
        },
        user?.id,
      );

      if (!donation?.id) throw new Error('Không thể tạo giao dịch. Thử lại.');

      setCurrentDonationId(donation.id);

      // 2. Upload biên lai nếu có
      if (receiptFile) {
        setUploadingReceipt(true);
        const form = new FormData();
        form.append('donationId', donation.id);
        form.append('file', receiptFile);
        const upRes = await fetch('/api/donations/upload-receipt', { method: 'POST', body: form });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error ?? 'Lỗi upload biên lai');
      }

      setReceiptUploaded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
      setUploadingReceipt(false);
    }
  }, [finalAmount, category, notes, user, profile, receiptFile]);

  const handleSubmit = () => {
    if (finalAmount < 1000) {
      setError('Số tiền dâng hiến tối thiểu là 1,000 VND');
      return;
    }
    if (paymentMethod === 'ewallet') handleEwalletSubmit();
    else handleManualSubmit();
  };

  const canSubmit = finalAmount >= 1000 && !loading;

  // ─────────────────────────────────────────
  // Render: E-wallet checkout panel
  // ─────────────────────────────────────────
  if (checkoutUrl) {
    return (
      <div className="donate-page">
        <div className="donate-hero">
          <span className="donate-hero-icon">📲</span>
          <h1>Quét mã MoMo / VNPay / Bank App</h1>
          <p>Mở ứng dụng ngân hàng hoặc ví điện tử của bạn và quét mã QR bên dưới.</p>
        </div>

        <div className="checkout-panel" style={{ textAlign: 'center' }}>
          <h3>💳 {formatVND(finalAmount)} VND</h3>
          <p>
            Mục đích: <strong>{CATEGORIES.find(c => c.value === category)?.label}</strong>
          </p>
          
          <div style={{ margin: '20px auto', background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={checkoutUrl} alt="Mã QR Thanh Toán" style={{ width: 250, height: 250, objectFit: 'contain' }} />
          </div>

          <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: 20 }}>
            Hệ thống đã ghi nhận giao dịch của bạn. Vui lòng nhấn hoàn tất sau khi đã chuyển khoản thành công.
          </p>

          <button
            className="checkout-open-btn"
            style={{ width: '100%', marginBottom: 12, display: 'flex', justifyContent: 'center' }}
            onClick={() => router.push('/profile')}
          >
            ✅ Tôi đã chuyển khoản thành công
          </button>
          <button
            className="checkout-cancel-btn"
            style={{ width: '100%' }}
            onClick={() => { setCheckoutUrl(null); setCurrentDonationId(null); }}
          >
            Huỷ và quay lại
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Render: Manual success
  // ─────────────────────────────────────────
  if (receiptUploaded) {
    return (
      <div className="donate-page">
        <div className="donate-hero">
          <span className="donate-hero-icon">🙏</span>
          <h1>Cảm ơn bạn!</h1>
          <p>Thông tin dâng hiến đã được ghi nhận. Ban tài chính sẽ xác nhận trong thời gian sớm nhất.</p>
        </div>
        <div className="donate-card">
          <div className="receipt-submitted">
            <p>✅ Đã nhận thông tin dâng hiến</p>
            <small>Số tiền: {formatVND(finalAmount)} VND · {CATEGORIES.find(c => c.value === category)?.label}</small>
            {receiptFile && <small>Biên lai đã được đính kèm.</small>}
          </div>
          <button
            className="donate-submit-btn"
            style={{ width: '100%', marginTop: 16 }}
            onClick={() => {
              setReceiptUploaded(false);
              setCurrentDonationId(null);
              setReceiptFile(null);
              setReceiptPreview(null);
              setNotes('');
              setSelectedPreset(100000);
            }}
          >
            Dâng hiến thêm
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // Render: Main form
  // ─────────────────────────────────────────
  return (
    <div className="donate-page">
      {/* Back button */}
      <button className="donate-back-btn" onClick={() => router.back()} aria-label="Quay lai">
        <ArrowLeft size={20} />
      </button>

      {/* Hero */}
      <div className="donate-hero">
        <span className="donate-hero-icon">💝</span>
        <h1>Dâng Hiến</h1>
        <p>Mỗi đồng dâng hiến là một hạt giống được gieo trồng trong Nước Chúa</p>
      </div>

      {/* Status banners */}
      {error && (
        <div className="status-banner error">
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Số tiền */}
      <div className="donate-card">
        <p className="donate-card-title">Bước 1 – Số tiền dâng hiến</p>

        {finalAmount > 0 && (
          <div className="amount-display">
            <span className="amount-display-value">{formatVND(finalAmount)}</span>
            <span className="amount-display-unit">₫</span>
          </div>
        )}

        <div className="amount-presets" style={{ marginTop: finalAmount > 0 ? 14 : 0 }}>
          {AMOUNT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              className={`amount-btn ${selectedPreset === preset.value && preset.value > 0 ? 'active' : ''} ${preset.value === 0 && selectedPreset === 0 ? 'active' : ''}`}
              onClick={() => handlePresetClick(preset.value)}
            >
              {preset.label}
              <small>{preset.sub}</small>
            </button>
          ))}
        </div>

        {selectedPreset === 0 && (
          <input
            className="amount-custom-input"
            type="text"
            inputMode="numeric"
            placeholder="Nhập số tiền (VND)..."
            value={customAmount ? formatVND(Number(customAmount)) : ''}
            onChange={handleCustomAmountChange}
            autoFocus
          />
        )}
      </div>

      {/* Step 2: Mục đích */}
      <div className="donate-card">
        <p className="donate-card-title">Bước 2 – Mục đích dâng hiến</p>
        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`category-btn ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Ghi chú (tuỳ chọn) */}
      <div className="donate-card">
        <p className="donate-card-title">Ghi chú (tuỳ chọn)</p>
        <textarea
          className="donate-textarea"
          rows={2}
          placeholder="Ví dụ: Dâng hiến cho dự án xây dựng nhà thờ..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Step 4: Phương thức */}
      <div className="donate-card">
        <p className="donate-card-title">Bước 3 – Phương thức thanh toán</p>
        <div className="payment-methods">
          {PAYMENT_METHODS.map((m) => (
            <div
              key={m.value}
              className={`method-card ${paymentMethod === m.value ? 'active' : ''}`}
              onClick={() => setPaymentMethod(m.value as 'ewallet' | 'manual')}
            >
              <span className="method-icon">{m.icon}</span>
              <div className="method-name">{m.name}</div>
              <div className="method-desc">{m.desc}</div>
            </div>
          ))}
        </div>

        {/* Manual: Hiển thị thông tin TK */}
        {paymentMethod === 'manual' && (
          <div className="bank-info-block">
            <div className="bank-info-header">
              <span>🏦</span>
              <span>Thông tin chuyển khoản</span>
            </div>
            <div className="bank-row">
              <span className="bank-row-label">Ngân hàng</span>
              <span className="bank-row-value">{bankName}</span>
            </div>
            <div className="bank-row">
              <span className="bank-row-label">Số tài khoản</span>
              <span className="bank-account-number">{bankAccount}</span>
            </div>
            <div className="bank-row">
              <span className="bank-row-label">Chủ tài khoản</span>
              <span className="bank-row-value">{bankHolder}</span>
            </div>
            {bankBranch && (
              <div className="bank-row">
                <span className="bank-row-label">Chi nhánh</span>
                <span className="bank-row-value">{bankBranch}</span>
              </div>
            )}
            {finalAmount > 0 && (
              <div className="bank-row">
                <span className="bank-row-label">Số tiền</span>
                <span className="bank-row-value" style={{ color: '#48bce1' }}>
                  {formatVND(finalAmount)} VND
                </span>
              </div>
            )}
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyAccount}>
              {copied ? '✅ Đã sao chép!' : '📋 Sao chép số tài khoản'}
            </button>

            {/* Upload biên lai */}
            <div className="upload-section">
              <span className="upload-label">
                📎 Upload ảnh biên lai (tuỳ chọn – để Admin xác nhận nhanh hơn)
              </span>
              {!receiptPreview ? (
                <div className="upload-zone">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <span className="upload-icon">📷</span>
                  <p className="upload-hint">Chụp ảnh màn hình hoặc biên lai ngân hàng<br/>Tối đa 5MB</p>
                </div>
              ) : (
                <div className="upload-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={receiptPreview} alt="Biên lai" />
                  <button className="upload-remove-btn" onClick={handleRemoveReceipt}>✕</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        className="donate-submit-btn"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {loading ? (
          <>
            <span className="spinner" />
            {uploadingReceipt ? 'Đang upload biên lai...' : 'Đang xử lý...'}
          </>
        ) : paymentMethod === 'payos' ? (
          <>📱 Thanh toán qua VietQR {finalAmount > 0 && `– ${formatVND(finalAmount)}đ`}</>
        ) : (
          <>✅ Xác nhận dâng hiến {finalAmount > 0 && `– ${formatVND(finalAmount)}đ`}</>
        )}
      </button>
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense fallback={
      <div className="donate-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    }>
      <DonateContent />
    </Suspense>
  );
}
