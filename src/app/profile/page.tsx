'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Heart, BookOpen, Settings, ChevronRight, LogOut,
  CheckCircle, Clock, Plus, X, FileText, Camera, Users, Calendar,
  Flame, Star, Edit2, Check, QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import {
  buildPrayerInsert,
  isPrayerAnswered,
  prayerBody,
} from '@/lib/prayer-helpers';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { getReadingStreak, getTotalReadingDays } from '@/lib/reading-tracker';
import { getSermonNotesByUser, type SermonNote } from '@/lib/livestreams';
import { fetchUserVolunteering } from '@/lib/events';
import SettingsPanel from '@/components/profile/SettingsPanel';
import AddToCalendar from '@/components/ui/AddToCalendar';
import type { Prayer } from '@/types';
import '../login/auth.css';
import './page.css';

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Skeleton Loading Components                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

function ProfileSkeleton() {
  return (
    <div className="profile-skeleton">
      {/* Cover */}
      <div className="skel-cover" />

      {/* Avatar + name */}
      <div className="skel-hero">
        <div className="skel-avatar" />
        <div className="skel-name" />
        <div className="skel-role" />
        <div className="skel-stats-row">
          <div className="skel-stat" />
          <div className="skel-stat-div" />
          <div className="skel-stat" />
          <div className="skel-stat-div" />
          <div className="skel-stat" />
        </div>
      </div>

      {/* Tabs */}
      <div className="skel-tabs">
        <div className="skel-tab" />
        <div className="skel-tab" />
        <div className="skel-tab" />
      </div>

      {/* Cards */}
      <div className="skel-content">
        <div className="skel-card tall" />
        <div className="skel-card medium" />
        <div className="skel-line w80" />
        <div className="skel-line w60" />
        <div className="skel-line w70" />
        <div className="skel-line w50" />
        <div className="skel-card medium" />
        <div className="skel-line w90" />
        <div className="skel-line w65" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Component                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'info' | 'prayer' | 'notes'>('info');
  const [showSettings, setShowSettings] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddPrayer, setShowAddPrayer] = useState(false);
  const [newPrayer, setNewPrayer] = useState('');

  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [sermonNotes, setSermonNotes] = useState<(SermonNote & { livestreams: { title: string } })[]>([]);
  const [volunteering, setVolunteering] = useState<any[]>([]);  

  const [dataLoading, setDataLoading] = useState(true);
  const [profileInfo, setProfileInfo] = useState({
    full_name: '', username: '', role: t('page_profile.role_member'), avatar_url: '', bio: '', cover_url: ''
  });

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' }>({ msg: '', type: 'success' });
  const [readingDays, setReadingDays] = useState(0);
  const [readingStreak, setReadingStreak] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [animatedDays, setAnimatedDays] = useState(0);
  const [animatedPrayers, setAnimatedPrayers] = useState(0);
  const [animatedNotes, setAnimatedNotes] = useState(0);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const days = getTotalReadingDays();
    const streak = getReadingStreak();
    setReadingDays(days);
    setReadingStreak(streak);
    // Animate stats from 0 on mount
    const duration = 800;
    const steps = 30;
    const stepTime = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedDays(Math.round(days * progress));
      if (step >= steps) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileInfo({
        full_name: profile.full_name || '',
        username: profile.username || '',
        role: profile.role || t('page_profile.role_member'),
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        cover_url: profile.cover_url || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        Promise.all([
          fetchPrayers(user.id),
          fetchSermonNotes(user.id),
          fetchMyVolunteering(user.id),
        ]).finally(() => setDataLoading(false));
      } else {
        setDataLoading(false);
      }
    }
  }, [user, authLoading]);

  const fetchMyVolunteering = async (userId: string) => {
    const data = await fetchUserVolunteering(userId);
    setVolunteering(data);
  };

  const fetchPrayers = async (userId: string) => {
    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setPrayers((data as Prayer[]) || []);
  };

  const fetchSermonNotes = async (userId: string) => {
    try {
      const notes = await getSermonNotesByUser(userId);
      setSermonNotes(notes);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPrayer = async () => {
    if (!newPrayer.trim() || !user) return;
    try {
      const text = newPrayer.trim();
      const { data, error } = await supabase
        .from('prayers')
        .insert([buildPrayerInsert({ title: text, content: text, category: 'other', userId: user.id, isPrivate: true })])
        .select();
      if (error) throw error;
      if (data) {
        setPrayers([data[0] as Prayer, ...prayers]);
        setNewPrayer('');
        setShowAddPrayer(false);
        showToast(t('page_profile.toast_add_prayer_success'));
      }
    } catch {
      showToast(t('page_profile.toast_add_prayer_fail'), 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast(t('page_profile.toast_file_too_large'), 'error'); return; }
    showToast(t('page_profile.toast_uploading'));
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      if (type === 'avatar') {
        setProfileInfo(p => ({ ...p, avatar_url: base64Data }));
        if (user) await supabase.from('profiles').update({ avatar_url: base64Data }).eq('id', user.id);
      } else {
        setProfileInfo(p => ({ ...p, cover_url: base64Data }));
      }
      showToast(t('page_profile.toast_upload_success'));
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  /* ── Loading state: show full skeleton ── */
  if (authLoading || dataLoading) {
    return <ProfileSkeleton />;
  }

  /* ── Not logged in ── */
  if (!user) {
    return (
      <div className="profile-container auth-prompt">
        <div className="auth-prompt-card">
          <div className="auth-prompt-avatar"><User size={32} /></div>
          <h2>{t('page_profile.login_required')}</h2>
          <p>{t('page_profile.login_desc')}</p>
          <div className="auth-prompt-actions">
            <Link href="/login" className="auth-btn-primary">{t('page_profile.login_btn')}</Link>
            <Link href="/register" className="auth-btn-outline">{t('page_profile.register_btn')}</Link>
          </div>
          <p className="auth-prompt-guest">{t('page_profile.guest_prompt')} <Link href="/">{t('page_profile.back_home')}</Link></p>
        </div>
      </div>
    );
  }

  const answeredCount = prayers.filter(p => isPrayerAnswered(p.status)).length;

  /* ── Level system ── */
  const getLevel = (days: number) => {
    if (days >= 100) return { label: t('page_profile.level_pillar'), color: '#a78bfa', ring: 'ring-pillar' };
    if (days >= 30)  return { label: t('page_profile.level_faithful'), color: '#48bce1', ring: 'ring-faithful' };
    if (days >= 7)   return { label: t('page_profile.level_believer'), color: '#34d399', ring: 'ring-believer' };
    return             { label: t('page_profile.level_new'), color: '#94a3b8', ring: 'ring-new' };
  };
  const level = getLevel(readingDays);

  const handleSaveName = async () => {
    if (!nameInput.trim() || !user) return;
    await supabase.from('profiles').update({ full_name: nameInput.trim() }).eq('id', user.id);
    setProfileInfo(p => ({ ...p, full_name: nameInput.trim() }));
    setEditingName(false);
    showToast(t('page_profile.toast_update_name_success'));
  };

  /* ── Main render ── */
  return (
    <div className="profile-container">

      {/* ── Toast ── */}
      {toast.msg && (
        <div className={`profile-toast ${toast.type === 'error' ? 'profile-toast--error' : ''}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Hero ── */}
      <div className="profile-hero">
        <div
          className="profile-cover"
          style={profileInfo.cover_url ? { backgroundImage: `url(${profileInfo.cover_url})` } : {}}
        >
          <button className="profile-settings-btn" onClick={() => setShowSettings(true)} title="Cài đặt">
            <Settings size={20} />
          </button>
          <button className="profile-qr-btn" onClick={() => setShowQrModal(true)} title="Mã QR Điểm Danh" style={{ position: 'absolute', top: '16px', right: '60px', zIndex: 3, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            <QrCode size={18} />
          </button>
          <button className="profile-cover-upload-btn" onClick={() => coverInputRef.current?.click()}>
            <Camera size={15} /> {t('page_profile.upload_cover')}
          </button>
          <input type="file" accept="image/*" hidden ref={coverInputRef} onChange={e => handleImageUpload(e, 'cover')} />
        </div>

        <div className="profile-hero-content">
          <div className="avatar-wrapper">
            <div className={`avatar ${level.ring}`}>
              {profileInfo.avatar_url
                ? <img src={profileInfo.avatar_url} alt="Avatar" className="avatar-img" />
                : <div className="avatar-placeholder"><User size={40} color="currentColor" /></div>
              }
            </div>
            <button className="avatar-upload-btn" onClick={() => avatarInputRef.current?.click()}>
              <Camera size={14} />
            </button>
            <input type="file" accept="image/*" hidden ref={avatarInputRef} onChange={e => handleImageUpload(e, 'avatar')} />
          </div>

          {/* Level badge */}
          <div className="profile-level-badge" style={{ color: level.color, borderColor: `${level.color}30`, background: `${level.color}12` }}>
            <Star size={11} />
            {level.label}
          </div>

          {/* Inline name edit */}
          {editingName ? (
            <div className="profile-name-edit-row">
              <input
                className="profile-name-input-inline"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                autoFocus
                maxLength={40}
              />
              <button className="profile-name-confirm" onClick={handleSaveName}><Check size={16} /></button>
              <button className="profile-name-cancel" onClick={() => setEditingName(false)}><X size={14} /></button>
            </div>
          ) : (
            <div className="profile-name-row">
              <h1 className="profile-name">{profileInfo.full_name || t('page_profile.default_name')}</h1>
              <button className="profile-name-edit-btn" onClick={() => { setNameInput(profileInfo.full_name); setEditingName(true); }} title="Sửa tên">
                <Edit2 size={13} />
              </button>
            </div>
          )}
          <p className="profile-role">{profileInfo.role}</p>
          {profileInfo.bio && <p className="profile-bio">{profileInfo.bio}</p>}

          {/* Streak badge */}
          {readingStreak > 0 && (
            <div className="profile-streak-badge">
              <Flame size={14} />
              {t('page_profile.streak_days').replace('{{days}}', String(readingStreak))}
            </div>
          )}

          {/* Stats — animated */}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-num stat-animated">{animatedDays}</span>
              <span className="stat-label">{t('page_profile.stat_days')}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num stat-animated">{prayers.length}</span>
              <span className="stat-label">{t('page_profile.stat_prayers')}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num stat-animated">{sermonNotes.length}</span>
              <span className="stat-label">{t('page_profile.stat_notes')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        {(['info', 'notes', 'prayer'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'info' ? t('page_profile.tab_info') : tab === 'notes' ? t('page_profile.tab_notes') : t('page_profile.tab_prayer')}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="tab-content">

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="info-tab">
            {/* Reading streak card */}
            <div className="info-card info-card--streak">
              <div className="info-card-icon-wrap" style={{ background: 'rgba(251,146,60,0.12)' }}>
                <BookOpen size={18} color="#fb923c" />
              </div>
              <div>
                <h3>{t('page_profile.streak_title')}</h3>
                <p dangerouslySetInnerHTML={{ __html: t('page_profile.streak_desc').replace('{{days}}', String(readingStreak)) }}></p>
              </div>
            </div>

            {/* Cell group */}
            <Link href="/groups" className="info-card info-card--link">
              <div className="info-card-icon-wrap" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <Users size={18} color="#f59e0b" />
              </div>
              <div style={{ flex: 1 }}>
                <h3>{t('page_profile.group_title')}</h3>
                <p>{t('page_profile.group_desc')}</p>
              </div>
              <ChevronRight size={18} color="#64748b" />
            </Link>

            {/* Volunteering */}
            {volunteering.length === 0 ? (
              <div className="info-card empty-state-card">
                <Calendar size={28} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                <h3>{t('page_profile.volunteering_empty_title')}</h3>
                <p>{t('page_profile.volunteering_empty_desc')}</p>
              </div>
            ) : (
              <div className="info-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={16} color="#a78bfa" /> {t('page_profile.volunteering_title')}
                  </h3>
                  <Link href="/events" className="profile-link-sm">{t('page_profile.view_all')}</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {volunteering.map(v => (
                    <div key={v.id} className="volunteer-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 className="volunteer-title">{v.events?.title}</h4>
                        <span className={`vol-badge vol-badge--${v.status}`}>
                          {v.status === 'approved' ? t('page_profile.status_approved') : v.status === 'pending' ? t('page_profile.status_pending') : t('page_profile.status_rejected')}
                        </span>
                      </div>
                      <div className="volunteer-meta">
                        <Calendar size={13} color="#48bce1" />
                        {new Date(v.events?.event_date).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <div className="volunteer-meta">
                        <Users size={13} color="#8b5cf6" />
                        {t('page_profile.role_label')} <strong>{v.role}</strong>
                      </div>
                      {v.events && (
                        <div style={{ marginTop: '10px' }}>
                          <AddToCalendar 
                            event={{
                              title: v.events.title,
                              description: `Vai trò phục vụ: ${v.role}`,
                              startDate: v.events.event_date,
                              location: v.events.location || 'Reach Church'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="notes-tab">
            {sermonNotes.length === 0 ? (
              <div className="empty-state-card">
                <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>{t('page_profile.notes_empty_title')}</p>
                <p style={{ fontSize: '0.85rem' }}>{t('page_profile.notes_empty_desc')}</p>
              </div>
            ) : (
              <div className="notes-list">
                {sermonNotes.map(note => (
                  <Link href="/live" key={note.id} className="note-item">
                    <div className="note-title">
                      {note.livestreams?.title || 'Buổi nhóm'}
                      <span className="note-date">{new Date(note.updated_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="note-preview">{note.content}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRAYER TAB */}
        {activeTab === 'prayer' && (
          <div className="prayer-tab">
            <div className="prayer-tab-header">
              <h2 style={{ fontSize: '1.05rem', margin: 0 }}>
                {t('page_profile.prayer_title')}
                {answeredCount > 0 && (
                  <span className="prayer-answered-badge">{t('page_profile.prayer_answered').replace('{{count}}', String(answeredCount))}</span>
                )}
              </h2>
              <button className="btn-add-prayer" onClick={() => setShowAddPrayer(true)}>
                <Plus size={15} /> {t('page_profile.prayer_add_new')}
              </button>
            </div>

            {showAddPrayer && (
              <div className="add-prayer-card">
                <div className="add-prayer-header">
                  <span>{t('page_profile.prayer_new_title')}</span>
                  <button onClick={() => setShowAddPrayer(false)}><X size={18} /></button>
                </div>
                <textarea
                  className="prayer-input"
                  placeholder={t('page_profile.prayer_placeholder')}
                  value={newPrayer}
                  onChange={e => setNewPrayer(e.target.value)}
                />
                <button className="btn-primary" onClick={handleAddPrayer}>{t('page_profile.prayer_save')}</button>
              </div>
            )}

            {prayers.length === 0 ? (
              <div className="empty-state-card">
                <Heart size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>{t('page_profile.prayer_empty_title')}</p>
                <p style={{ fontSize: '0.85rem' }}>{t('page_profile.prayer_empty_desc')}</p>
              </div>
            ) : (
              <div className="my-prayers-list">
                {prayers.map(p => (
                  <div key={p.id} className="prayer-item">
                    <div className="prayer-item-icon">
                      {isPrayerAnswered(p.status)
                        ? <CheckCircle size={20} className="icon-answered" />
                        : <Clock size={20} className="icon-ongoing" />}
                    </div>
                    <div className="prayer-item-content">
                      <p className="prayer-item-title">{prayerBody(p)}</p>
                      {p.notes && <p className="prayer-item-notes">✨ {p.notes}</p>}
                      <p className="prayer-item-date">{new Date(p.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <span className={`prayer-badge ${p.status}`}>
                      {isPrayerAnswered(p.status) ? t('page_profile.status_answered') : t('page_profile.status_ongoing')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Logout ── */}
      <div style={{ padding: '4px 20px 40px', display: 'flex', justifyContent: 'center' }}>
        <button onClick={handleLogout} className="profile-logout-btn">
          <LogOut size={17} /> {t('page_profile.logout')}
        </button>
      </div>

      {/* ── Settings modal ── */}
      {showSettings && (
        <div className="settings-modal-overlay">
          <SettingsPanel
            email={user?.email || ''}
            bio={profileInfo.bio}
            fullName={profileInfo.full_name}
            avatarUrl={profileInfo.avatar_url}
            onBioChange={bio => setProfileInfo(p => ({ ...p, bio }))}
            onFullNameChange={full_name => setProfileInfo(p => ({ ...p, full_name }))}
            onAvatarChange={avatar_url => setProfileInfo(p => ({ ...p, avatar_url }))}
            onDeleteAvatar={async () => {}}
            onSaveAccount={async () => {}}
            isSaving={false}
            onBack={() => setShowSettings(false)}
            onOpenDonation={() => {}}
          />
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="profile-modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="profile-modal-content" style={{ textAlign: 'center', maxWidth: '320px', padding: '30px', margin: 'auto', background: '#1a2233', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: '8px', color: '#fff', cursor: 'pointer' }} onClick={() => setShowQrModal(false)}><X size={20} /></button>
            <h2 style={{ marginBottom: '20px', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{t('page_profile.qr_title')}</h2>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', display: 'inline-block' }}>
              <QRCodeSVG value={user?.id || ''} size={200} />
            </div>
            <p style={{ marginTop: '20px', color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {t('page_profile.qr_desc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
