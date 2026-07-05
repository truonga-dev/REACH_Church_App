'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2, Video, Radio, Calendar, AlignLeft, Type, Link as LinkIcon } from 'lucide-react';
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
  facebook_url: '',
  is_live: false,
  scheduled_at: '',
});

export default function LivestreamManager() {
  const [livestreams, setLivestreams] = useState<Livestream[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ id: null, data: emptyData() });
  const [useYoutube, setUseYoutube] = useState(false);
  const [useFacebook, setUseFacebook] = useState(false);
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
    if (!urlOrId) return null;
    if (urlOrId.length === 11 && !urlOrId.includes('/') && !urlOrId.includes('?')) return urlOrId;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
    const match = urlOrId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.data.title.trim()) {
      showToast('Tiêu đề là bắt buộc');
      return;
    }
    if (!editing.data.youtube_id?.trim() && !editing.data.facebook_url?.trim()) {
      showToast('Phải nhập ít nhất một nguồn video: YouTube hoặc Facebook');
      return;
    }

    const extractedYoutubeId = editing.data.youtube_id ? extractYoutubeId(editing.data.youtube_id) : null;
    const cleanFacebookUrl = editing.data.facebook_url?.trim() || null;

    if (!extractedYoutubeId && !cleanFacebookUrl) {
      showToast('Nguồn video không hợp lệ. Vui lòng kiểm tra lại link YouTube hoặc Facebook.');
      return;
    }

    const payload = {
      ...editing.data,
      youtube_id: extractedYoutubeId,
      facebook_url: cleanFacebookUrl,
      scheduled_at: editing.data.scheduled_at ? editing.data.scheduled_at : null,
    };

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
    setUseYoutube(!!ls.youtube_id);
    setUseFacebook(!!ls.facebook_url);
    setEditing({
      id: ls.id,
      data: {
        title: ls.title,
        description: ls.description || '',
        youtube_id: ls.youtube_id || '',
        facebook_url: ls.facebook_url || '',
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
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Video className="header-icon" />
          <div>
            <h2>Quản lý Livestream</h2>
            <p>Cài đặt thông báo trực tiếp cho các buổi lễ</p>
          </div>
        </div>
        {!showForm && (
          <button
            className="btn-submit"
            style={{ width: 'auto', padding: '0.6rem 1.1rem', marginTop: 0 }}
            onClick={() => {
              setEditing({ id: null, data: emptyData() });
              setUseYoutube(true);
              setUseFacebook(false);
              setShowForm(true);
            }}
          >
            <Plus size={17} /> Thêm Livestream
          </button>
        )}
      </div>

      {showForm && (
        <div className="section-card" style={{ marginBottom: '1.5rem', background: '#0a0f18', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div className="section-card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {editing.id ? <><Edit2 size={18} color="#38bdf8" /> Cập nhật sự kiện Livestream</> : <><Plus size={18} color="#38bdf8" /> Tạo sự kiện Livestream mới</>}
            </h3>
            <button onClick={handleCancel} className="btn-icon" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }} title="Đóng">
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSave} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
              {/* Left Column: Inputs */}
              <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Type size={14} /> Tiêu đề buổi lễ *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', height: '44px', fontSize: '1rem', color: '#fff' }}
                    value={editing.data.title}
                    onChange={(e) => setEditing({ ...editing, data: { ...editing.data, title: e.target.value } })}
                    placeholder="VD: Thánh Lễ Trực Tuyến Chúa Nhật..."
                    required
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label className="form-label" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <span style={{ background: '#ef4444', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: '0.65rem', fontWeight: 800 }}>YT</span>
                        Link YouTube
                      </label>
                      <label className="toggle-switch" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={useYoutube}
                          onChange={(e) => {
                            setUseYoutube(e.target.checked);
                            if (!e.target.checked) setEditing({ ...editing, data: { ...editing.data, youtube_id: '' } });
                          }}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                    {useYoutube && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(239, 68, 68, 0.2)', height: '44px' }}
                        value={editing.data.youtube_id || ''}
                        onChange={(e) => setEditing({ ...editing, data: { ...editing.data, youtube_id: e.target.value } })}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    )}
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label className="form-label" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                        <span style={{ background: '#3b82f6', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: '0.65rem', fontWeight: 800 }}>FB</span>
                        Link Facebook
                      </label>
                      <label className="toggle-switch" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={useFacebook}
                          onChange={(e) => {
                            setUseFacebook(e.target.checked);
                            if (!e.target.checked) setEditing({ ...editing, data: { ...editing.data, facebook_url: '' } });
                          }}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                    {useFacebook && (
                      <input
                        type="text"
                        className="form-input"
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(59, 130, 246, 0.2)', height: '44px' }}
                        value={(editing.data as any).facebook_url || ''}
                        onChange={(e) => setEditing({ ...editing, data: { ...editing.data, facebook_url: e.target.value } as any })}
                        placeholder="https://facebook.com/.../videos/..."
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} /> Thời gian bắt đầu
                    </label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', height: '44px', colorScheme: 'dark' }}
                      value={
                        editing.data.scheduled_at 
                          ? new Date(new Date(editing.data.scheduled_at).getTime() - new Date(editing.data.scheduled_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditing({ 
                          ...editing, 
                          data: { ...editing.data, scheduled_at: val ? new Date(val).toISOString() : '' } 
                        });
                      }}
                    />
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div 
                      onClick={() => setEditing({ ...editing, data: { ...editing.data, is_live: !editing.data.is_live } })}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                        background: editing.data.is_live ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                        padding: '0 16px', borderRadius: '8px', border: `1px solid ${editing.data.is_live ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                        height: '44px', transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: editing.data.is_live ? '#fca5a5' : '#94a3b8' }}>
                        {editing.data.is_live ? 'TRẠNG THÁI: ĐANG LIVE' : 'ĐANG CHỜ PHÁT'}
                      </span>
                      <div style={{
                        position: 'relative', width: 36, height: 20, borderRadius: 10,
                        background: editing.data.is_live ? '#ef4444' : '#475569', transition: 'background 0.3s ease'
                      }}>
                        <div style={{
                          position: 'absolute', top: 2, left: editing.data.is_live ? 18 : 2,
                          width: 16, height: 16, borderRadius: '50%', background: '#fff',
                          transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlignLeft size={14} /> Ghi chú / Mô tả (Tùy chọn)
                  </label>
                  <textarea
                    className="form-input"
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', resize: 'vertical' }}
                    value={editing.data.description || ''}
                    onChange={(e) => setEditing({ ...editing, data: { ...editing.data, description: e.target.value } })}
                    rows={2}
                    placeholder="Nhập vài dòng giới thiệu về buổi lễ..."
                  />
                </div>
              </div>

              {/* Right Column: Preview & Submit */}
              <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ 
                  flex: 1, borderRadius: '12px', overflow: 'hidden', 
                  background: '#070b12', border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', flexDirection: 'column', position: 'relative',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ padding: '8px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Video size={14} /> BẢN XEM TRƯỚC (PREVIEW)
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', position: 'relative' }}>
                    {(() => {
                      const ytId = editing.data.youtube_id ? extractYoutubeId(editing.data.youtube_id) : null;
                      if (ytId) return (
                        <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                          <img 
                            src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
                            onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`; }}
                            alt="Preview" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 48, height: 48, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>
                              <Radio size={24} color="#fff" />
                            </div>
                          </div>
                        </div>
                      );
                      if (editing.data.facebook_url) return (
                        <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '8px', background: 'rgba(24, 119, 242, 0.1)', border: '1px dashed rgba(24, 119, 242, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#60a5fa' }}>
                          <div style={{ width: 48, height: 48, background: '#1877f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={24} color="#fff" />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nguồn từ Facebook Live</span>
                        </div>
                      );
                      return (
                        <div style={{ textAlign: 'center', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <LinkIcon size={32} opacity={0.5} />
                          <span style={{ fontSize: '0.85rem' }}>Dán link video để xem trước</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={handleCancel} style={{ 
                    flex: 1, height: '48px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', 
                    background: 'transparent', color: '#cbd5e1', fontWeight: 600, fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'background 0.2s'
                  }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    Hủy bỏ
                  </button>
                  <button type="submit" disabled={saving} style={{ 
                    flex: 2, height: '48px', borderRadius: '8px', border: 'none', 
                    background: editing.id ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', 
                    color: '#fff', fontWeight: 600, fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)', transition: 'opacity 0.2s', opacity: saving ? 0.7 : 1
                  }} onMouseOver={(e) => !saving && (e.currentTarget.style.opacity = '0.9')} onMouseOut={(e) => !saving && (e.currentTarget.style.opacity = '1')}>
                    {saving ? <Loader2 className="spinner" size={20} /> : <Save size={20} />}
                    {editing.id ? 'Lưu cập nhật' : 'Xác nhận tạo sự kiện'}
                  </button>
                </div>
              </div>
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
                  <th>Nguồn video</th>
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
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ls.youtube_id && <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>YT</span>}
                      {ls.facebook_url && <span style={{ background: 'rgba(24,119,242,0.15)', color: '#60a5fa', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>FB</span>}
                      {!ls.youtube_id && !ls.facebook_url && <span style={{ color: '#475569', fontSize: '0.75rem' }}>—</span>}
                    </td>
                    <td>{new Date(ls.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td>
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
