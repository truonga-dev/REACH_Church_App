'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isEmailNotConfirmedError } from '@/lib/auth-errors';
import './auth.css';

export default function LoginPage() {
  const { signIn, resendConfirmationEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendMsg('');
    setNeedsConfirmation(false);
    setLoading(true);
    const { error: err, rawError } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      setNeedsConfirmation(rawError ? isEmailNotConfirmedError(rawError) : false);
      return;
    }
    router.push('/profile');
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Nhập email để gửi lại link xác nhận.');
      return;
    }
    setResending(true);
    setResendMsg('');
    const { error: err } = await resendConfirmationEmail(email.trim());
    setResending(false);
    setResendMsg(err ?? 'Đã gửi lại email xác nhận. Kiểm tra hộp thư (và cả thư rác).');
  };

  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <Link href="/" className="auth-back-link">
          <ArrowLeft size={16} /> Về trang chủ
        </Link>
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-ring">
            <Image src="/logo.png" alt="REACH" width={72} height={72} />
          </div>
          <h1>Đăng nhập</h1>
          <p>Chào mừng trở lại cộng đồng R.E.A.C.H Church</p>
          <span className="auth-brand-badge">REACH Church Vietnam</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {resendMsg && <div className="auth-success">{resendMsg}</div>}
          {needsConfirmation && (
            <button type="button" className="auth-resend-btn" onClick={handleResend} disabled={resending}>
              {resending ? 'Đang gửi...' : 'Gửi lại email xác nhận'}
            </button>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <div className="auth-input-wrap">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Mật khẩu</label>
            <div className="auth-input-wrap">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <><Loader2 size={18} className="spin" style={{ display: 'inline', marginRight: 8 }} /> Đang đăng nhập...</>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div className="auth-divider">hoặc</div>

        <p className="auth-switch">
          Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link>
        </p>
      </div>
    </div>
  );
}
