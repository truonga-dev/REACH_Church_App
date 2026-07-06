'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Bell, Globe, CreditCard, Shield, MessageSquare, BookOpen, User,
  Edit3, Trash2, ChevronRight, CheckCircle2, Home, Book, Library, Heart,
  Send, Lock, Eye, EyeOff, Smartphone, Star, Zap, MapPin, Phone, Mail,
  AlertTriangle, ExternalLink, Copy, Check, Info,
} from 'lucide-react';
import {
  getNotificationsEnabled,
  setNotificationsEnabled,
  getLanguage,
  type AppLanguage,
} from '@/lib/user-preferences';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  optOutOfPushNotifications,
  promptForPushNotifications,
} from '@/lib/onesignal';
import BibleSettings from './BibleSettings';

type SettingsView =
  | 'list'
  | 'language'
  | 'payment'
  | 'privacy'
  | 'feedback'
  | 'usage'
  | 'account'
  | 'bible'
  | 'personal'
  | 'about';

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
const getUsageItems = (t: any) => [
  {
    icon: Home,
    title: t('settings_usage.home_title'),
    color: '#48bce1',
    desc: t('settings_usage.home_desc'),
    tips: [t('settings_usage.home_tip1'), t('settings_usage.home_tip2')],
  },
  {
    icon: Book,
    title: t('settings_usage.bible_title'),
    color: '#a78bfa',
    desc: t('settings_usage.bible_desc'),
    tips: [t('settings_usage.bible_tip1'), t('settings_usage.bible_tip2')],
  },
  {
    icon: Library,
    title: t('settings_usage.library_title'),
    color: '#34d399',
    desc: t('settings_usage.library_desc'),
    tips: [t('settings_usage.library_tip1'), t('settings_usage.library_tip2')],
  },
  {
    icon: Heart,
    title: t('settings_usage.prayer_title'),
    color: '#f472b6',
    desc: t('settings_usage.prayer_desc'),
    tips: [t('settings_usage.prayer_tip1'), t('settings_usage.prayer_tip2')],
  },
  {
    icon: User,
    title: t('settings_usage.profile_title'),
    color: '#fb923c',
    desc: t('settings_usage.profile_desc'),
    tips: [t('settings_usage.profile_tip1'), t('settings_usage.profile_tip2')],
  },
];

// ── Privacy policy items ─────────────────────────────────
const getPrivacyItems = (t: any) => [
  {
    icon: Lock,
    title: t('settings_privacy.acct_title'),
    desc: t('settings_privacy.acct_desc'),
  },
  {
    icon: Eye,
    title: t('settings_privacy.display_title'),
    desc: t('settings_privacy.display_desc'),
  },
  {
    icon: Smartphone,
    title: t('settings_privacy.device_title'),
    desc: t('settings_privacy.device_desc'),
  },
  {
    icon: Shield,
    title: t('settings_privacy.sell_title'),
    desc: t('settings_privacy.sell_desc'),
  },
];

