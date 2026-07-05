'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Heart, BookOpen, Settings, ChevronRight, LogOut,
  CheckCircle, Clock, Plus, X, FileText, Camera, Users, Calendar,
  Flame, Star, Edit2, Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  buildPrayerInsert,
  isPrayerAnswered,
  prayerBody,
} from '@/lib/prayer-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { getReadingStreak, getTotalReadingDays } from '@/lib/reading-tracker';
import { getSermonNotesByUser, type SermonNote } from '@/lib/livestreams';
import { fetchUserVolunteering } from '@/lib/events';
import SettingsPanel from '@/components/profile/SettingsPanel';
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
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'info' | 'prayer' | 'notes'>('info');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddPrayer, setShowAddPrayer] = useState(false);
  const [newPrayer, setNewPrayer] = useState('');

  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [sermonNotes, setSermonNotes] = useState<(SermonNote & { livestreams: { title: string } })[]>([]);
  const [volunteering, setVolunteering] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any

  const [dataLoading, setDataLoading] = useState(true);
  const [profileInfo, setProfileInfo] = useState({
    full_name: '', username: '', role: 'Hội viên', avatar_url: '', bio: '', cover_url: ''
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
        role: profile.role || 'Hội viên',
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
        showToast('Đã thêm đề mục cầu nguyện!');
      }
    } catch {
      showToast('Không thêm được đề mục.', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Ảnh tối đa 5MB.', 'error'); return; }
    showToast('Đang tải ảnh lên...');
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      if (type === 'avatar') {
        setProfileInfo(p => ({ ...p, avatar_url: base64Data }));
        if (user) await supabase.from('profiles').update({ avatar_url: base64Data }).eq('id', user.id);
      } else {
        setProfileInfo(p => ({ ...p, cover_url: base64Data }));
      }
      showToast('Tải ảnh thành công!');
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
          <h2>Đăng nhập để xem hồ sơ</h2>
          <p>Tạo tài khoản để lưu đề mục cầu nguyện, theo dõi tiến độ đọc Kinh Thánh và cá nhân hóa trải nghiệm.</p>
          <div className="auth-prompt-actions">
            <Link href="/login" className="auth-btn-primary">Đăng nhập</Link>
            <Link href="/register" className="auth-btn-outline">Đăng ký</Link>
          </div>
          <p className="auth-prompt-guest">Tiếp tục khám phá? <Link href="/">Về trang chủ</Link></p>
        </div>
      </div>
    );
  }

  const answeredCount = prayers.filter(p => isPrayerAnswered(p.status)).length;

  /* ── Level system ── */
  const getLevel = (days: number) => {
    if (days >= 100) return { label: 'Cột Trụ', color: '#a78bfa', ring: 'ring-pillar' };
    if (days >= 30)  return { label: 'Trung Kiên', color: '#48bce1', ring: 'ring-faithful' };
    if (days >= 7)   return { label: 'Tín Hữu', color: '#34d399', ring: 'ring-believer' };
    return             { label: 'Thành Viên Mới', color: '#94a3b8', ring: 'ring-new' };
  };
  const level = getLevel(readingDays);

  const handleSaveName = async () => {
    if (!nameInput.trim() || !user) return;
    await supabase.from('profiles').update({ full_name: nameInput.trim() }).eq('id', user.id);
    setProfileInfo(p => ({ ...p, full_name: nameInput.trim() }));
    setEditingName(false);
    showToast('Đã cập nhật tên!');
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
          <button className="profile-cover-upload-btn" onClick={() => coverInputRef.current?.click()}>
            <Camera size={15} /> Thêm ảnh bìa
          </button>
          <input type="file" accept="image/*" hidden ref={coverInputRef} onChange={e => handleImageUpload(e, 'cover')} />
        </div>

        <div className="profile-hero-content">
          <div className="avatar-wrapper">
            <div className={`avatar ${level.ring}`}>
              {profileInfo.avatar_url
                ? <img src={profileInfo.avatar_url} alt="Avatar" className="avatar-img" />
                : <div className="avatar-placeholder"><User size={40} color="white" /></div>
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
              <h1 className="profile-name">{profileInfo.full_name || 'Thành viên REACH'}</h1>
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
              {readingStreak} ngày liên tiếp
            </div>
          )}

          {/* Stats — animated */}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-num stat-animated">{animatedDays}</span>
              <span className="stat-label">Ngày đọc KT</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num stat-animated">{prayers.length}</span>
              <span className="stat-label">Đề mục CN</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-num stat-animated">{sermonNotes.length}</span>
              <span className="stat-label">Bài học</span>
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
            {tab === 'info' ? 'Thông tin' : tab === 'notes' ? 'Ghi chú' : 'Cầu nguyện'}
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
                <h3>Chuỗi dưỡng linh</h3>
                <p>Bạn đang đọc Kinh Thánh liên tục <strong>{readingStreak} ngày</strong> 🔥</p>
              </div>
            </div>

            {/* Cell group */}
            <Link href="/groups" className="info-card info-card--link">
              <div className="info-card-icon-wrap" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <Users size={18} color="#f59e0b" />
              </div>
              <div style={{ flex: 1 }}>
                <h3>Nhóm nhỏ của tôi</h3>
                <p>Khám phá và tham gia nhóm nhỏ để gắn kết hơn.</p>
              </div>
              <ChevronRight size={18} color="#64748b" />
            </Link>

            {/* Volunteering */}
            {volunteering.length === 0 ? (
              <div className="info-card empty-state-card">
                <Calendar size={28} style={{ margin: '0 auto 10px', opacity: 0.35 }} />
                <h3>Lịch phục vụ sắp tới</h3>
                <p>Bạn chưa có lịch phục vụ nào trong thời gian tới.</p>
              </div>
            ) : (
              <div className="info-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Star size={16} color="#a78bfa" /> Lịch phục vụ sắp tới
                  </h3>
                  <Link href="/events" className="profile-link-sm">Xem tất cả</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {volunteering.map(v => (
                    <div key={v.id} className="volunteer-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 className="volunteer-title">{v.events?.title}</h4>
                        <span className={`vol-badge vol-badge--${v.status}`}>
                          {v.status === 'approved' ? 'Đã duyệt' : v.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                        </span>
                      </div>
                      <div className="volunteer-meta">
                        <Calendar size={13} color="#48bce1" />
                        {new Date(v.events?.event_date).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      <div className="volunteer-meta">
                        <Users size={13} color="#8b5cf6" />
                        Vai trò: <strong>{v.role}</strong>
                      </div>
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
                <p>Bạn chưa có ghi chú nào.</p>
                <p style={{ fontSize: '0.85rem' }}>Hãy tham gia xem Livestream và ghi chép những điều Chúa soi sáng.</p>
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
                Đề mục của tôi
                {answeredCount > 0 && (
                  <span className="prayer-answered-badge">✓ {answeredCount} đáp lời</span>
                )}
              </h2>
              <button className="btn-add-prayer" onClick={() => setShowAddPrayer(true)}>
                <Plus size={15} /> Thêm mới
              </button>
            </div>

            {showAddPrayer && (
              <div className="add-prayer-card">
                <div className="add-prayer-header">
                  <span>Đề mục mới (riêng tư)</span>
                  <button onClick={() => setShowAddPrayer(false)}><X size={18} /></button>
                </div>
                <textarea
                  className="prayer-input"
                  placeholder="Bạn muốn cầu nguyện điều gì?"
                  value={newPrayer}
                  onChange={e => setNewPrayer(e.target.value)}
                />
                <button className="btn-primary" onClick={handleAddPrayer}>Lưu đề mục</button>
              </div>
            )}

            {prayers.length === 0 ? (
              <div className="empty-state-card">
                <Heart size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Chưa có đề mục nào.</p>
                <p style={{ fontSize: '0.85rem' }}>Hãy ghi xuống những điều bạn muốn cầu nguyện.</p>
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
                      {isPrayerAnswered(p.status) ? 'Đáp lời' : 'Đang cầu'}
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
          <LogOut size={17} /> Đăng xuất
        </button>
      </div>

      {/* ── Settings modal ── */}
      {showSettings && (
        <div className="settings-modal-overlay">
          <SettingsPanel
            email={user.email || ''}
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
    </div>
  );
}
