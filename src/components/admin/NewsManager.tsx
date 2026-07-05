'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2, Newspaper, Image } from 'lucide-react';
import { fetchNewsPosts, createNewsPost, updateNewsPost, deleteNewsPost } from '@/lib/news';
import type { NewsPost, NewsPostCreateInput } from '@/lib/news';

const CATEGORIES: Record<string, string> = {
  announcements: 'Thông báo',
  events: 'Sự kiện',
  testimonies: 'Chứng ngôn',
  updates: 'Cập nhật',
  other: 'Khác',
};

const CATEGORY_COLORS: Record<string, string> = {
  announcements: '#48bce1',
  events: '#f4cc30',
  testimonies: '#10b981',
  updates: '#8b5cf6',
  other: '#64748b',
};

interface EditingState {
  id: string | null;
  data: NewsPostCreateInput;
}

const emptyData = (): NewsPostCreateInput => ({
  title: '',
  content: '',
  category: 'announcements',
});

export default function AdminNewsManager() {
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ id: null, data: emptyData() });
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');
  const [formLang, setFormLang] = useState<'vi' | 'en' | 'ko'>('vi');

  useEffect(() => {
    loadNewsPosts();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const loadNewsPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchNewsPosts(100, 0);
      setNewsPosts(data);
    } catch {
      showToast('Lỗi khi tải tin tức');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.data.title.trim() || !editing.data.content.trim()) {
      showToast('Tiêu đề và nội dung là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        const updated = await updateNewsPost(editing.id, editing.data);
        if (updated) {
          setNewsPosts(newsPosts.map((n) => (n.id === editing.id ? updated : n)));
          showToast('Đã cập nhật tin tức');
        }
      } else {
        const created = await createNewsPost(editing.data);
        if (created) {
          setNewsPosts([created, ...newsPosts]);
          showToast('Đã tạo tin tức mới');
        }
      }
      handleCancel();
    } catch {
      showToast('Lỗi khi lưu tin tức');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post: NewsPost) => {
    setEditing({
      id: post.id,
      data: {
        title: post.title,
        title_en: post.title_en || '',
        title_ko: post.title_ko || '',
        content: post.content,
        content_en: post.content_en || '',
        content_ko: post.content_ko || '',
        category: post.category,
        image_url: post.image_url,
      },
    });
    setFormLang('vi');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa tin tức này?')) {
      try {
        const success = await deleteNewsPost(id);
        if (success) {
          setNewsPosts(newsPosts.filter((n) => n.id !== id));
          showToast('Đã xóa tin tức');
        }
      } catch {
        showToast('Lỗi khi xóa');
      }
    }
  };

  const handleCancel = () => {
    setEditing({ id: null, data: emptyData() });
    setShowForm(false);
  };

  const filteredPosts = newsPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
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
            Quản lý Tin tức
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
            Đăng và quản lý tin tức, thông báo của hội thánh
          </p>
        </div>
        {!showForm && (
          <button
            className="btn-submit"
            style={{ width: 'auto', padding: '0.6rem 1.1rem' }}
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} /> Thêm tin tức
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="section-card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-card-header">
            <h3>
              {editing.id ? <><Edit2 size={15} /> Sửa tin tức</> : <><Plus size={15} /> Tin tức mới</>}
            </h3>
            <button onClick={handleCancel} className="btn-icon danger" title="Đóng">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSave} className="cms-form">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button type="button" onClick={() => setFormLang('vi')} style={{ padding: '6px 12px', background: formLang === 'vi' ? '#48bce1' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Tiếng Việt</button>
              <button type="button" onClick={() => setFormLang('en')} style={{ padding: '6px 12px', background: formLang === 'en' ? '#48bce1' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>English</button>
              <button type="button" onClick={() => setFormLang('ko')} style={{ padding: '6px 12px', background: formLang === 'ko' ? '#48bce1' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>한국어</button>
            </div>

            <div className="form-group">
              <label className="form-label">Tiêu đề {formLang === 'vi' ? '*' : ''}</label>
              <input
                type="text"
                className="form-input"
                value={formLang === 'vi' ? editing.data.title : (formLang === 'en' ? (editing.data.title_en || '') : (editing.data.title_ko || ''))}
                onChange={(e) => {
                  const key = formLang === 'vi' ? 'title' : (formLang === 'en' ? 'title_en' : 'title_ko');
                  setEditing({ ...editing, data: { ...editing.data, [key]: e.target.value } });
                }}
                placeholder="Nhập tiêu đề tin tức"
                required={formLang === 'vi'}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Danh mục</label>
                <select
                  className="form-select"
                  value={editing.data.category}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, category: e.target.value } })}
                >
                  {Object.entries(CATEGORIES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">URL Hình ảnh</label>
                <div style={{ position: 'relative' }}>
                  <Image size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="url"
                    className="form-input"
                    style={{ paddingLeft: 32 }}
                    value={editing.data.image_url || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, data: { ...editing.data, image_url: e.target.value } })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nội dung {formLang === 'vi' ? '*' : ''}</label>
              <textarea
                className="form-textarea"
                value={formLang === 'vi' ? editing.data.content : (formLang === 'en' ? (editing.data.content_en || '') : (editing.data.content_ko || ''))}
                onChange={(e) => {
                  const key = formLang === 'vi' ? 'content' : (formLang === 'en' ? 'content_en' : 'content_ko');
                  setEditing({ ...editing, data: { ...editing.data, [key]: e.target.value } });
                }}
                placeholder="Nhập nội dung tin tức..."
                rows={8}
                required={formLang === 'vi'}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn-submit" style={{ width: 'auto', padding: '0.65rem 1.5rem' }} disabled={saving}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                {saving ? 'Đang lưu...' : editing.id ? 'Cập nhật' : 'Đăng tin'}
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
          <h3><Newspaper size={16} /> Danh sách tin tức</h3>
          <span className="panel-card-count">{filteredPosts.length} bài</span>
        </div>

        <div className="panel-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            <p>Đang tải tin tức...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Newspaper size={24} /></div>
            <span>Chưa có tin tức nào</span>
            <p>Nhấn "Thêm tin tức" để bắt đầu đăng bài.</p>
          </div>
        ) : (
          <div className="data-list">
            {filteredPosts.map((post) => {
              const catColor = CATEGORY_COLORS[post.category] || '#64748b';
              return (
                <div key={post.id} className="data-item">
                  {post.image_url && (
                     
                    <img
                      src={post.image_url}
                      alt=""
                      className="news-thumb"
                    />
                  )}
                  <div className="data-item-info">
                    <p className="data-item-title">{post.title}</p>
                    <p className="data-item-sub">
                      {new Date(post.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: 999,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: `${catColor}18`,
                      color: catColor,
                      border: `1px solid ${catColor}35`,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {CATEGORIES[post.category] || post.category}
                  </span>
                  <div className="data-item-actions">
                    <button className="btn-icon edit" onClick={() => handleEdit(post)} title="Sửa">
                      <Edit2 size={15} />
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDelete(post.id)} title="Xóa">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
