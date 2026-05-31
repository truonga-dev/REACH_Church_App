'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft, Bell, Globe, CreditCard, Shield, MessageSquare, BookOpen, User,
} from 'lucide-react';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  getLanguage,
  setLanguage,
  type AppLanguage,
} from '@/lib/user-preferences';

type SettingsView = 'list' | 'language' | 'payment' | 'privacy' | 'feedback' | 'usage' | 'account';

interface SettingsPanelProps {
  email: string;
  bio: string;
  onBioChange: (bio: string) => void;
  onSaveAccount: () => void;
  isSaving: boolean;
  onBack: () => void;
  onOpenDonation: () => void;
}

export default function SettingsPanel({
  email,
  bio,
  onBioChange,
  onSaveAccount,
  isSaving,
  onBack,
  onOpenDonation,
}: SettingsPanelProps) {
  const [view, setView] = useState<SettingsView>('list');
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [language, setLanguageState] = useState<AppLanguage>('vi');
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    setNotificationsOn(getNotificationsEnabled());
    setLanguageState(getLanguage());
  }, []);

  const toggleNotifications = () => {
    const next = !notificationsOn;
    setNotificationsOn(next);
    setNotificationsEnabled(next);
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

  if (view !== 'list') {
    const titles: Record<Exclude<SettingsView, 'list'>, string> = {
      language: 'Ngôn ngữ',
      payment: 'Dâng hiến',
      privacy: 'Quyền riêng tư',
      feedback: 'Góp ý',
      usage: 'Hướng dẫn sử dụng',
      account: 'Tài khoản',
    };

    return (
      <div className="settings-screen">
        <button type="button" className="settings-back" onClick={() => setView('list')}>
          <ArrowLeft size={18} /> {titles[view]}
        </button>

        {view === 'language' && (
          <div className="settings-detail">
            <button
              type="button"
              className={`settings-option ${language === 'vi' ? 'active' : ''}`}
              onClick={() => selectLanguage('vi')}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              className={`settings-option ${language === 'en' ? 'active' : ''}`}
              onClick={() => selectLanguage('en')}
            >
              English
            </button>
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
            <button type="button" className="btn-primary settings-full-btn" onClick={onOpenDonation}>
              Xem tab Dâng hiến
            </button>
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
            <button type="button" className="btn-primary settings-full-btn" onClick={handleSendFeedback}>
              Gửi qua email
            </button>
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

        <button type="button" className="settings-row clickable" onClick={() => setView('account')}>
          <span className="settings-row-icon"><User size={20} /></span>
          <span className="settings-row-label">Tài khoản & Bio</span>
          <span className="settings-row-chevron">›</span>
        </button>
      </div>
    </div>
  );
}