// ── Feedback categories ──────────────────────────────────
const getFeedbackCategories = (t: any) => [
  { value: 'bug',     label: t('settings_feedback.cat_bug'),          desc: t('settings_feedback.cat_bug_desc') },
  { value: 'feature', label: t('settings_feedback.cat_feature'), desc: t('settings_feedback.cat_feature_desc') },
  { value: 'content', label: t('settings_feedback.cat_content'),          desc: t('settings_feedback.cat_content_desc') },
  { value: 'other',   label: t('settings_feedback.cat_other'),              desc: t('settings_feedback.cat_other_desc') },
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
  const { language, setLanguage, t } = useLanguage();
  const [pendingLanguage, setPendingLanguage] = useState<AppLanguage>(language as AppLanguage);
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

  // Sync pendingLanguage when view becomes 'language'
  useEffect(() => {
    if (view === 'language') {
      setPendingLanguage(language as AppLanguage);
    }
  }, [view, language]);

  const selectLanguage = (lang: AppLanguage) => {
    setPendingLanguage(lang);
  };

  const applyLanguage = () => {
    setLanguage(pendingLanguage as any);
    setView('list'); // Optionally go back
  };

  const handleSendFeedback = () => {
    if (!feedback.trim()) return;
    const FEEDBACK_CATEGORIES = getFeedbackCategories(t);
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
      language: t('settings_panel.language'),
      payment:  t('settings_panel.donate'),
      about:    t('settings_panel.about'),
      privacy:  t('settings_panel.privacy'),
      feedback: t('settings_panel.feedback'),
      usage:    t('settings_panel.guide'),
      account:  t('settings_panel.account'),
      personal: t('settings_panel.personal_info'),
      bible: 'Đọc Kinh Thánh',
    };

    return (
      <div className="settings-screen">
        <button type="button" className="settings-back" onClick={() => setView('list')}>
          <ArrowLeft size={18} /> {titles[view]}
        </button>

        {/* ══ BIBLE SETTINGS ═══════════════════════════════════ */}
        {view === 'bible' && <BibleSettings />}

        {/* ══ PERSONAL INFO ═══════════════════════════════════ */}
        {view === 'personal' && (
          <div className="settings-detail">
            {/* Avatar block */}
            <div className="sp-avatar-block">
              <div className="sp-avatar-ring">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={t('settings_panel.personal_avatar')} className="sp-avatar-img" />
                ) : (
                  <div className="sp-avatar-placeholder"><User size={38} color="white" /></div>
                )}
                <button
                  type="button"
                  className="sp-avatar-edit-btn"
                  onClick={() => avatarInputRef.current?.click()}
                  aria-label={t('settings_panel.personal_change_avatar')}
                >
                  <Edit3 size={13} color="white" />
                </button>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarFileChange} />
              {avatarUrl && (
                <button type="button" className="sp-delete-avatar-btn" onClick={onDeleteAvatar}>
                  <Trash2 size={13} /> {t('settings_panel.personal_delete_avatar')}
                </button>
              )}
              <p className="sp-avatar-hint">{t('settings_panel.personal_avatar_hint')}</p>
            </div>

            {/* Email (read-only) */}
            <div className="sp-field-group">
              <label className="sp-field-label"><Mail size={13} /> {t('settings_panel.personal_email')}</label>
              <div className="sp-readonly-field">
                <span>{email}</span>
                <span className="sp-verified-badge"><CheckCircle2 size={13} /> {t('settings_panel.personal_verified')}</span>
              </div>
            </div>

            {/* Name */}
            <div className="sp-field-group">
              <label htmlFor="sp-fullname" className="sp-field-label"><User size={13} /> {t('settings_panel.personal_fullname')}</label>
              <input
                id="sp-fullname"
                className="settings-input"
                value={fullName}
                onChange={e => onFullNameChange(e.target.value)}
                placeholder={t('settings_panel.personal_fullname_placeholder')}
                maxLength={60}
              />
              <p className="sp-field-hint">{fullName.length}/60 {t('settings_panel.personal_chars')}</p>
            </div>

            {/* Bio */}
            <div className="sp-field-group">
              <label htmlFor="sp-bio-personal" className="sp-field-label"><Edit3 size={13} /> {t('settings_panel.personal_bio')}</label>
              <textarea
                id="sp-bio-personal"
                className="settings-bio"
                rows={4}
                placeholder={t('settings_panel.personal_bio_placeholder')}
                value={bio}
                onChange={e => onBioChange(e.target.value)}
                maxLength={200}
              />
              <p className="sp-field-hint">{bio.length}/200 {t('settings_panel.personal_chars')}</p>
            </div>

            <button type="button" className="sp-save-btn" onClick={onSaveAccount} disabled={isSaving}>
              {isSaving ? (
                <><span className="sp-spinner" /> {t('settings_panel.personal_saving')}</>
              ) : (
                <><Check size={16} /> {t('settings_panel.personal_save_changes')}</>
              )}
            </button>
          </div>
        )}

        {/* ══ LANGUAGE ════════════════════════════════════════ */}
        {view === 'language' && (
          <div className="settings-detail">
            <p className="sp-section-desc">{t('settings_panel.language_choose')}</p>
            {[
              { code: 'vi' as AppLanguage, label: 'Tiếng Việt', sub: 'Vietnamese', flag: 'vn' },
              { code: 'en' as AppLanguage, label: 'English',    sub: 'Tiếng Anh',  flag: 'gb' },
              { code: 'ko' as AppLanguage, label: '한국어',      sub: 'Tiếng Hàn',  flag: 'kr' },
            ].map(l => (
              <button
                key={l.code}
                type="button"
                className={`sp-lang-option ${pendingLanguage === l.code ? 'active' : ''}`}
                onClick={() => selectLanguage(l.code)}
              >
                <div className="sp-lang-flag" style={{ background: 'transparent', padding: 0 }}>
                  <img 
                    src={`https://flagcdn.com/w40/${l.flag}.png`} 
                    alt={l.label} 
                    style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '50%' }} 
                  />
                </div>
                <span className="sp-lang-text">
                  <span className="sp-lang-name">{l.label}</span>
                  <span className="sp-lang-sub">{l.sub}</span>
                </span>
                {pendingLanguage === l.code && <CheckCircle2 size={18} className="sp-lang-check" />}
              </button>
            ))}
            <div className="sp-info-banner" style={{ marginBottom: '20px' }}>
              <Zap size={14} />
              {t('settings_panel.language_info')}
            </div>
            {pendingLanguage !== language && (
              <button 
                type="button" 
                className="sp-save-btn" 
                onClick={applyLanguage}
              >
                <Check size={16} /> {t('settings_panel.language_update')}
              </button>
            )}
          </div>
        )}

        {/* ══ PAYMENT / DONATION ══════════════════════════════ */}
        {view === 'payment' && (
          <div className="settings-detail">
            {/* Hero */}
            <div className="sp-payment-hero">
              <div className="sp-payment-icon">💝</div>
              <h3>{t('settings_payment.hero_title')}</h3>
              <p>{t('settings_payment.hero_quote')}</p>
              <span className="sp-payment-verse">{t('settings_payment.hero_verse')}</span>
            </div>

            {/* Bank info */}
            <div className="sp-bank-card">
              <div className="sp-bank-header">
                <span className="sp-bank-logo">🏦</span>
                <div>
                  <p className="sp-bank-name">{t('settings_payment.bank_name')}</p>
                  <p className="sp-bank-sub">{t('settings_payment.bank_sub')}</p>
                </div>
              </div>
              <div className="sp-bank-row">
                <span className="sp-bank-label">{t('settings_payment.acc_number')}</span>
                <div className="sp-bank-value-row">
                  <strong className="sp-bank-account">1012 3456 78</strong>
                  <button type="button" className="sp-copy-btn" onClick={copyAccountNumber}>
                    {copiedAccount ? <><Check size={12} /> {t('settings_payment.copied')}</> : <><Copy size={12} /> {t('settings_payment.copy')}</>}
                  </button>
                </div>
              </div>
              <div className="sp-bank-row">
                <span className="sp-bank-label">{t('settings_payment.acc_holder')}</span>
                <strong>{t('settings_payment.acc_name')}</strong>
              </div>
              <div className="sp-bank-row">
                <span className="sp-bank-label">{t('settings_payment.content_label')}</span>
                <span className="sp-bank-note">{t('settings_payment.content_note')}</span>
              </div>
            </div>

            <a href="/donate" className="sp-donate-btn">
              <CreditCard size={18} />
              {t('settings_payment.btn_ewallet')}
              <ExternalLink size={14} />
            </a>

            <div className="sp-info-banner">
              <Shield size={14} />
              {t('settings_payment.info_secure')}
            </div>
          </div>
        )}

        {/* ══ ABOUT US ════════════════════════════════════════ */}
        {view === 'about' && (
          <div className="settings-detail">
            {/* Ảnh nền */}
            <div style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', marginTop: '10px' }}>
              <img src="/images/church-bg.jpg" alt="Church Background" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 75%' }}
                   onError={(e) => { e.currentTarget.src = '/logo.png'; e.currentTarget.style.objectFit = 'contain'; e.currentTarget.style.background = '#0f172a'; }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
              <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/logo.png" alt="REACH Church" style={{ width: 50, height: 50, borderRadius: '24%', objectFit: 'cover', background: '#fff' }} 
                     onError={(e) => { e.currentTarget.style.display='none' }} />
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>REACH Church</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0 }}>{t('settings_about.subtitle')}</p>
                </div>
              </div>
            </div>
            
            {/* Lịch sử / Giới thiệu */}
            <div className="sp-privacy-card" style={{ display: 'block', padding: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '0.95rem', lineHeight: 1.6 }}>{t('settings_about.history_p1')}</p>
              <p style={{ margin: '0 0 12px', fontSize: '0.95rem', lineHeight: 1.6 }}>{t('settings_about.history_p2')}</p>
              <p style={{ margin: '0', fontSize: '0.95rem', lineHeight: 1.6 }}>{t('settings_about.history_p3')}</p>
            </div>
            
            {/* Sứ Mạng */}
            <div style={{ marginTop: '24px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px', color: '#48bce1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} /> {t('settings_about.mission_title')}
              </h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>{t('settings_about.mission_intro')}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num} style={{ background: 'rgba(72,188,225,0.05)', padding: '12px', borderRadius: '12px', borderLeft: '3px solid #48bce1' }}>
                    <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '0.95rem', color: '#48bce1' }}>{t(`settings_about.mission_${num}_title` as any)}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{t(`settings_about.mission_${num}_desc` as any)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Giá Trị Cốt Lõi */}
            <div style={{ marginTop: '28px', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '16px', color: '#fb923c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={20} /> {t('settings_about.values_title')}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <div key={num} style={{ background: 'rgba(251,146,60,0.05)', padding: '12px', borderRadius: '12px', borderLeft: '3px solid #fb923c' }}>
                    <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '0.95rem', color: '#fb923c' }}>{t(`settings_about.value_${num}_title` as any)}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>{t(`settings_about.value_${num}_desc` as any)}</p>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}

        {/* ══ PRIVACY ═════════════════════════════════════════ */}
        {view === 'privacy' && (
          <div className="settings-detail">
            <div className="sp-privacy-hero">
              <div className="sp-privacy-icon"><Shield size={32} color="#48bce1" /></div>
              <h3>{t('settings_privacy.title_security')}</h3>
              <p>{t('settings_privacy.desc_security')}</p>
            </div>

            {getPrivacyItems(t).map((item, i) => {
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
                <AlertTriangle size={15} /> {t('settings_privacy.danger_zone')}
              </div>
              <p>{t('settings_privacy.danger_desc')}</p>
              <a href="mailto:reachchurch.vn@gmail.com?subject=Yêu cầu xóa tài khoản" className="sp-danger-btn">
                <Mail size={14} /> {t('settings_privacy.danger_btn')}
              </a>
            </div>
          </div>
        )}

        {/* ══ FEEDBACK ════════════════════════════════════════ */}
        {view === 'feedback' && (
          <div className="settings-detail">
            <div className="sp-feedback-hero">
              <span style={{ fontSize: 40 }}>💌</span>
              <h3>{t('settings_feedback.hero_title')}</h3>
              <p>{t('settings_feedback.hero_desc')}</p>
            </div>

            {!feedbackSent ? (
              <>
                {/* Category selector */}
                <p className="sp-field-label" style={{ marginBottom: 10 }}>{t('settings_feedback.cat_label')}</p>
                <div className="sp-feedback-cats">
                  {getFeedbackCategories(t).map(cat => (
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
                    <MessageSquare size={13} /> {t('settings_feedback.content_label')}
                  </label>
                  <textarea
                    id="sp-feedback-text"
                    className="settings-bio"
                    rows={5}
                    placeholder={t('settings_feedback.content_placeholder')}
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
                  <Send size={16} /> {t('settings_feedback.btn_send')}
                </button>

                <div className="sp-info-banner" style={{ marginTop: 14 }}>
                  <Mail size={14} />
                  {t('settings_feedback.info_email')}
                </div>
              </>
            ) : (
              <div className="sp-feedback-success">
                <CheckCircle2 size={48} color="#34d399" />
                <h3>{t('settings_feedback.success_title')}</h3>
                <p>{t('settings_feedback.success_desc')}</p>
                <button type="button" className="sp-save-btn" onClick={() => setFeedbackSent(false)}>
                  {t('settings_feedback.btn_send_another')}
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
                <h3>{t('settings_guide.title')}</h3>
                <p>{t('settings_guide.desc')}</p>
              </div>
            </div>

            {getUsageItems(t).map((item, i) => {
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
              {t('settings_guide.info_contact')}
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
        <ArrowLeft size={18} /> {t('settings_panel.account')}
      </button>

      <div className="settings-list">
        {/* Section: Tài khoản */}
        <p className="sp-section-title">{t('settings_panel.account')}</p>
        <div className="sp-card-group">
          <button type="button" className="settings-row clickable" onClick={() => setView('personal')}>
            <span className="settings-row-icon"><User size={20} /></span>
            <span className="settings-row-label">
              {t('settings_panel.personal_info')}
              <span className="sp-row-sub">{t('settings_panel.personal_info_sub')}</span>
            </span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>
        </div>

        {/* Section: Tuỳ chọn */}
        <p className="sp-section-title">{t('settings_panel.options')}</p>
        <div className="sp-card-group">
          <div className="settings-row">
            <span className="settings-row-icon" style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}><Bell size={20} /></span>
            <span className="settings-row-label">
              {t('settings_panel.push_notifications')}
              <span className="sp-row-sub">{notificationsOn ? t('settings_panel.on') : t('settings_panel.off')}</span>
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
              {t('settings_panel.language')}
              <span className="sp-row-sub">{language === 'vi' ? '🇻🇳 Tiếng Việt' : language === 'ko' ? '🇰🇷 한국어' : '🇬🇧 English'}</span>
            </span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>

          <button type="button" className="settings-row clickable" onClick={() => setView('bible')}>
            <span className="settings-row-icon" style={{ background: 'rgba(72,188,225,0.12)', color: '#48bce1' }}><Book size={20} /></span>
            <span className="settings-row-label">
              Đọc Kinh Thánh
              <span className="sp-row-sub">Giao diện, cỡ chữ, phông chữ</span>
            </span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>
        </div>

        {/* Section: Hội thánh */}
        <p className="sp-section-title">{t('settings_panel.church')}</p>
        <div className="sp-card-group">
          <button type="button" className="settings-row clickable" onClick={() => setView('payment')}>
            <span className="settings-row-icon" style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}><CreditCard size={20} /></span>
            <span className="settings-row-label">
              {t('settings_panel.donate')}
              <span className="sp-row-sub">{t('settings_panel.donate_sub')}</span>
            </span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>
          
          <button type="button" className="settings-row clickable" onClick={() => setView('about')}>
            <span className="settings-row-icon" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}><Info size={20} /></span>
            <span className="settings-row-label">
              {t('settings_panel.about')}
              <span className="sp-row-sub">{t('settings_panel.about_sub')}</span>
            </span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>
        </div>

        {/* Section: Hỗ trợ */}
        <p className="sp-section-title">{t('settings_panel.support')}</p>
        <div className="sp-card-group">
          <button type="button" className="settings-row clickable" onClick={() => setView('usage')}>
            <span className="settings-row-icon" style={{ background: 'rgba(72,188,225,0.12)', color: '#48bce1' }}><BookOpen size={20} /></span>
            <span className="settings-row-label">
              {t('settings_panel.guide')}
              <span className="sp-row-sub">{t('settings_panel.guide_sub')}</span>
            </span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>

          <button type="button" className="settings-row clickable" onClick={() => setView('feedback')}>
            <span className="settings-row-icon" style={{ background: 'rgba(244,114,182,0.12)', color: '#f472b6' }}><MessageSquare size={20} /></span>
            <span className="settings-row-label">
              {t('settings_panel.feedback')}
              <span className="sp-row-sub">{t('settings_panel.feedback_sub')}</span>
            </span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>

          <button type="button" className="settings-row clickable" onClick={() => setView('privacy')}>
            <span className="settings-row-icon" style={{ background: 'rgba(148,163,184,0.12)', color: '#94a3b8' }}><Shield size={20} /></span>
            <span className="settings-row-label">
              {t('settings_panel.privacy')}
              <span className="sp-row-sub">{t('settings_panel.privacy_sub')}</span>
            </span>
            <ChevronRight size={16} className="settings-row-chevron" />
          </button>
        </div>

        {/* App version */}
        <div className="sp-app-version">
          <span>REACH Church App</span>
          <span className="sp-version-tag">v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
