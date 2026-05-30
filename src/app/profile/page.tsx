'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Heart, Bell, BookOpen, Settings, ChevronRight, LogOut, Edit3, CheckCircle, Clock, Plus, X, Gift, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './page.css';

const menuItems = [
  { icon: Bell, label: 'Thông báo', desc: 'Lịch nhóm, sự kiện mới', action: 'notify' },
  { icon: BookOpen, label: 'Lịch đọc Kinh Thánh', desc: 'Tiến độ đọc của bạn', action: 'reading' },
  { icon: Settings, label: 'Cài đặt', desc: 'Tài khoản, ngôn ngữ, hiển thị', action: 'settings' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'info' | 'prayer' | 'donation'>('info');
  const [showAddPrayer, setShowAddPrayer] = useState(false);
  const [newPrayer, setNewPrayer] = useState('');
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileInfo, setProfileInfo] = useState({ full_name: '', username: '', role: 'Hội viên', avatar_url: '', bio: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadProfile = async () => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('reach_profile');
      if (saved) {
        setProfileInfo(JSON.parse(saved));
        return;
      }
    }

    try {
      const { data, error } = await supabase.from('profiles').select('*').limit(1).single();
      if (error) {
        console.error('Không thể tải hồ sơ:', error);
        return;
      }
      if (data) {
        setProfileInfo({
          full_name: data.full_name || '',
          username: data.username || '',
          role: data.role || 'Hội viên',
          avatar_url: data.avatar_url || '',
          bio: data.bio || ''
        });
      }
    } catch (error) {
      console.error('Lỗi tải hồ sơ:', error);
    }
  };

  useEffect(() => {
    void loadProfile();
    fetchPrayers();
  }, []);

  const fetchPrayers = async () => {
    try {
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setPrayers(data);
    } catch (error) {
      console.error('Error fetching prayers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileInfo(prev => ({ ...prev, avatar_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('reach_profile', JSON.stringify(profileInfo));
      }

      if (profileInfo.username) {
        const { error } = await supabase.from('profiles').update({
          full_name: profileInfo.full_name,
          avatar_url: profileInfo.avatar_url,
        }).eq('username', profileInfo.username);
        if (error) {
          console.warn('Không thể cập nhật profile lên Supabase:', error.message);
        }
      }

      showToast('Lưu hồ sơ thành công!');
    } catch (error) {
      console.error('Lỗi lưu hồ sơ:', error);
      showToast('Không lưu được hồ sơ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPrayer = async () => {
    if (!newPrayer.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from('prayers')
        .insert([{ title: newPrayer, status: 'ongoing' }])
        .select();
        
      if (error) throw error;
      
      if (data) {
        setPrayers([data[0], ...prayers]);
        setNewPrayer('');
        setShowAddPrayer(false);
      }
    } catch (error) {
      console.error('Error adding prayer:', error);
    }
  };

  return (
    <div className="profile-container">
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#48BCE1', color: '#fff', padding: '12px 24px', borderRadius: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}
      {/* Avatar & Name */}
      <div className="profile-hero">
        <div className="avatar-wrapper">
          <div className="avatar">
            {profileInfo.avatar_url ? (
              <img src={profileInfo.avatar_url} alt="Ảnh đại diện" className="avatar-img" />
            ) : (
              <User size={40} color="white" />
            )}
          </div>
          <button className="avatar-edit-btn" type="button" aria-label="Chỉnh sửa ảnh đại diện" onClick={() => avatarInputRef.current?.click()}>
            <Edit3 size={14} />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        </div>

        <div className="profile-edit-row">
          <input
            className="profile-name-input"
            value={profileInfo.full_name}
            onChange={(e) => setProfileInfo(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Nhập tên của bạn"
          />
          <button className="btn-primary" type="button" onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
          </button>
        </div>

        <p className="profile-role">{profileInfo.role || 'Hội viên'} • Chi hội TP.HCM</p>
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-num">47</span>
            <span className="stat-label">Ngày đọc KT</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">12</span>
            <span className="stat-label">Đề mục CN</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">8</span>
            <span className="stat-label">Đáp lời CN</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Hồ sơ
        </button>
        <button
          className={`tab-btn ${activeTab === 'prayer' ? 'active' : ''}`}
          onClick={() => setActiveTab('prayer')}
        >
          <Heart size={14} style={{ marginRight: 4, display: 'inline' }} />
          Cầu nguyện
        </button>
        <button
          className={`tab-btn ${activeTab === 'donation' ? 'active' : ''}`}
          onClick={() => setActiveTab('donation')}
        >
          <Gift size={14} style={{ marginRight: 4, display: 'inline' }} />
          Dâng hiến
        </button>
      </div>

      {/* Tab: Info */}
      {activeTab === 'info' && (
        <div className="tab-content">
          <div className="menu-list">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} className="menu-item" onClick={() => {
                  if (item.action === 'notify') showToast('🔔 Tính năng thông báo đang phát triển!');
                  if (item.action === 'reading') showToast('📚 Lịch đọc Kinh Thánh sẽ ra mắt sớm!');
                  if (item.action === 'settings') showToast('⚙️ Cài đặt đang phát triển!');
                }}>
                  <div className="menu-icon-wrap">
                    <Icon size={20} className="menu-icon" />
                  </div>
                  <div className="menu-text">
                    <span className="menu-label">{item.label}</span>
                    <span className="menu-desc">{item.desc}</span>
                  </div>
                  <ChevronRight size={18} className="menu-arrow" />
                </button>
              );
            })}
          </div>

          <div className="devotion-streak">
            <BookOpen size={20} className="streak-icon" />
            <div className="streak-text">
              <p className="streak-title">Chuỗi dưỡng linh 🔥</p>
              <p className="streak-desc">Bạn đang đọc liên tục <strong>7 ngày</strong> rồi đó!</p>
            </div>
          </div>

          <button className="btn-logout">
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      )}

      {/* Tab: Prayer */}
      {activeTab === 'prayer' && (
        <div className="tab-content">
          <div className="prayer-tab-header">
            <h2 className="section-title-sm">Đề Mục Cầu Nguyện Của Tôi</h2>
            <button className="btn-add-prayer" onClick={() => setShowAddPrayer(true)}>
              <Plus size={16} />
              Thêm mới
            </button>
          </div>

          {showAddPrayer && (
            <div className="add-prayer-card">
              <div className="add-prayer-header">
                <span>Đề mục mới</span>
                <button onClick={() => setShowAddPrayer(false)} aria-label="Đóng"><X size={18} /></button>
              </div>
              <input
                className="prayer-input"
                placeholder="Bạn muốn cầu nguyện điều gì?"
                value={newPrayer}
                onChange={(e) => setNewPrayer(e.target.value)}
              />
              <button className="btn-primary" onClick={handleAddPrayer}>Lưu</button>
            </div>
          )}

          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</p>
          ) : (
            <div className="my-prayers-list">
              {prayers.map((p) => (
                <div key={p.id} className="prayer-item">
                  <div className="prayer-item-icon">
                    {p.status === 'answered'
                      ? <CheckCircle size={20} className="icon-answered" />
                      : <Clock size={20} className="icon-ongoing" />}
                  </div>
                  <div className="prayer-item-content">
                    <p className="prayer-item-title">{p.title}</p>
                    {p.notes && <p className="prayer-item-notes">✨ {p.notes}</p>}
                    <p className="prayer-item-date">{new Date(p.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <span className={`prayer-badge ${p.status}`}>
                    {p.status === 'answered' ? 'Đáp lời' : 'Đang cầu'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="prayer-tip">
            <p>💡 <strong>Mẹo:</strong> Hãy ghi lại khi Chúa đáp lời cầu nguyện của bạn để xây dựng đức tin!</p>
          </div>
        </div>
      )}

      {/* Tab: Donation */}
      {activeTab === 'donation' && (
        <div className="tab-content">
          <div className="prayer-tab-header">
            <h2 className="section-title-sm">Dâng Hiến Trực Tuyến</h2>
          </div>
          
          <div className="donation-card">
            <div className="donation-icon-wrap">
              <Gift size={32} />
            </div>
            <p className="donation-desc">"Mỗi người nên tùy theo lòng mình đã định mà quyên ra, không phải phàn nàn hay vì ép uổng; vì Ðức Chúa Trời yêu kẻ thí của cách vui lòng."</p>
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
                <button className="copy-btn" aria-label="Copy STK"><Copy size={16} /></button>
              </div>
              <div className="bank-row">
                <span className="bank-label">Chủ tài khoản:</span>
                <span className="bank-value">HỘI THÁNH REACH VN</span>
              </div>
              <div className="bank-row">
                <span className="bank-label">Nội dung:</span>
                <span className="bank-value">Hovaten Danghien</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
