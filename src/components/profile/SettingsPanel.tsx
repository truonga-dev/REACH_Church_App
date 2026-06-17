'use client';

import { useState, useRef } from 'react';
import {
  ArrowLeft, Bell, Globe, CreditCard, Shield, MessageSquare, BookOpen, User,
  Edit3, Trash2,
} from 'lucide-react';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  getLanguage,
  setLanguage,
  type AppLanguage,
} from '@/lib/user-preferences';
import {
  optOutOfPushNotifications,
  promptForPushNotifications,
} from '@/lib/onesignal';

type SettingsView = 'list' | 'language' | 'payment' | 'privacy' | 'feedback' | 'usage' | 'account' | 'personal';

interface SettingsPanelProps {
  email: string;
  bio: string;
  fullName: string;
  avatarUrl: string;
  onBioChange: (bio: string) => void;
  onFullNameChange: (name: string) => void;
  onAvatarChange: (url: string) => void;
  onDeleteAvatar: () => void;
  onSaveAccount: () => void;
  isSaving: boolean;
  onBack: () => void;
  onOpenDonation: () => void;
}

export default function SettingsPanel({
  email,
  bio,
  fullName,
  avatarUrl,
  onBioChange,
  onFullNameChange,
  onAvatarChange,
  onDeleteAvatar,
  onSaveAccount,
  isSaving,
  onBack,
  onOpenDonation,
}: SettingsPanelProps) {
  const [view, setView] = useState<SettingsView>('list');
  const [notificationsOn, setNotificationsOn] = useState<boolean>(() => getNotificationsEnabled());
  const [language, setLanguageState] = useState<AppLanguage>(() => getLanguage());
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const toggleNotifications = async () => {
    const next = !notificationsOn;
    if (next) {
      setNotificationsOn(true);
      setNotificationsEnabled(true);
      const ok = await promptForPushNotifications();
      if (!ok) {
        setNotificationsOn(false);
        setNotificationsEnabled(false);
      }
    } else {
      setNotificationsOn(false);
      setNotificationsEnabled(false);
      await optOutOfPushNotifications();
    }
  };

  const selectLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    setLanguage(lang);
  };

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    const subject = encodeURIComponent('Góp ý REACH Church App');
    const body = encodeURIComponent(feedback.trim());
    window.location.href = `mailto:reachchurch.vn@gmail.com?subject=${subject}&body=${body}`;
    setFeedbackSent(true);
    setFeedback('');
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAvatarChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (view !== 'list') {
    const titles: Record<Exclude<SettingsView, 'list'>, string> = {
      language: 'Ngôn ngữ',
      payment: 'Dâng hiến',
      privacy: 'Quyền riêng tư',
      feedback: 'Góp ý',
      usage: 'Hướng dẫn sử dụng',
      account: 'Tài khoản',
      personal: 'Thông tin cá nhân',
    };

    return (
      <div className="settings-screen">
        <button type="button" className="settings-back" onClick={() => setView('list')}>
          <ArrowLeft size={18} /> {titles[view]}
        </button>

        {/* ── Personal info edit ── */}
        {view === 'personal' && (
          <div className="settings-detail">
            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', width: 88, height: 88 }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Ảnh đại diện" style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(72,188,225,0.4)' }} />
                ) : (
                  <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#48BCE1,#1e6fa8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={36} color="white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#48BCE1', border: '2px solid #0f1520', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  aria-label="Đổi ảnh"
                >
                  <Edit3 size={13} color="white" />
                </button>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarFileChange} />
              {avatarUrl && (
                <button
                  type="button"
                  onClick={onDeleteAvatar}
                  style={{ background: 'rgba(241,45,92,0.12)', border: '1px solid rgba(241,45,92,0.25)', borderRadius: 8, color: '#f12d5c', padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Trash2 size={13} /> Xóa ảnh đại diện
                </button>
              )}
            </div>

            {/* Name */}
            <label htmlFor="settings-fullname" style={{ fontSize: '0.8rem', color: '#7a8599', fontWeight: 700, display: 'block', marginBottom: 4 }}>Họ và tên</label>
            <input
              id="settings-fullname"
              className="settings-input"
              value={fullName}
              onChange={e => onFullNameChange(e.target.value)}
              placeholder="Nhập tên của bạn"
              style={{ marginBottom: '1rem' }}
            />

            {/* Bio */}
            <label htmlFor="settings-bio-personal" style={{ fontSize: '0.8rem', color: '#7a8599', fontWeight: 700, display: 'block', marginBottom: 4 }}>Giới thiệu bản thân</label>
            <textarea
              id="settings-bio-personal"
              className="settings-bio"
              rows={3}
              placeholder="Chia sẻ vài dòng về bạn..."
              value={bio}
              onChange={e => onBioChange(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />

            <button type="button" className="btn-primary settings-full-btn" onClick={onSaveAccount} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        )}

        {view === 'language' && (
          <div className="settings-detail">
            <button type="button" className={`settings-option ${language === 'vi' ? 'active' : ''}`} onClick={() => selectLanguage('vi')}>Tiếng Việt</button>
            <button type="button" className={`settings-option ${language === 'en' ? 'active' : ''}`} onClick={() => selectLanguage('en')}>English</button>
            <p className="settings-hint">Ngôn ngữ giao diện (một số nội dung vẫn bằng tiếng Việt).</p>
          </div>
        )}

        {view === 'payment' && (
          <div className="settings-detail">
            <p className="settings-text">Bạn có thể dâng hiến online qua chuyển khoản ngân hàng.</p>
            <div className="settings-info-box">
              <p><strong>Ngân hàng:</strong> Vietcombank</p>
              <p><strong>Số TK:</strong> 1012345678</p>
              <p><strong>Chủ TK:</strong> HỘI THÁNH REACH VN</p>
            </div>
            <button type="button" className="btn-primary settings-full-btn" onClick={onOpenDonation}>Xem tab Dâng hiến</button>
          </div>
        )}

        {view === 'privacy' && (
          <div className="settings-detail settings-text-block">
            <p>R.E.A.C.H Church Vietnam tôn trọng quyền riêng tư của bạn.</p>
            <ul>
              <li>Email và hồ sơ chỉ dùng để đăng nhập và cá nhân hóa trải nghiệm.</li>
              <li>Đề mục cầu nguyện riêng tư không hiển thị công khai.</li>
              <li>Tiến độ đọc Kinh Thánh lưu trên thiết bị của bạn.</li>
              <li>Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.</li>
            </ul>
            <p>Liên hệ hội thánh nếu bạn muốn xóa tài khoản.</p>
          </div>
        )}

        {view === 'feedback' && (
          <div className="settings-detail">
            <textarea
              className="settings-bio"
              rows={4}
              placeholder="Chia sẻ góp ý, báo lỗi hoặc đề xuất tính năng..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button type="button" className="btn-primary settings-full-btn" onClick={handleSendFeedback}>Gửi qua email</button>
            {feedbackSent && <p className="settings-hint success">Đã mở ứng dụng email. Cảm ơn bạn!</p>}
          </div>
        )}

        {view === 'usage' && (
          <div className="settings-detail settings-text-block">
            <ol>
              <li><strong>Trang chủ:</strong> Tin tức và hoạt động hội thánh.</li>
              <li><strong>Kinh Thánh:</strong> Đọc và đánh dấu chương đã đọc.</li>
              <li><strong>Thư viện:</strong> Bài giảng, sách nói, PDF, dưỡng linh.</li>
              <li><strong>Cầu nguyện:</strong> Gửi và cầu nguyện cùng cộng đồng.</li>
              <li><strong>Hồ sơ:</strong> Quản lý tài khoản, lịch đọc tuần, cài đặt.</li>
            </ol>
          </div>
        )}

        {view === 'account' && (
          <div className="settings-detail">
            <label htmlFor="settings-email">Email</label>
            <input id="settings-email" className="settings-input" value={email} readOnly />
            <label htmlFor="settings-bio">Giới thiệu bản thân</label>
            <textarea
              id="settings-bio"
              className="settings-bio"
              rows={3}
              placeholder="Chia sẻ vài dòng về bạn..."
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
            />
            <button type="button" className="btn-primary settings-full-btn" onClick={onSaveAccount} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="settings-screen">
      <button type="button" className="settings-back" onClick={onBack}>
        <ArrowLeft size={18} /> Cài đặt
      </button>

      <div className="settings-list">
        {/* Personal info shortcut */}
        <button type="button" className="settings-row clickable" onClick={() => setView('personal')}>
          <span className="settings-row-icon"><User size={20} /></span>
          <span className="settings-row-label">Thông tin cá nhân</span>
          <span className="settings-row-chevron">›</span>
        </button>

        <div className="settings-row">
          <span className="settings-row-icon"><Bell size={20} /></span>
          <span className="settings-row-label">Thông báo</span>
          <button
            type="button"
            className={`settings-toggle ${notificationsOn ? 'on' : ''}`}
            role="switch"
            aria-checked={notificationsOn}
            onClick={toggleNotifications}
          >
            <span className="settings-toggle-thumb" />
          </button>
        </div>

        <button type="button" className="settings-row clickable" onClick={() => setView('language')}>
          <span className="settings-row-icon"><Globe size={20} /></span>
          <span className="settings-row-label">Ngôn ngữ</span>
          <span className="settings-row-value">{language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
          <span className="settings-row-chevron">›</span>
        </button>

        <button type="button" className="settings-row clickable" onClick={() => setView('payment')}>
          <span className="settings-row-icon"><CreditCard size={20} /></span>
          <span className="settings-row-label">Dâng hiến / Thanh toán</span>
          <span className="settings-row-chevron">›</span>
        </button>

        <button type="button" className="settings-row clickable" onClick={() => setView('privacy')}>
          <span className="settings-row-icon"><Shield size={20} /></span>
          <span className="settings-row-label">Quyền riêng tư</span>
          <span className="settings-row-chevron">›</span>
        </button>

        <button type="button" className="settings-row clickable" onClick={() => setView('feedback')}>
          <span className="settings-row-icon"><MessageSquare size={20} /></span>
          <span className="settings-row-label">Góp ý</span>
          <span className="settings-row-chevron">›</span>
        </button>

        <button type="button" className="settings-row clickable" onClick={() => setView('usage')}>
          <span className="settings-row-icon"><BookOpen size={20} /></span>
          <span className="settings-row-label">Hướng dẫn sử dụng</span>
          <span className="settings-row-chevron">›</span>
        </button>
      </div>
    </div>
  );
}
