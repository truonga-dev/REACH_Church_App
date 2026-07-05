'use client';

import { useState, useRef } from 'react';
import {
  ArrowLeft, Bell, Globe, CreditCard, Shield, MessageSquare, BookOpen, User,
  Edit3, Trash2, ChevronRight, CheckCircle2, Home, Book, Library, Heart,
  Send, Lock, Eye, EyeOff, Smartphone, Star, Zap, MapPin, Phone, Mail,
  AlertTriangle, ExternalLink, Copy, Check,
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

type SettingsView =
  | 'list'
  | 'language'
  | 'payment'
  | 'privacy'
  | 'feedback'
  | 'usage'
  | 'account'
  | 'personal';

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

// ── Usage guide entries ──────────────────────────────────
const USAGE_ITEMS = [
  {
    icon: Home,
    title: 'Trang chủ',
    color: '#48bce1',
    desc: 'Xem tin tức mới nhất, sự kiện sắp diễn ra và thông báo từ hội thánh theo thời gian thực.',
    tips: ['Nhấn vào bài viết để đọc đầy đủ', 'Chia sẻ nội dung qua mạng xã hội'],
  },
  {
    icon: Book,
    title: 'Kinh Thánh',
    color: '#a78bfa',
    desc: 'Đọc và theo dõi tiến độ Kinh Thánh. Đánh dấu chương đã đọc, ghi chú câu yêu thích.',
    tips: ['Vuốt trái/phải để chuyển chương', 'Lịch đọc hiển thị trên trang Hồ sơ'],
  },
  {
    icon: Library,
    title: 'Thư viện',
    color: '#34d399',
    desc: 'Kho tài nguyên đức tin: bài giảng audio/video, sách nói, tài liệu PDF và dưỡng linh hàng ngày.',
    tips: ['Lọc theo thể loại để tìm nhanh', 'Tải về để nghe offline'],
  },
  {
    icon: Heart,
    title: 'Cầu nguyện',
    color: '#f472b6',
    desc: 'Gửi đề mục cầu nguyện cá nhân hoặc chia sẻ với cộng đồng. Cùng nhau nâng đỡ nhau trong đức tin.',
    tips: ['Đề mục riêng tư chỉ mình bạn thấy', 'Nhấn ❤️ để cầu nguyện cho người khác'],
  },
  {
    icon: User,
    title: 'Hồ sơ & Cài đặt',
    color: '#fb923c',
    desc: 'Cá nhân hóa tài khoản, xem thống kê đức tin, quản lý bài giảng đã lưu và thiết lập app.',
    tips: ['Chỉnh sửa tên bằng cách nhấn biểu tượng bút chì', 'Huy hiệu cấp độ dựa trên ngày đọc KT'],
  },
];

// ── Privacy policy items ─────────────────────────────────
const PRIVACY_ITEMS = [
  {
    icon: Lock,
    title: 'Bảo mật tài khoản',
    desc: 'Email và mật khẩu được mã hóa bằng Supabase Auth. Chúng tôi không lưu mật khẩu dưới dạng văn bản.',
  },
  {
    icon: Eye,
    title: 'Dữ liệu hiển thị',
    desc: 'Chỉ tên và ảnh đại diện hiển thị công khai. Đề mục cầu nguyện riêng tư hoàn toàn ẩn khỏi người khác.',
  },
  {
    icon: Smartphone,
    title: 'Dữ liệu thiết bị',
    desc: 'Tiến độ đọc Kinh Thánh lưu cục bộ trên thiết bị. Xóa cache app sẽ xóa dữ liệu này.',
  },
  {
    icon: Shield,
    title: 'Không bán dữ liệu',
    desc: 'R.E.A.C.H Church Vietnam cam kết không chia sẻ hay bán thông tin cá nhân cho bên thứ ba.',
  },
];

// ── Feedback categories ──────────────────────────────────
const FEEDBACK_CATEGORIES = [
  { value: 'bug',     label: '🐛 Báo lỗi',          desc: 'App bị crash, tính năng không hoạt động' },
  { value: 'feature', label: '💡 Đề xuất tính năng', desc: 'Ý tưởng cải thiện app' },
  { value: 'content', label: '📖 Nội dung',          desc: 'Phản hồi về bài giảng, bài viết' },
  { value: 'other',   label: '💬 Khác',              desc: 'Góp ý chung' },
];

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
  const [feedbackCategory, setFeedbackCategory] = useState('bug');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
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
    const cat = FEEDBACK_CATEGORIES.find(c => c.value === feedbackCategory);
    const subject = encodeURIComponent(`[${cat?.label ?? 'Góp ý'}] REACH Church App`);
    const body = encodeURIComponent(`Loại: ${cat?.label}\n\n${feedback.trim()}\n\n---\nGửi từ REACH Church App`);
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

  const copyAccountNumber = () => {
    navigator.clipboard.writeText('1012345678');
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  /* ── Sub-screen wrapper ───────────────────────────── */
  if (view !== 'list') {
    const titles: Record<Exclude<SettingsView, 'list'>, string> = {
      language: 'Ngôn ngữ',
      payment:  'Dâng hiến',
      privacy:  'Quyền riêng tư',
      feedback: 'Góp ý & Hỗ trợ',
      usage:    'Hướng dẫn sử dụng',
      account:  'Tài khoản',
      personal: 'Thông tin cá nhân',
    };

    return (
      <div className="settings-screen">
        <button type="button" className="settings-back" onClick={() => setView('list')}>
          <ArrowLeft size={18} /> {titles[view]}
        </button>

        {/* ══ PERSONAL INFO ═══════════════════════════════════ */}
        {view === 'personal' && (
          <div className="settings-detail">
            {/* Avatar block */}
            <div className="sp-avatar-block">
              <div className="sp-avatar-ring">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Ảnh đại diện" className="sp-avatar-img" />
                ) : (
                  <div className="sp-avatar-placeholder"><User size={38} color="white" /></div>
                )}
                <button
                  type="button"
                  className="sp-avatar-edit-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label="Đổi ảnh"
                >
                  <Edit3 size={13} color="white" />
                </button>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarFileChange} />
              {avatarUrl && (
                <button type="button" className="sp-delete-avatar-btn" onClick={onDeleteAvatar}>
                  <Trash2 size={13} /> Xóa ảnh đại diện
                </button>
              )}
              <p className="sp-avatar-hint">Ảnh JPG, PNG hoặc GIF · Tối đa 5MB</p>
            </div>

            {/* Email (read-only) */}
            <div className="sp-field-group">
              <label className="sp-field-label"><Mail size={13} /> Email tài khoản</label>
              <div className="sp-readonly-field">
                <span>{email}</span>
                <span className="sp-verified-badge"><CheckCircle2 size={13} /> Đã xác minh</span>
              </div>
            </div>

            {/* Name */}
            <div className="sp-field-group">
              <label htmlFor="sp-fullname" className="sp-field-label"><User size={13} /> Họ và tên</label>
              <input
                id="sp-fullname"
                className="settings-input"
                value={fullName}
                onChange={e => onFullNameChange(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                maxLength={60}
              />
              <p className="sp-field-hint">{fullName.length}/60 ký tự</p>
            </div>

            {/* Bio */}
            <div className="sp-field-group">
              <label htmlFor="sp-bio-personal" className="sp-field-label"><Edit3 size={13} /> Giới thiệu bản thân</label>
              <textarea
                id="sp-bio-personal"
                className="settings-bio"
                rows={4}
                placeholder="Chia sẻ vài dòng về bạn — đức tin, sở thích, chức vụ..."
                value={bio}
                onChange={e => onBioChange(e.target.value)}
                maxLength={200}
              />
              <p className="sp-field-hint">{bio.length}/200 ký tự</p>
            </div>

            <button type="button" className="sp-save-btn" onClick={onSaveAccount} disabled={isSaving}>
              {isSaving ? (
                <><span className="sp-spinner" /> Đang lưu...</>
              ) : (
                <><Check size={16} /> Lưu thay đổi</>
              )}
            </button>
          </div>
        )}

        {/* ══ LANGUAGE ════════════════════════════════════════ */}
        {view === 'language' && (
          <div className="settings-detail">
            <p className="sp-section-desc">Chọn ngôn ngữ hiển thị giao diện ứng dụng.</p>
            {[
              { code: 'vi' as AppLanguage, label: 'Tiếng Việt', sub: 'Vietnamese', flag: '🇻🇳' },
              { code: 'en' as AppLanguage, label: 'English',    sub: 'Tiếng Anh',  flag: '🇬🇧' },
            ].map(l => (
              <button
                key={l.code}
                type="button"
                className={`sp-lang-option ${language === l.code ? 'active' : ''}`}
                onClick={() => selectLanguage(l.code)}
              >
                <span className="sp-lang-flag">{l.flag}</span>
                <span className="sp-lang-text">
                  <span className="sp-lang-name">{l.label}</span>
                  <span className="sp-lang-sub">{l.sub}</span>
                </span>
                {language === l.code && <CheckCircle2 size={18} className="sp-lang-check" />}
              </button>
            ))}
            <div className="sp-info-banner">
              <Zap size={14} />
              Một số nội dung (bài giảng, tin tức) vẫn hiển thị bằng tiếng Việt.
            </div>
          </div>
        )}

        {/* ══ PAYMENT / DONATION ══════════════════════════════ */}
        {view === 'payment' && (
          <div className="settings-detail">
            {/* Hero */}
            <div className="sp-payment-hero">
              <div className="sp-payment-icon">💝</div>
              <h3>Dâng Hiến Trực Tuyến</h3>
              <p>&quot;Mỗi người nên tùy theo lòng mình đã định mà quyên ra, không phải phàn nàn hay miễn cưỡng.&quot;</p>
              <span className="sp-payment-verse">— 2 Cô-rinh-tô 9:7</span>
            </div>

            {/* Bank info */}
            <div className="sp-bank-card">
              <div className="sp-bank-header">
                <span className="sp-bank-logo">🏦</span>
                <div>
                  <p className="sp-bank-name">Vietcombank</p>
                  <p className="sp-bank-sub">Ngân hàng TMCP Ngoại thương VN</p>
                </div>
              </div>
              <div className="sp-bank-row">
                <span className="sp-bank-label">Số tài khoản</span>
                <div className="sp-bank-value-row">
                  <strong className="sp-bank-account">1012 3456 78</strong>
                  <button type="button" className="sp-copy-btn" onClick={copyAccountNumber}>
                    {copiedAccount ? <><Check size={12} /> Đã sao chép</> : <><Copy size={12} /> Sao chép</>}
                  </button>
                </div>
              </div>
              <div className="sp-bank-row">
                <span className="sp-bank-label">Chủ tài khoản</span>
                <strong>HỘI THÁNH REACH VIETNAM</strong>
              </div>
              <div className="sp-bank-row">
                <span className="sp-bank-label">Nội dung CK</span>
                <span className="sp-bank-note">DANGHIEN [Họ tên]</span>
              </div>
            </div>

            <a href="/donate" className="sp-donate-btn">
              <CreditCard size={18} />
              Dâng hiến qua MoMo / VNPay
              <ExternalLink size={14} />
            </a>

            <div className="sp-info-banner">
              <Shield size={14} />
              Giao dịch được bảo mật và xác nhận bởi Ban Tài chính hội thánh.
            </div>
          </div>
        )}

        {/* ══ PRIVACY ═════════════════════════════════════════ */}
        {view === 'privacy' && (
          <div className="settings-detail">
            <div className="sp-privacy-hero">
              <div className="sp-privacy-icon"><Shield size={32} color="#48bce1" /></div>
              <h3>Cam kết bảo mật</h3>
              <p>R.E.A.C.H Church Vietnam tôn trọng và bảo vệ quyền riêng tư của bạn.</p>
            </div>

            {PRIVACY_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="sp-privacy-card">
                  <div className="sp-privacy-card-icon"><Icon size={18} /></div>
                  <div>
                    <p className="sp-privacy-card-title">{item.title}</p>
                    <p className="sp-privacy-card-desc">{item.desc}</p>
                  </div>
                </div>
              );
            })}

            <div className="sp-danger-zone">
              <div className="sp-danger-header">
                <AlertTriangle size={15} /> Vùng nguy hiểm
              </div>
              <p>Nếu muốn xóa tài khoản và toàn bộ dữ liệu, hãy liên hệ hội thánh để được hỗ trợ.</p>
              <a href="mailto:reachchurch.vn@gmail.com?subject=Yêu cầu xóa tài khoản" className="sp-danger-btn">
                <Mail size={14} /> Liên hệ xóa tài khoản
              </a>
            </div>
          </div>
        )}

        {/* ══ FEEDBACK ════════════════════════════════════════ */}
        {view === 'feedback' && (
          <div className="settings-detail">
            <div className="sp-feedback-hero">
              <span style={{ fontSize: 40 }}>💌</span>
              <h3>Góp ý & Hỗ trợ</h3>
              <p>Phản hồi của bạn giúp chúng tôi cải thiện REACH App mỗi ngày.</p>
            </div>

            {!feedbackSent ? (
              <>
                {/* Category selector */}
                <p className="sp-field-label" style={{ marginBottom: 10 }}>Loại phản hồi</p>
                <div className="sp-feedback-cats">
                  {FEEDBACK_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      className={`sp-feedback-cat-btn ${feedbackCategory === cat.value ? 'active' : ''}`}
                      onClick={() => setFeedbackCategory(cat.value)}
                    >
                      <span>{cat.label}</span>
                      <span className="sp-feedback-cat-desc">{cat.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Message */}
                <div className="sp-field-group" style={{ marginTop: 16 }}>
                  <label htmlFor="sp-feedback-text" className="sp-field-label">
                    <MessageSquare size={13} /> Nội dung
                  </label>
                  <textarea
                    id="sp-feedback-text"
                    className="settings-bio"
                    rows={5}
                    placeholder="Mô tả chi tiết để chúng tôi có thể hỗ trợ tốt nhất..."
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="sp-save-btn"
                  onClick={handleSendFeedback}
                  disabled={!feedback.trim()}
                >
                  <Send size={16} /> Gửi phản hồi
                </button>

                <div className="sp-info-banner" style={{ marginTop: 14 }}>
                  <Mail size={14} />
                  Phản hồi sẽ gửi tới reachchurch.vn@gmail.com. Phản hồi trong 1–3 ngày làm việc.
                </div>
              </>
            ) : (
              <div className="sp-feedback-success">
                <CheckCircle2 size={48} color="#34d399" />
                <h3>Cảm ơn bạn! 🙏</h3>
                <p>Góp ý đã được chuyển đến ứng dụng email. Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.</p>
                <button type="button" className="sp-save-btn" onClick={() => setFeedbackSent(false)}>
                  Gửi phản hồi khác
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ USAGE GUIDE ═════════════════════════════════════ */}
        {view === 'usage' && (
          <div className="settings-detail">
            <div className="sp-usage-header">
              <Star size={20} color="#fbbf24" />
              <div>
                <h3>Hướng dẫn sử dụng</h3>
                <p>Khám phá đầy đủ tính năng của REACH Church App</p>
              </div>
            </div>

            {USAGE_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="sp-usage-card">
                  <div className="sp-usage-card-header">
                    <div className="sp-usage-icon" style={{ background: `${item.color}18`, color: item.color }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="sp-usage-title">{item.title}</p>
                    </div>
                  </div>
                  <p className="sp-usage-desc">{item.desc}</p>
                  <div className="sp-usage-tips">
                    {item.tips.map((tip, j) => (
                      <span key={j} className="sp-usage-tip"><Zap size={11} /> {tip}</span>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="sp-info-banner">
              <Phone size={14} />
              Cần hỗ trợ thêm? Liên hệ hội thánh hoặc dùng chức năng Góp ý.
            </div>
          </div>
        )}

        {/* ══ ACCOUNT ═════════════════════════════════════════ */}
        {view === 'account' && (
          <div className="settings-detail">
            <div className="sp-field-group">
              <label className="sp-field-label"><Mail size={13} /> Email</label>
              <input className="settings-input" value={email} readOnly />
            </div>
            <div className="sp-field-group">
              <label htmlFor="settings-bio" className="sp-field-label"><Edit3 size={13} /> Giới thiệu bản thân</label>
              <textarea
                id="settings-bio"
                className="settings-bio"
                rows={3}
                placeholder="Chia sẻ vài dòng về bạn..."
                value={bio}
                onChange={e => onBioChange(e.target.value)}
              />
            </div>
            <button type="button" className="sp-save-btn" onClick={onSaveAccount} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Main settings list ─────────────────────────────── */
  return (
    <div className="settings-screen">
      <button type="button" className="settings-back" onClick={onBack}>
        <ArrowLeft size={18} /> Cài đặt
      </button>

      <div className="settings-list">
        {/* Section: Tài khoản */}
        <p className="sp-section-title">Tài khoản</p>
        <button type="button" className="settings-row clickable" onClick={() => setView('personal')}>
          <span className="settings-row-icon"><User size={20} /></span>
          <span className="settings-row-label">
            Thông tin cá nhân
            <span className="sp-row-sub">Tên, ảnh đại diện, giới thiệu</span>
          </span>
          <ChevronRight size={16} className="settings-row-chevron" />
        </button>

        {/* Section: Tuỳ chọn */}
        <p className="sp-section-title" style={{ marginTop: 20 }}>Tuỳ chọn</p>
        <div className="settings-row">
          <span className="settings-row-icon" style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}><Bell size={20} /></span>
          <span className="settings-row-label">
            Thông báo đẩy
            <span className="sp-row-sub">{notificationsOn ? 'Đang bật' : 'Đang tắt'}</span>
          </span>
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
          <span className="settings-row-icon" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}><Globe size={20} /></span>
          <span className="settings-row-label">
            Ngôn ngữ
            <span className="sp-row-sub">{language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}</span>
          </span>
          <ChevronRight size={16} className="settings-row-chevron" />
        </button>

        {/* Section: Hội thánh */}
        <p className="sp-section-title" style={{ marginTop: 20 }}>Hội thánh</p>
        <button type="button" className="settings-row clickable" onClick={() => setView('payment')}>
          <span className="settings-row-icon" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}><CreditCard size={20} /></span>
          <span className="settings-row-label">
            Dâng hiến
            <span className="sp-row-sub">Thông tin ngân hàng & VietQR</span>
          </span>
          <ChevronRight size={16} className="settings-row-chevron" />
        </button>

        {/* Section: Hỗ trợ */}
        <p className="sp-section-title" style={{ marginTop: 20 }}>Hỗ trợ</p>
        <button type="button" className="settings-row clickable" onClick={() => setView('usage')}>
          <span className="settings-row-icon" style={{ background: 'rgba(72,188,225,0.12)', color: '#48bce1' }}><BookOpen size={20} /></span>
          <span className="settings-row-label">
            Hướng dẫn sử dụng
            <span className="sp-row-sub">5 tính năng chính của app</span>
          </span>
          <ChevronRight size={16} className="settings-row-chevron" />
        </button>

        <button type="button" className="settings-row clickable" onClick={() => setView('feedback')}>
          <span className="settings-row-icon" style={{ background: 'rgba(244,114,182,0.12)', color: '#f472b6' }}><MessageSquare size={20} /></span>
          <span className="settings-row-label">
            Góp ý & Hỗ trợ
            <span className="sp-row-sub">Báo lỗi, đề xuất tính năng</span>
          </span>
          <ChevronRight size={16} className="settings-row-chevron" />
        </button>

        <button type="button" className="settings-row clickable" onClick={() => setView('privacy')}>
          <span className="settings-row-icon" style={{ background: 'rgba(148,163,184,0.12)', color: '#94a3b8' }}><Shield size={20} /></span>
          <span className="settings-row-label">
            Quyền riêng tư
            <span className="sp-row-sub">Cam kết bảo mật dữ liệu</span>
          </span>
          <ChevronRight size={16} className="settings-row-chevron" />
        </button>

        {/* App version */}
        <div className="sp-app-version">
          <span>REACH Church App</span>
          <span className="sp-version-tag">v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
