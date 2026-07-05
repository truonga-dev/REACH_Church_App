'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2, Video, Radio } from 'lucide-react';
import { fetchLivestreams, createLivestream, updateLivestream, deleteLivestream } from '@/lib/livestreams';
import type { Livestream, LivestreamCreateInput } from '@/lib/livestreams';
import Pagination from '@/components/ui/Pagination';

interface EditingState {
  id: string | null;
  data: LivestreamCreateInput;
}

const emptyData = (): LivestreamCreateInput => ({
  title: '',
  description: '',
  youtube_id: '',
  is_live: false,
  scheduled_at: '',
});

export default function LivestreamManager() {
  const [livestreams, setLivestreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ id: null, data: emptyData() });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
   
  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const loadLivestreams = async () => {
    setLoading(true);
    try {
      const { data, count } = await fetchLivestreams(ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE);
      setLivestreams(data);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    } catch {
      showToast('Lỗi khi tải danh sách livestream');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     
    loadLivestreams();
  }, [currentPage]);

  const extractYoutubeId = (urlOrId: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlOrId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : urlOrId;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.data.title.trim() || !editing.data.youtube_id?.trim()) {
      showToast('Tiêu đề và ID/Link YouTube là bắt buộc');
      return;
    }

    const payload = { ...editing.data, youtube_id: extractYoutubeId(editing.data.youtube_id) };

    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updateLivestream(editing.id, payload);
        if (updated) {
          // If we turned this live, we must set others to not live in local state
          const updatedList = livestreams.map((s) => {
             if (s.id === editing.id) return updated;
             if (updated.is_live && s.is_live) return { ...s, is_live: false };
             return s;
          });
          setLivestreams(updatedList);
          showToast('Đã cập nhật livestream');
        }
      } else {
        const created = await createLivestream(payload);
        if (created) {
          if (created.is_live) {
             setLivestreams([created, ...livestreams.map(l => ({ ...l, is_live: false }))]);
          } else {
             setLivestreams([created, ...livestreams]);
          }
          showToast('Đã thêm livestream mới');
        }
      }
      handleCancel();
    } catch {
      showToast('Lỗi khi lưu livestream');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ls: Livestream) => {
    setEditing({
      id: ls.id,
      data: {
        title: ls.title,
        description: ls.description || '',
        youtube_id: ls.youtube_id || '',
        is_live: ls.is_live,
        scheduled_at: ls.scheduled_at || '',
      },
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLive = async (ls: Livestream) => {
    try {
      const updated = await updateLivestream(ls.id, { is_live: !ls.is_live });
      if (updated) {
         setLivestreams(livestreams.map((s) => {
             if (s.id === ls.id) return updated;
             if (updated.is_live && s.is_live) return { ...s, is_live: false };
             return s;
         }));
         showToast(updated.is_live ? 'Đã bật phát trực tiếp' : 'Đã tắt trực tiếp');
      }
    } catch {
       showToast('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa livestream này?')) return;
    try {
      await deleteLivestream(id);
      setLivestreams(livestreams.filter((s) => s.id !== id));
      showToast('Đã xóa livestream');
    } catch {
      showToast('Lỗi khi xóa livestream');
    }
  };

  const handleCancel = () => {
    setEditing({ id: null, data: emptyData() });
    setShowForm(false);
  };

  return (
    <div className="admin-content-section">
      <div className="section-header">
        <div className="header-title">
          <Video className="header-icon" />
          <div>
            <h2>Quản lý Livestream</h2>
            <p>Cài đặt thông báo trực tiếp cho các buổi lễ</p>
          </div>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Thêm Livestream
          </button>
        )}
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing.id ? 'Sửa Livestream' : 'Thêm Livestream mới'}</h3>
          <form onSubmit={handleSave} className="admin-form">
            <div className="form-group">
              <label>Tiêu đề *</label>
              <input
                type="text"
                value={editing.data.title}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, title: e.target.value } })}
                placeholder="VD: Lễ Chúa Nhật 28/06/2026"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Link YouTube hoặc Video ID *</label>
              <input
                type="text"
                value={editing.data.youtube_id || ''}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, youtube_id: e.target.value } })}
                placeholder="VD: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                required
              />
              <span className="help-text">Sao chép đường dẫn video trên YouTube và dán vào đây.</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Thời gian dự kiến</label>
                <input
                  type="datetime-local"
                  value={editing.data.scheduled_at ? new Date(editing.data.scheduled_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, scheduled_at: new Date(e.target.value).toISOString() } })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 28 }}>
                <input
                  type="checkbox"
                  id="isLive"
                  checked={editing.data.is_live}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, is_live: e.target.checked } })}
                  style={{ width: 20, height: 20 }}
                />
                <label htmlFor="isLive" style={{ marginBottom: 0, fontWeight: 'bold', color: editing.data.is_live ? '#ef4444' : 'inherit' }}>
                  Đang phát trực tiếp (Live)
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Mô tả / Ghi chú thêm</label>
              <textarea
                value={editing.data.description || ''}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, description: e.target.value } })}
                rows={3}
                placeholder="Nội dung tóm tắt..."
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                <X size={18} /> Hủy
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <Loader2 className="spinner" size={18} /> : <Save size={18} />}
                {editing.id ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={32} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : livestreams.length === 0 ? (
          <div className="empty-state">
            <Video size={48} className="empty-icon" />
            <p>Chưa có livestream nào</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Trạng thái</th>
                  <th>Tiêu đề</th>
                  <th>Video ID</th>
                  <th>Thời gian tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {livestreams.map((ls) => (
                  <tr key={ls.id}>
                    <td>
                      <button
                        className={`status-badge ${ls.is_live ? 'published' : 'draft'}`}
                        onClick={() => handleToggleLive(ls)}
                        title="Bấm để Đổi trạng thái"
                        style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {ls.is_live ? <><Radio size={14} className="pulse-icon" /> ĐANG LIVE</> : 'Đã Tắt'}
                      </button>
                    </td>
                    <td className="main-cell">
                      <span className="item-title">{ls.title}</span>
                    </td>
                    <td>{ls.youtube_id}</td>
                    <td>{new Date(ls.created_at).toLocaleDateString('vi-VN')}</td>
                    <td className="actions-cell">
                      <button className="icon-btn edit-btn" onClick={() => handleEdit(ls)} title="Sửa">
                        <Edit2 size={18} />
                      </button>
                      <button className="icon-btn delete-btn" onClick={() => handleDelete(ls.id)} title="Xóa">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </div>
      
      {toast && (
        <div className="toast toast-success" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
