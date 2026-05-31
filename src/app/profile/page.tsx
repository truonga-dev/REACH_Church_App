'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Heart, Bell, BookOpen, Settings, ChevronRight, LogOut,
  Edit3, CheckCircle, Clock, Plus, X, Gift, Copy, Trash2, ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/profile-service';
import { getReadingStreak, getTotalReadingDays } from '@/lib/reading-tracker';
import SettingsPanel from '@/components/profile/SettingsPanel';
import WeeklyBibleSchedule from '@/components/profile/WeeklyBibleSchedule';
import type { Prayer } from '@/types';
import '../login/auth.css';
import './page.css';

export default function ProfilePage() {
  const { user, profile, loading: authLoading, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'prayer' | 'donation'>('info');
  const [infoView, setInfoView] = useState<'main' | 'settings' | 'weekly-bible' | 'notifications'>('main');
  const [showAddPrayer, setShowAddPrayer] = useState(false);
  const [newPrayer, setNewPrayer] = useState('');
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileInfo, setProfileInfo] = useState({
    full_name: '', username: '', role: 'Hội viên', avatar_url: '', bio: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [toast, setToast] = useState('');
  const [readingDays, setReadingDays] = useState(0);
  const [readingStreak, setReadingStreak] = useState(0);
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    setReadingDays(getTotalReadingDays());
    setReadingStreak(getReadingStreak());
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileInfo({
        full_name: profile.full_name || '',
        username: profile.username || '',
        role: profile.role || 'Hội viên',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchPrayers(user.id);
        fetchNotifications();
      } else {
        setLoading(false);
      }
    }
  }, [user, authLoading]);

  const fetchPrayers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrayers((data as Prayer[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('news')
      .select('id, title, type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setRecentNews(data);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileInfo((prev) => ({ ...prev, avatar_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setIsSaving(true);
    const ok = await updateProfile(user.id, {
      full_name: profileInfo.full_name,
      avatar_url: profileInfo.avatar_url,
      bio: profileInfo.bio,
    });
    setIsSaving(false);
    if (ok) {
      await refreshProfile();
      setIsEditingProfile(false);
      showToast('Lưu hồ sơ thành công!');
    } else {
      showToast('Không lưu được hồ sơ.');
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setProfileInfo({
        full_name: profile.full_name || '',
        username: profile.username || '',
        role: profile.role || 'Hội viên',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
      });
    }
    setIsEditingProfile(false);
  };

  const handleDeleteAvatar = async () => {
    if (!user || !profileInfo.avatar_url) return;
    if (!window.confirm('Xóa ảnh đại diện của bạn?')) return;

    setProfileInfo((prev) => ({ ...prev, avatar_url: '' }));
    setIsSaving(true);
    const ok = await updateProfile(user.id, {
      full_name: profileInfo.full_name,
      avatar_url: '',
      bio: profileInfo.bio,
    });
    setIsSaving(false);
    if (ok) {
      await refreshProfile();
      showToast('Đã xóa ảnh đại diện.');
    } else {
      showToast('Không xóa được ảnh.');
    }
  };

  const handleAddPrayer = async () => {
    if (!newPrayer.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('prayers')
        .insert([{
          title: newPrayer.trim(),
          description: newPrayer.trim(),
          status: 'ongoing',
          user_id: user.id,
          author_name: profileInfo.full_name || 'Thành viên',
          is_private: true,
          pray_count: 0,
        }])
        .select();

      if (error) throw error;
      if (data) {
        setPrayers([data[0], ...prayers]);
        setNewPrayer('');
        setShowAddPrayer(false);
        showToast('Đã thêm đề mục cầu nguyện!');
      }
    } catch (error) {
      console.error(error);
      showToast('Không thêm được đề mục.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const copyStk = () => {
    navigator.clipboard.writeText('1012345678');
    showToast('Đã sao chép số tài khoản!');
  };

  const answeredCount = prayers.filter((p) => p.status === 'answered' || p.status === 'completed').length;

  if (authLoading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="profile-loading-spinner" />
          <p>Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container auth-prompt">
        <div className="auth-prompt-card">
          <div className="auth-prompt-avatar">
            <User size={32} />
          </div>
          <h2>Đăng nhập để xem hồ sơ</h2>
          <p>Tạo tài khoản để lưu đề mục cầu nguyện, theo dõi tiến độ đọc Kinh Thánh và cá nhân hóa trải nghiệm.</p>

          <div className="auth-prompt-features">
            <div className="auth-prompt-feature">
              <span className="auth-prompt-feature-icon"><Heart size={14} /></span>
              Lưu đề mục cầu nguyện riêng
            </div>
            <div className="auth-prompt-feature">
              <span className="auth-prompt-feature-icon"><BookOpen size={14} /></span>
              Theo dõi tiến độ đọc Kinh Thánh
            </div>
            <div className="auth-prompt-feature">
              <span className="auth-prompt-feature-icon"><Bell size={14} /></span>
              Nhận thông báo từ hội thánh
            </div>
          </div>

          <div className="auth-prompt-actions">
            <Link href="/login" className="auth-btn-primary">Đăng nhập</Link>
            <Link href="/register" className="auth-btn-outline">Đăng ký</Link>
          </div>

          <p className="auth-prompt-guest">
            Tiếp tục khám phá? <Link href="/">Về trang chủ</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {toast && <div className="profile-toast">{toast}</div>}

      <div className="profile-hero">
        <div className="avatar-wrapper">
          <div className="avatar">
            {profileInfo.avatar_url ? (
              <img src={profileInfo.avatar_url} alt="Ảnh đại diện" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <User size={40} color="white" />
              </div>
            )}
          </div>
          {isEditingProfile && (
            <>
              <button
                className="avatar-edit-btn"
                type="button"
                aria-label="Đổi ảnh đại diện"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Edit3 size={14} />
              </button>
              {profileInfo.avatar_url && (
                <button
                  className="avatar-delete-btn"
                  type="button"
                  aria-label="Xóa ảnh đại diện"
                  onClick={handleDeleteAvatar}
                  disabled={isSaving}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
          <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </div>

        {isEditingProfile ? (
          <div className="profile-edit-block">
            <label className="profile-edit-label" htmlFor="profile-name">Họ và tên</label>
            <input
              id="profile-name"
              className="profile-name-input"
              value={profileInfo.full_name}
              onChange={(e) => setProfileInfo((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder="Nhập tên của bạn"
            />
            <div className="profile-edit-actions">
              <button className="btn-primary" type="button" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
              <button className="btn-secondary" type="button" onClick={handleCancelEdit} disabled={isSaving}>
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-name-block">
            <h1 className="profile-name">{profileInfo.full_name || 'Thành viên REACH'}</h1>
            <div className="profile-hero-actions">
              <button
                className="profile-action-btn edit"
                type="button"
                onClick={() => setIsEditingProfile(true)}
              >
                <Edit3 size={14} /> Sửa
              </button>
              {profileInfo.avatar_url && (
                <button
                  className="profile-action-btn delete"
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={isSaving}
                >
                  <Trash2 size={14} /> Xóa ảnh
                </button>
              )}
            </div>
          </div>
        )}

        <p className="profile-role">{profileInfo.role} • {user.email}</p>
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-num">{readingDays}</span>
            <span className="stat-label">Ngày đọc KT</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">{prayers.length}</span>
            <span className="stat-label">Đề mục CN</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">{answeredCount}</span>
            <span className="stat-label">Đáp lời CN</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => { setActiveTab('info'); setInfoView('main'); }}>Hồ sơ</button>
        <button className={`tab-btn ${activeTab === 'prayer' ? 'active' : ''}`} onClick={() => setActiveTab('prayer')}>
          <Heart size={14} style={{ marginRight: 4, display: 'inline' }} />Cầu nguyện
        </button>
        <button className={`tab-btn ${activeTab === 'donation' ? 'active' : ''}`} onClick={() => setActiveTab('donation')}>
          <Gift size={14} style={{ marginRight: 4, display: 'inline' }} />Dâng hiến
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="tab-content">
          {infoView === 'settings' && (
            <SettingsPanel
              email={user.email || ''}
              bio={profileInfo.bio}
              onBioChange={(bio) => setProfileInfo((prev) => ({ ...prev, bio }))}
              onSaveAccount={handleSaveProfile}
              isSaving={isSaving}
              onBack={() => setInfoView('main')}
              onOpenDonation={() => {
                setInfoView('main');
                setActiveTab('donation');
              }}
            />
          )}

          {infoView === 'weekly-bible' && (
            <WeeklyBibleSchedule
              onBack={() => setInfoView('main')}
              readingStreak={readingStreak}
              readingDays={readingDays}
            />
          )}

          {infoView === 'notifications' && (
            <div className="settings-screen">
              <button type="button" className="settings-back" onClick={() => setInfoView('main')}>
                <ArrowLeft size={18} /> Thông báo
              </button>
              {recentNews.length > 0 ? (
                <div className="notif-list">
                  {recentNews.map((n) => (
                    <Link key={n.id} href={`/news/${n.id}`} className="notif-item">
                      <Bell size={16} />
                      <div>
                        <p className="notif-title">{n.title}</p>
                        <p className="notif-type">{n.type}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="settings-hint">Chưa có thông báo mới từ hội thánh.</p>
              )}
            </div>
          )}

          {infoView === 'main' && (
            <>
          <div className="menu-list">
            <button className="menu-item" onClick={() => setInfoView('notifications')}>
              <div className="menu-icon-wrap"><Bell size={20} className="menu-icon" /></div>
              <div className="menu-text">
                <span className="menu-label">Thông báo</span>
                <span className="menu-desc">{recentNews.length} tin mới từ hội thánh</span>
              </div>
              <ChevronRight size={18} className="menu-arrow" />
            </button>
            <button type="button" className="menu-item" onClick={() => setInfoView('weekly-bible')}>
              <div className="menu-icon-wrap"><BookOpen size={20} className="menu-icon" /></div>
              <div className="menu-text">
                <span className="menu-label">Lịch đọc Kinh Thánh</span>
                <span className="menu-desc">Chuỗi {readingStreak} ngày • {readingDays} ngày tổng</span>
              </div>
              <ChevronRight size={18} className="menu-arrow" />
            </button>
            <button className="menu-item" onClick={() => setInfoView('settings')}>
              <div className="menu-icon-wrap"><Settings size={20} className="menu-icon" /></div>
              <div className="menu-text">
                <span className="menu-label">Cài đặt</span>
                <span className="menu-desc">Thông báo, ngôn ngữ, tài khoản...</span>
              </div>
              <ChevronRight size={18} className="menu-arrow" />
            </button>
          </div>

          <div className="devotion-streak">
            <BookOpen size={20} className="streak-icon" />
            <div className="streak-text">
              <p className="streak-title">Chuỗi dưỡng linh 🔥</p>
              <p className="streak-desc">Bạn đang đọc Kinh Thánh liên tục <strong>{readingStreak} ngày</strong>!</p>
            </div>
          </div>

          <button className="btn-logout" type="button" onClick={handleLogout}>
            <LogOut size={18} /> Đăng xuất
          </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'prayer' && (
        <div className="tab-content">
          <div className="prayer-tab-header">
            <h2 className="section-title-sm">Đề Mục Cầu Nguyện Của Tôi</h2>
            <button className="btn-add-prayer" onClick={() => setShowAddPrayer(true)}>
              <Plus size={16} /> Thêm mới
            </button>
          </div>

          {showAddPrayer && (
            <div className="add-prayer-card">
              <div className="add-prayer-header">
                <span>Đề mục mới (riêng tư)</span>
                <button onClick={() => setShowAddPrayer(false)} aria-label="Đóng"><X size={18} /></button>
              </div>
              <input
                className="prayer-input"
                placeholder="Bạn muốn cầu nguyện điều gì?"
                value={newPrayer}
                onChange={(e) => setNewPrayer(e.target.value)}
              />
              <button className="btn-primary" type="button" onClick={handleAddPrayer}>Lưu</button>
            </div>
          )}

          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</p>
          ) : prayers.length === 0 ? (
            <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '1rem' }}>
              Chưa có đề mục. Nhấn &quot;Thêm mới&quot; hoặc gửi tại trang <Link href="/prayer">Cầu nguyện</Link>.
            </p>
          ) : (
            <div className="my-prayers-list">
              {prayers.map((p) => (
                <div key={p.id} className="prayer-item">
                  <div className="prayer-item-icon">
                    {p.status === 'answered' || p.status === 'completed'
                      ? <CheckCircle size={20} className="icon-answered" />
                      : <Clock size={20} className="icon-ongoing" />}
                  </div>
                  <div className="prayer-item-content">
                    <p className="prayer-item-title">{p.description || p.title}</p>
                    {p.notes && <p className="prayer-item-notes">✨ {p.notes}</p>}
                    <p className="prayer-item-date">{new Date(p.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <span className={`prayer-badge ${p.status}`}>
                    {p.status === 'answered' || p.status === 'completed' ? 'Đáp lời' : 'Đang cầu'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'donation' && (
        <div className="tab-content">
          <div className="donation-card">
            <div className="donation-icon-wrap"><Gift size={32} /></div>
            <p className="donation-desc">&quot;Mỗi người nên tùy theo lòng mình đã định mà quyên ra...&quot;</p>
            <p className="donation-ref">— 2 Cô-rinh-tô 9:7</p>
            <div className="bank-info-box">
              <h3 className="bank-title">Thông tin chuyển khoản</h3>
              <div className="bank-row">
                <span className="bank-label">Ngân hàng:</span>
                <span className="bank-value">Vietcombank</span>
              </div>
              <div className="bank-row">
                <span className="bank-label">Số tài khoản:</span>
                <span className="bank-value highlight">1012345678</span>
                <button className="copy-btn" type="button" aria-label="Copy STK" onClick={copyStk}><Copy size={16} /></button>
              </div>
              <div className="bank-row">
                <span className="bank-label">Chủ tài khoản:</span>
                <span className="bank-value">HỘI THÁNH REACH VN</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
