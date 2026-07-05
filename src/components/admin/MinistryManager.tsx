'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2, Search, MapPin, Users, Target, Activity, Image as ImageIcon } from 'lucide-react';
import { fetchMinistries, createMinistry, updateMinistry, deleteMinistry } from '@/lib/ministries';
import { supabase } from '@/lib/supabase';
import type { Ministry, MinistryCreateInput } from '@/lib/ministries';
import Pagination from '@/components/ui/Pagination';

interface EditingState {
  id: string | null;
  data: MinistryCreateInput;
}

const emptyData = (): MinistryCreateInput => ({
  category: '',
  name: '',
  icon: 'Users', // Default icon
  desc: '',
  leader: '',
  schedule: '',
  location: '',
  mission: '',
  goal: '',
  activities: [],
  details: '',
  image_url: '',
});

export default function MinistryManager() {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ id: null, data: emptyData() });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [toast, setToast] = useState('');

  // Handle activities array
  const [activityInput, setActivityInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadMinistries();
  }, [currentPage]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const loadMinistries = async () => {
    setLoading(true);
    try {
      const { data, count } = await fetchMinistries(ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE);
      setMinistries(data);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    } catch {
      showToast('Lỗi khi tải dữ liệu mục vụ');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.data.name.trim() || !editing.data.category.trim()) {
      showToast('Tên và Danh mục là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updateMinistry(editing.id, editing.data);
        if (updated) {
          setMinistries(ministries.map((d) => (d.id === editing.id ? updated : d)));
          showToast('Đã cập nhật mục vụ');
        }
      } else {
        const created = await createMinistry(editing.data);
        if (created) {
          setMinistries([...ministries, created]);
          showToast('Đã tạo mục vụ mới');
        }
      }
      handleCancel();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      showToast('Lỗi khi lưu mục vụ: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (min: Ministry) => {
    setEditing({
      id: min.id,
      data: {
        category: min.category,
        name: min.name,
        icon: min.icon || 'Users',
        desc: min.desc || '',
        leader: min.leader || '',
        schedule: min.schedule || '',
        location: min.location || '',
        mission: min.mission || '',
        goal: min.goal || '',
        activities: min.activities || [],
        details: min.details || '',
        image_url: min.image_url || '',
      },
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa mục vụ này?')) {
      try {
        const success = await deleteMinistry(id);
        if (success) {
          setMinistries(ministries.filter((d) => d.id !== id));
          showToast('Đã xóa mục vụ');
        } else {
          showToast('Lỗi khi xóa mục vụ');
        }
      } catch {
        showToast('Lỗi khi xóa mục vụ');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing({ id: null, data: emptyData() });
    setActivityInput('');
  };

  const handleAddActivity = () => {
    if (activityInput.trim()) {
      setEditing({
        ...editing,
        data: {
          ...editing.data,
          activities: [...(editing.data.activities || []), activityInput.trim()]
        }
      });
      setActivityInput('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    const newActivities = [...(editing.data.activities || [])];
    newActivities.splice(index, 1);
    setEditing({
      ...editing,
      data: {
        ...editing.data,
        activities: newActivities
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        showToast('Kích thước file ảnh không được vượt quá 5MB');
        return;
      }

      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `ministries/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setEditing({
        ...editing,
        data: { ...editing.data, image_url: urlData.publicUrl }
      });
      showToast('Tải ảnh lên thành công');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(error);
      showToast('Lỗi khi tải ảnh: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredMinistries = ministries.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.leader || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-content-card" style={{ padding: '2rem' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#48BCE1', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 600 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
            Quản lý Mục vụ (Ban Ngành)
          </h2>
          <p style={{ color: '#7a8599', fontSize: '0.9rem' }}>
            Thêm, sửa, xóa thông tin giới thiệu của các Ban Ngành trong Hội Thánh
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#48BCE1', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            <Plus size={18} /> Thêm Mục vụ
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
              {editing.id ? 'Sửa mục vụ' : 'Thêm mục vụ mới'}
            </h3>
            <button type="button" onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#7a8599', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Tên Mục vụ *</label>
                <input
                  required
                  type="text"
                  value={editing.data.name}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, name: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                  placeholder="VD: Mục vụ Nam giới"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Danh mục / Đối tượng *</label>
                <input
                  required
                  type="text"
                  value={editing.data.category}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, category: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                  placeholder="VD: Nam giới"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Người hướng dẫn</label>
                <input
                  type="text"
                  value={editing.data.leader || ''}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, leader: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                  placeholder="VD: MS. Nguyễn Văn A"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Lịch sinh hoạt</label>
                <input
                  type="text"
                  value={editing.data.schedule || ''}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, schedule: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                  placeholder="VD: Tối Thứ Sáu, 19:30"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Địa điểm</label>
                <input
                  type="text"
                  value={editing.data.location || ''}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, location: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                  placeholder="VD: Hội trường lớn"
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Icon (Tên từ Lucide React)</label>
                <select
                  value={editing.data.icon || 'Users'}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, icon: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                >
                  <option value="Users">Users (Nhóm người)</option>
                  <option value="Heart">Heart (Trái tim)</option>
                  <option value="Baby">Baby (Trẻ em)</option>
                  <option value="Music">Music (Âm nhạc)</option>
                  <option value="MessageCircle">MessageCircle (Trò chuyện)</option>
                  <option value="BookOpen">BookOpen (Sách mở)</option>
                  <option value="Target">Target (Mục tiêu)</option>
                  <option value="Activity">Activity (Hoạt động)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Mô tả ngắn gọn (Desc)</label>
                <input
                  type="text"
                  value={editing.data.desc || ''}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, desc: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                  placeholder="Mô tả 1 dòng..."
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Ảnh nền (Cover Image)</label>
              <div style={{ position: 'relative' }}>
                <ImageIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem 0.75rem 32px', color: '#fff', fontSize: '0.95rem' }}
                />
              </div>
              {uploadingImage && <p style={{ fontSize: '0.8rem', color: '#48BCE1', marginTop: '4px' }}>Đang tải ảnh lên...</p>}
              {editing.data.image_url && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img src={editing.data.image_url} alt="Preview" style={{ maxWidth: '150px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }} />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Mô tả chi tiết (Details)</label>
              <textarea
                value={editing.data.details || ''}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, details: e.target.value } })}
                rows={3}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem', resize: 'vertical' }}
                placeholder="Bài viết mô tả sâu hơn về mục vụ..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Sứ mạng (Mission)</label>
                <textarea
                  value={editing.data.mission || ''}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, mission: e.target.value } })}
                  rows={3}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem', resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Mục tiêu (Goal)</label>
                <textarea
                  value={editing.data.goal || ''}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, goal: e.target.value } })}
                  rows={3}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem', resize: 'vertical' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Các hoạt động chính (Activities)</label>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {(editing.data.activities || []).map((activity, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                    <Activity size={16} color="#22c55e" />
                    <span style={{ flex: 1, color: '#fff', fontSize: '0.95rem' }}>{activity}</span>
                    <button type="button" onClick={() => handleRemoveActivity(idx)} style={{ background: 'none', border: 'none', color: '#f12d5c', cursor: 'pointer', display: 'flex' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={activityInput}
                  onChange={(e) => setActivityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddActivity();
                    }
                  }}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                  placeholder="Nhập nội dung hoạt động và nhấn nút Thêm..."
                />
                <button
                  type="button"
                  onClick={handleAddActivity}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                >
                  Thêm
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#48BCE1', border: 'none', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                Lưu mục vụ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0 1rem', height: '44px', marginBottom: '1.5rem' }}>
        <Search size={18} style={{ color: '#7a8599' }} />
        <input
          type="text"
          placeholder="Tìm kiếm mục vụ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', width: '100%', fontSize: '0.95rem' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="spin" style={{ color: '#48BCE1' }} />
        </div>
      ) : filteredMinistries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7a8599' }}>
          Không tìm thấy mục vụ nào
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredMinistries.map((min) => {
            return (
              <div key={min.id} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ background: 'rgba(72,188,225,0.1)', padding: '10px', borderRadius: '12px', color: '#48BCE1' }}>
                    <Target size={24} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(min)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }} title="Sửa">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(min.id)} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(241,45,92,0.1)', border: '1px solid rgba(241,45,92,0.2)', borderRadius: '8px', color: '#f12d5c', cursor: 'pointer' }} title="Xóa">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#48BCE1', marginBottom: '0.25rem' }}>{min.category}</span>
                <h4 style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>{min.name}</h4>
                {min.image_url && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <img src={min.image_url} alt={min.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
                  </div>
                )}
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{min.desc}</p>
                
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#9ca3af' }}>
                  {min.leader && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={14} /> {min.leader}
                    </span>
                  )}
                  {min.schedule && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity size={14} /> {min.schedule}
                    </span>
                  )}
                  {min.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} /> {min.location}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && filteredMinistries.length > 0 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      )}
    </div>
  );
}
