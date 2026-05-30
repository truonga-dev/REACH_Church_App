'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import '../login/auth.css';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    const { error: err, needsEmailConfirmation } = await signUp(email.trim(), password, fullName.trim());
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    if (needsEmailConfirmation) {
      setSuccess('Đăng ký thành công! Kiểm tra email và bấm link xác nhận trước khi đăng nhập.');
      return;
    }

    setSuccess('Đăng ký thành công! Chuyển sang trang đăng nhập...');
    setTimeout(() => router.push('/login'), 2000);
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
          <h1>Tạo tài khoản</h1>
          <p>Tham gia cộng đồng R.E.A.C.H Church Vietnam</p>
          <span className="auth-brand-badge">Miễn phí • Dành cho tín hữu</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div className="auth-field">
            <label htmlFor="fullName">Họ và tên</label>
            <div className="auth-input-wrap">
              <User size={18} className="auth-input-icon" />
              <input
                id="fullName"
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

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
                autoComplete="new-password"
                placeholder="Ít nhất 6 ký tự"
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

          <div className="auth-field">
            <label htmlFor="confirm">Xác nhận mật khẩu</label>
            <div className="auth-input-wrap">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <><Loader2 size={18} className="spin" style={{ display: 'inline', marginRight: 8 }} /> Đang đăng ký...</>
            ) : (
              'Tạo tài khoản'
            )}
          </button>
        </form>

        <div className="auth-divider">hoặc</div>

        <p className="auth-switch">
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
