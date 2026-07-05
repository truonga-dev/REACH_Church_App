'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function DonateSuccessContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode');

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1528 50%, #0a0f1e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, -apple-system, sans-serif',
      color: '#f1f5f9',
      textAlign: 'center',
    }}>
      {/* Success Animation */}
      <div style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'rgba(16,185,129,0.15)',
        border: '2px solid rgba(16,185,129,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 48,
        marginBottom: 24,
        animation: 'scaleIn 0.5s ease',
      }}>
        ✅
      </div>

      <h1 style={{
        fontSize: 28,
        fontWeight: 800,
        margin: '0 0 12px',
        background: 'linear-gradient(135deg, #ffffff 0%, #10b981 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        Cảm ơn bạn! 🙏
      </h1>

      <p style={{
        fontSize: 15,
        color: 'rgba(241,245,249,0.65)',
        maxWidth: 300,
        lineHeight: 1.6,
        margin: '0 0 8px',
      }}>
        Giao dịch dâng hiến của bạn đã được xác nhận thành công.
      </p>

      {orderCode && (
        <p style={{
          fontSize: 13,
          color: 'rgba(241,245,249,0.4)',
          margin: '0 0 32px',
        }}>
          Mã giao dịch: <strong style={{ color: '#48bce1' }}>#{orderCode}</strong>
        </p>
      )}

      <blockquote style={{
        background: 'rgba(72,188,225,0.07)',
        border: '1px solid rgba(72,188,225,0.2)',
        borderRadius: 16,
        padding: '18px 20px',
        margin: '0 0 32px',
        maxWidth: 320,
        fontSize: 14,
        color: 'rgba(241,245,249,0.75)',
        lineHeight: 1.7,
        fontStyle: 'italic',
      }}>
        "Người nào gieo ít thì gặt ít; người nào gieo nhiều thì gặt nhiều."
        <cite style={{
          display: 'block',
          marginTop: 8,
          fontSize: 12,
          color: '#48bce1',
          fontStyle: 'normal',
          fontWeight: 700,
        }}>
          2 Cô-rinh-tô 9:6
        </cite>
      </blockquote>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
        <Link
          href="/donate"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '14px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #48bce1 0%, #3a9dbf 100%)',
            color: '#0a0f1e',
            fontWeight: 800,
            fontSize: 15,
            textDecoration: 'none',
            boxShadow: '0 6px 24px rgba(72,188,225,0.35)',
          }}
        >
          💝 Dâng hiến thêm
        </Link>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '14px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            color: '#f1f5f9',
            fontWeight: 600,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          🏠 Về trang chủ
        </Link>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0f1e', color: '#f1f5f9'
      }}>
        Loading...
      </div>
    }>
      <DonateSuccessContent />
    </Suspense>
  );
}
