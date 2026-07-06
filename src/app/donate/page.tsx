'use client';

import { useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  { value: 'tithe',    key: 'cat_tithe', icon: '🙏' },
  { value: 'offering', key: 'cat_offering', icon: '💝' },
  { value: 'missions', key: 'cat_missions', icon: '🌏' },
  { value: 'building', key: 'cat_building', icon: '🏛️' },
  { value: 'other',    key: 'cat_other', icon: '✨' },
];

const PAYMENT_METHODS = [
  {
    value: 'ewallet',
    nameKey: 'method_ewallet',
    icon: '📱',
    descKey: 'method_ewallet_desc',
  },
  {
    value: 'manual',
    nameKey: 'method_manual',
    icon: '🏦',
    descKey: 'method_manual_desc',
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
  const { t } = useLanguage();
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
  const [error, setError] = useState<string | null>(cancelledFromUrl ? t('page_donate.error_cancelled') : null);
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
      setError(t('page_donate.error_file_large'));
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

      if (!donation?.id) throw new Error(t('page_donate.error_create_failed'));
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

      if (!donation?.id) throw new Error(t('page_donate.error_create_failed'));

      setCurrentDonationId(donation.id);

      // 2. Upload biên lai nếu có
      if (receiptFile) {
        setUploadingReceipt(true);
        const form = new FormData();
        form.append('donationId', donation.id);
        form.append('file', receiptFile);
        const upRes = await fetch('/api/donations/upload-receipt', { method: 'POST', body: form });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error ?? t('page_donate.error_upload'));
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
      setError(t('page_donate.error_min_amount'));
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
          <h1>{t('page_donate.checkout_title')}</h1>
          <p>{t('page_donate.checkout_desc')}</p>
        </div>

        <div className="checkout-panel" style={{ textAlign: 'center' }}>
          <h3>💳 {formatVND(finalAmount)} VND</h3>
          <p>
            {t('page_donate.checkout_purpose')}: <strong>{CATEGORIES.find(c => c.value === category)?.key ? t(`page_donate.${CATEGORIES.find(c => c.value === category)?.key}`) : category}</strong>
          </p>
          
          <div style={{ margin: '20px auto', background: '#fff', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
            { }
            <img src={checkoutUrl} alt="Mã QR Thanh Toán" style={{ width: 250, height: 250, objectFit: 'contain' }} />
          </div>

          <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: 20 }}>
            {t('page_donate.checkout_note')}
          </p>

          <button
            className="checkout-open-btn"
            style={{ width: '100%', marginBottom: 12, display: 'flex', justifyContent: 'center' }}
            onClick={() => router.push('/profile')}
          >
            {t('page_donate.checkout_done_btn')}
          </button>
          <button
            className="checkout-cancel-btn"
            style={{ width: '100%' }}
            onClick={() => { setCheckoutUrl(null); setCurrentDonationId(null); }}
          >
            {t('page_donate.checkout_cancel_btn')}
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
          <h1>{t('page_donate.success_title')}</h1>
          <p>{t('page_donate.success_desc')}</p>
        </div>
        <div className="donate-card">
          <div className="receipt-submitted">
            <p>{t('page_donate.success_received')}</p>
            <small>{t('page_donate.success_amount').replace('{{amount}}', formatVND(finalAmount)).replace('{{category}}', CATEGORIES.find(c => c.value === category)?.key ? t(`page_donate.${CATEGORIES.find(c => c.value === category)?.key}`) : category)}</small>
            {receiptFile && <small>{t('page_donate.success_receipt')}</small>}
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
            {t('page_donate.success_more_btn')}
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
        <h1>{t('page_donate.hero_title')}</h1>
        <p>{t('page_donate.hero_desc')}</p>
      </div>

      {/* Status banners */}
      {error && (
        <div className="status-banner error">
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Số tiền */}
      <div className="donate-card">
        <p className="donate-card-title">{t('page_donate.step1_title')}</p>

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
              {preset.value === 0 ? t('page_donate.preset_other') : preset.label}
              <small>{preset.value === 0 ? t('page_donate.preset_custom') : preset.sub}</small>
            </button>
          ))}
        </div>

        {selectedPreset === 0 && (
          <input
            className="amount-custom-input"
            type="text"
            inputMode="numeric"
            placeholder={t('page_donate.step1_placeholder')}
            value={customAmount ? formatVND(Number(customAmount)) : ''}
            onChange={handleCustomAmountChange}
            autoFocus
          />
        )}
      </div>

      {/* Step 2: Mục đích */}
      <div className="donate-card">
        <p className="donate-card-title">{t('page_donate.step2_title')}</p>
        <div className="category-grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`category-btn ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{t(`page_donate.${cat.key}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Ghi chú (tuỳ chọn) */}
      <div className="donate-card">
        <p className="donate-card-title">{t('page_donate.step3_title')}</p>
        <textarea
          className="donate-textarea"
          rows={2}
          placeholder={t('page_donate.step3_placeholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Step 4: Phương thức */}
      <div className="donate-card">
        <p className="donate-card-title">{t('page_donate.step4_title')}</p>
        <div className="payment-methods">
          {PAYMENT_METHODS.map((m) => (
            <div
              key={m.value}
              className={`method-card ${paymentMethod === m.value ? 'active' : ''}`}
              onClick={() => setPaymentMethod(m.value as 'ewallet' | 'manual')}
            >
              <span className="method-icon">{m.icon}</span>
              <div className="method-name">{t(`page_donate.${m.nameKey}`)}</div>
              <div className="method-desc">{t(`page_donate.${m.descKey}`)}</div>
            </div>
          ))}
        </div>

        {/* Manual: Hiển thị thông tin TK */}
        {paymentMethod === 'manual' && (
          <div className="bank-info-block">
            <div className="bank-info-header">
              <span>🏦</span>
              <span>{t('page_donate.bank_header')}</span>
            </div>
            <div className="bank-row">
              <span className="bank-row-label">{t('page_donate.bank_name')}</span>
              <span className="bank-row-value">{bankName}</span>
            </div>
            <div className="bank-row">
              <span className="bank-row-label">{t('page_donate.bank_account')}</span>
              <span className="bank-account-number">{bankAccount}</span>
            </div>
            <div className="bank-row">
              <span className="bank-row-label">{t('page_donate.bank_holder')}</span>
              <span className="bank-row-value">{bankHolder}</span>
            </div>
            {bankBranch && (
              <div className="bank-row">
                <span className="bank-row-label">{t('page_donate.bank_branch')}</span>
                <span className="bank-row-value">{bankBranch}</span>
              </div>
            )}
            {finalAmount > 0 && (
              <div className="bank-row">
                <span className="bank-row-label">{t('page_donate.bank_amount')}</span>
                <span className="bank-row-value" style={{ color: '#48bce1' }}>
                  {formatVND(finalAmount)} VND
                </span>
              </div>
            )}
            <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyAccount}>
              {copied ? t('page_donate.bank_copied_btn') : t('page_donate.bank_copy_btn')}
            </button>

            {/* Upload biên lai */}
            <div className="upload-section">
              <span className="upload-label">
                {t('page_donate.upload_label')}
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
                  <p className="upload-hint" dangerouslySetInnerHTML={{ __html: t('page_donate.upload_hint') }}></p>
                </div>
              ) : (
                <div className="upload-preview">
                  { }
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
            {uploadingReceipt ? t('page_donate.submit_uploading') : t('page_donate.submit_loading')}
          </>
        ) : paymentMethod === 'payos' ? (
          <>{t('page_donate.submit_payos').replace('{{amount}}', finalAmount > 0 ? `– ${formatVND(finalAmount)}đ` : '')}</>
        ) : (
          <>{t('page_donate.submit_manual').replace('{{amount}}', finalAmount > 0 ? `– ${formatVND(finalAmount)}đ` : '')}</>
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
