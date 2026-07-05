'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2, Video, Headphones, Calendar, User } from 'lucide-react';
import { fetchSermons, createSermon, updateSermon, deleteSermon } from '@/lib/sermons';
import type { Sermon, SermonCreateInput } from '@/lib/sermons';
import Pagination from '@/components/ui/Pagination';

interface EditingState {
  id: string | null;
  data: SermonCreateInput;
}

const emptyData = (): SermonCreateInput => ({
  title: '',
  description: '',
  preacher: '',
  sermon_date: new Date().toISOString().split('T')[0],
});

export default function AdminSermonManager() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ id: null, data: emptyData() });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
   
  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const loadSermons = async () => {
    setLoading(true);
    try {
      const { data, count } = await fetchSermons(ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE);
      setSermons(data);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    } catch {
      showToast('Lỗi khi tải danh sách bài giảng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
     
    loadSermons();
  }, [currentPage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.data.title.trim() || !editing.data.preacher.trim()) {
      showToast('Tiêu đề và giảng viên là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updateSermon(editing.id, editing.data);
        if (updated) {
          setSermons(sermons.map((s) => (s.id === editing.id ? updated : s)));
          showToast('Đã cập nhật bài giảng');
        }
      } else {
        const created = await createSermon(editing.data);
        if (created) {
          setSermons([created, ...sermons]);
          showToast('Đã tạo bài giảng mới');
        }
      }
      handleCancel();
    } catch {
      showToast('Lỗi khi lưu bài giảng');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sermon: Sermon) => {
    setEditing({
      id: sermon.id,
      data: {
        title: sermon.title,
        description: sermon.description || '',
        preacher: sermon.preacher,
        sermon_date: sermon.sermon_date,
        audio_url: sermon.audio_url,
        video_url: sermon.video_url,
        duration_minutes: sermon.duration_minutes,
      },
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa bài giảng này?')) {
      try {
        const success = await deleteSermon(id);
        if (success) {
          setSermons(sermons.filter((s) => s.id !== id));
          showToast('Đã xóa bài giảng');
        }
      } catch {
        showToast('Lỗi khi xóa bài giảng');
      }
    }
  };

  const handleCancel = () => {
    setEditing({ id: null, data: emptyData() });
    setShowForm(false);
  };

  const filteredSermons = sermons.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.preacher.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {toast && (
        <div className="toast info" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <div className="toast-body">
            <p className="toast-msg">{toast}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Quản lý Bài giảng
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
            Thêm, sửa và quản lý thư viện bài giảng
          </p>
        </div>
        {!showForm && (
          <button
            className="btn-submit"
            style={{ width: 'auto', padding: '0.6rem 1.1rem' }}
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} /> Thêm bài giảng
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="section-card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-card-header">
            <h3>{editing.id ? <><Edit2 size={15} /> Sửa bài giảng</> : <><Plus size={15} /> Bài giảng mới</>}</h3>
            <button
              onClick={handleCancel}
              className="btn-icon danger"
              title="Đóng"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSave} className="cms-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tiêu đề *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editing.data.title}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, title: e.target.value } })}
                  placeholder="Nhập tiêu đề bài giảng"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Giảng viên *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editing.data.preacher}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, preacher: e.target.value } })}
                  placeholder="Tên mục sư / giảng viên"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ngày giảng</label>
                <input
                  type="date"
                  className="form-input"
                  value={editing.data.sermon_date}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, sermon_date: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Thời lượng (phút)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editing.data.duration_minutes || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      data: { ...editing.data, duration_minutes: parseInt(e.target.value) || undefined },
                    })
                  }
                  placeholder="Ví dụ: 45"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả</label>
              <textarea
                className="form-textarea"
                value={editing.data.description || ''}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, description: e.target.value } })}
                placeholder="Mô tả ngắn về bài giảng..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">URL Video (YouTube)</label>
                <div style={{ position: 'relative' }}>
                  <Video size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="url"
                    className="form-input"
                    style={{ paddingLeft: 32 }}
                    value={editing.data.video_url || ''}
                    onChange={(e) => setEditing({ ...editing, data: { ...editing.data, video_url: e.target.value } })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">URL Audio</label>
                <div style={{ position: 'relative' }}>
                  <Headphones size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="url"
                    className="form-input"
                    style={{ paddingLeft: 32 }}
                    value={editing.data.audio_url || ''}
                    onChange={(e) => setEditing({ ...editing, data: { ...editing.data, audio_url: e.target.value } })}
                    placeholder="https://example.com/audio.mp3"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-submit" style={{ width: 'auto', padding: '0.65rem 1.5rem' }} disabled={saving}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {saving ? 'Đang lưu...' : editing.id ? 'Cập nhật' : 'Tạo mới'}
              </button>
              <button type="button" onClick={handleCancel} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.65rem 1.1rem', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit',
              }}>
                <X size={16} /> Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="section-card">
        <div className="section-card-header">
          <h3>Danh sách bài giảng</h3>
          <span className="panel-card-count">{sermons.length} bài (Trang {currentPage}/{totalPages})</span>
        </div>

        <div className="panel-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc giảng viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            <p>Đang tải bài giảng...</p>
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Headphones size={24} /></div>
            <span>Chưa có bài giảng nào</span>
            <p>Nhấn "Thêm bài giảng" để bắt đầu.</p>
          </div>
        ) : (
          <div className="data-list">
            {filteredSermons.map((sermon) => (
              <div key={sermon.id} className="data-item">
                <div className="data-item-info">
                  <p className="data-item-title">{sermon.title}</p>
                  <p className="data-item-sub">
                    {sermon.preacher}
                    {sermon.sermon_date && (
                      <> · {new Date(sermon.sermon_date).toLocaleDateString('vi-VN')}</>
                    )}
                    {sermon.duration_minutes && <> · {sermon.duration_minutes} phút</>}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  {sermon.video_url && (
                    <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                      VIDEO
                    </span>
                  )}
                  {sermon.audio_url && (
                    <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, background: 'rgba(72,188,225,0.12)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
                      AUDIO
                    </span>
                  )}
                </div>
                <div className="data-item-actions">
                  <button className="btn-icon edit" onClick={() => handleEdit(sermon)} title="Sửa">
                    <Edit2 size={15} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(sermon.id)} title="Xóa">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      </div>
    </div>
  );
}
