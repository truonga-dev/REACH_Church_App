'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2, BookOpen, ImageIcon, UploadCloud } from 'lucide-react';
import { fetchDevotionals, createDevotional, updateDevotional, deleteDevotional } from '@/lib/devotionals';
import type { Devotional, DevotionalCreateInput } from '@/lib/devotionals';
import Pagination from '@/components/ui/Pagination';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}],
    ['link', 'image'],
    ['clean']
  ],
};

interface EditingState {
  id: string | null;
  data: DevotionalCreateInput;
}

const emptyData = (): DevotionalCreateInput => ({
  title: '',
  content: '',
  author: '',
  category: '',
});

export default function AdminDevotionalManager() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ id: null, data: emptyData() });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [toast, setToast] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadDevotionals();
  }, [currentPage]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const loadDevotionals = async () => {
    setLoading(true);
    try {
      const { data, count } = await fetchDevotionals(ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE);
      setDevotionals(data);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    } catch {
      showToast('Lỗi khi tải dữ liệu');
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
        const updated = await updateDevotional(editing.id, editing.data);
        if (updated) {
          setDevotionals(devotionals.map((d) => (d.id === editing.id ? updated : d)));
          showToast('Đã cập nhật bài dưỡng linh');
        }
      } else {
        const created = await createDevotional(editing.data);
        if (created) {
          setDevotionals([created, ...devotionals]);
          showToast('Đã tạo bài dưỡng linh mới');
        }
      }
      handleCancel();
    } catch {
      showToast('Lỗi khi lưu bài dưỡng linh');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (devotional: Devotional) => {
    setEditing({
      id: devotional.id,
      data: {
        title: devotional.title,
        content: devotional.content,
        author: devotional.author,
        featured_image_url: devotional.featured_image_url,
        category: devotional.category || '',
      },
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa bài dưỡng linh này?')) {
      try {
        const success = await deleteDevotional(id);
        if (success) {
          setDevotionals(devotionals.filter((d) => d.id !== id));
          showToast('Đã xóa bài dưỡng linh');
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
      const filePath = `devotionals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setEditing({
        ...editing,
        data: { ...editing.data, featured_image_url: urlData.publicUrl }
      });
      showToast('Tải ảnh lên thành công');
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(error);
      showToast('Lỗi khi tải ảnh: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredDevotionals = devotionals.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.author.toLowerCase().includes(searchQuery.toLowerCase())
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
            Quản lý Dưỡng linh
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
            Thêm và quản lý các bài dưỡng linh hàng ngày
          </p>
        </div>
        {!showForm && (
          <button
            className="btn-submit"
            style={{ width: 'auto', padding: '0.6rem 1.1rem' }}
            onClick={() => setShowForm(true)}
          >
            <Plus size={17} /> Thêm bài mới
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="section-card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-card-header">
            <h3>
              {editing.id ? <><Edit2 size={15} /> Sửa bài dưỡng linh</> : <><Plus size={15} /> Bài dưỡng linh mới</>}
            </h3>
            <button onClick={handleCancel} className="btn-icon danger" title="Đóng">
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
                  placeholder="Nhập tiêu đề bài dưỡng linh"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tác giả</label>
                <input
                  type="text"
                  className="form-input"
                  value={editing.data.author}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, author: e.target.value } })}
                  placeholder="Tên tác giả"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Chủ đề / Thể loại</label>
              <input
                type="text"
                className="form-input"
                value={editing.data.category || ''}
                onChange={(e) => setEditing({ ...editing, data: { ...editing.data, category: e.target.value } })}
                placeholder="VD: Gia đình, Đức tin, Hy vọng..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nội dung *</label>
              <ReactQuill
                theme="snow"
                modules={quillModules}
                value={editing.data.content}
                onChange={(val) => setEditing({ ...editing, data: { ...editing.data, content: val } })}
                placeholder="Nhập nội dung bài dưỡng linh..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hình ảnh (Tối đa 5MB)</label>
              <div style={{ position: 'relative' }}>
                <ImageIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="file"
                  accept="image/*"
                  className="form-input"
                  style={{ paddingLeft: 32 }}
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </div>
              {uploadingImage && <p style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', marginTop: '4px' }}>Đang tải ảnh lên...</p>}
              {editing.data.featured_image_url && (
                <div style={{ marginTop: '0.5rem' }}>
                  <img src={editing.data.featured_image_url} alt="Preview" style={{ maxWidth: '100px', borderRadius: '4px', border: '1px solid var(--border)' }} />
                </div>
              )}
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
          <h3><BookOpen size={16} /> Danh sách bài dưỡng linh</h3>
          <span className="panel-card-count">{devotionals.length} bài (Trang {currentPage}/{totalPages})</span>
        </div>

        <div className="panel-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề, tác giả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="empty-state">
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            <p>Đang tải bài dưỡng linh...</p>
          </div>
        ) : filteredDevotionals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={24} /></div>
            <span>Chưa có bài dưỡng linh nào</span>
            <p>Nhấn "Thêm bài mới" để bắt đầu.</p>
          </div>
        ) : (
          <div className="data-list">
            {filteredDevotionals.map((devotional) => (
              <div key={devotional.id} className="data-item">
                <div className="data-item-info">
                  <p className="data-item-title">{devotional.title}</p>
                  <p className="data-item-sub">
                    {devotional.category && <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>[{devotional.category}] </span>}
                    {devotional.author && <>{devotional.author} · </>}
                    {new Date(devotional.created_at).toLocaleDateString('vi-VN')}
                    {' · '}
                    {devotional.content.substring(0, 60)}...
                  </p>
                </div>
                {devotional.featured_image_url && (
                  <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, background: 'rgba(72,188,225,0.12)', color: 'var(--primary)', border: '1px solid var(--primary-border)', whiteSpace: 'nowrap' }}>
                    ảnh
                  </span>
                )}
                <div className="data-item-actions">
                  <button className="btn-icon edit" onClick={() => handleEdit(devotional)} title="Sửa">
                    <Edit2 size={15} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(devotional.id)} title="Xóa">
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
