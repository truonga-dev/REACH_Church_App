'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2, Calendar, MapPin, Users, UserCheck, Bell } from 'lucide-react';
import { fetchAllEvents, createEvent, updateEvent, deleteEvent, getEventRegistrations, getEventVolunteers } from '@/lib/events';
import { supabase } from '@/lib/supabase';
import Pagination from '@/components/ui/Pagination';
import type { Event, EventCreateInput, EventRegistration } from '@/lib/events';

interface EditingState {
  id: string | null;
  data: EventCreateInput;
}

const emptyData = (): EventCreateInput => ({
  title: '',
  description: '',
  event_date: '',
  location: '',
  max_attendees: undefined,
});

export default function EventsManager() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EditingState>({ id: null, data: emptyData() });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [toast, setToast] = useState('');
  const [formLang, setFormLang] = useState<'vi' | 'en' | 'ko'>('vi');
  
  const [viewingRegistrants, setViewingRegistrants] = useState<{eventId: string, title: string} | null>(null);
  const [registrants, setRegistrants] = useState<EventRegistration[]>([]);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);
  const [viewTab, setViewTab] = useState<'attendees' | 'volunteers'>('attendees');
  const [volunteers, setVolunteers] = useState<any[]>([]);  

  useEffect(() => {
    loadEvents();
  }, [currentPage]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, count } = await fetchAllEvents(ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE);
      setEvents(data);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    } catch {
      showToast('Lỗi khi tải dữ liệu sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.data.title.trim() || !editing.data.event_date) {
      showToast('Tiêu đề và Ngày giờ là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      // Ensure max_attendees is a number or undefined, not empty string
      const payload = {
        ...editing.data,
        max_attendees: editing.data.max_attendees ? Number(editing.data.max_attendees) : undefined
      };

      if (editing.id) {
        const updated = await updateEvent(editing.id, payload);
        if (updated) {
          setEvents(events.map((d) => (d.id === editing.id ? updated : d)));
          showToast('Đã cập nhật sự kiện');
        }
      } else {
        const created = await createEvent(payload);
        if (created) {
          setEvents([created, ...events]);
          showToast('Đã tạo sự kiện mới');
        }
      }
      handleCancel();
    } catch {
      showToast('Lỗi khi lưu sự kiện');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ev: Event) => {
    setEditing({
      id: ev.id,
      data: {
        title: ev.title,
        title_en: ev.title_en || '',
        title_ko: ev.title_ko || '',
        description: ev.description || '',
        description_en: ev.description_en || '',
        description_ko: ev.description_ko || '',
        event_date: new Date(new Date(ev.event_date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0,16),
        location: ev.location || '',
        location_en: ev.location_en || '',
        location_ko: ev.location_ko || '',
        max_attendees: ev.max_attendees,
      },
    });
    setFormLang('vi');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sự kiện này?')) {
      try {
        const success = await deleteEvent(id);
        if (success) {
          setEvents(events.filter((d) => d.id !== id));
          showToast('Đã xóa sự kiện');
        } else {
          showToast('Lỗi khi xóa sự kiện');
        }
      } catch {
        showToast('Lỗi khi xóa sự kiện');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing({ id: null, data: emptyData() });
  };

  const handleViewRegistrants = async (ev: Event) => {
    setViewingRegistrants({ eventId: ev.id, title: ev.title });
    setLoadingRegistrants(true);
    setRegistrants([]);
    setVolunteers([]);
    setViewTab('attendees');
    try {
      const data = await getEventRegistrations(ev.id);
      setRegistrants(data);
      const vols = await getEventVolunteers(ev.id);
      setVolunteers(vols);
    } catch {
      showToast('Lỗi khi tải dữ liệu');
    } finally {
      setLoadingRegistrants(false);
    }
  };

  const updateVolunteerStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('event_volunteers').update({ status }).eq('id', id);
      if (error) throw error;
      setVolunteers(volunteers.map(v => v.id === id ? { ...v, status } : v));
      showToast(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} tình nguyện viên`);
    } catch {
      showToast('Lỗi khi cập nhật trạng thái');
    }
  };

  const filteredEvents = events.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.location || '').toLowerCase().includes(searchQuery.toLowerCase())
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
            Quản lý Sự kiện
          </h2>
          <p style={{ color: '#7a8599', fontSize: '0.9rem' }}>
            Quản lý các sự kiện và xem số lượng đăng ký tham gia
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#48BCE1', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            <Plus size={18} /> Thêm sự kiện
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
              {editing.id ? 'Sửa sự kiện' : 'Thêm sự kiện mới'}
            </h3>
            <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#7a8599', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setFormLang('vi')} style={{ padding: '6px 12px', background: formLang === 'vi' ? '#f12d5c' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Tiếng Việt</button>
              <button type="button" onClick={() => setFormLang('en')} style={{ padding: '6px 12px', background: formLang === 'en' ? '#f12d5c' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>English</button>
              <button type="button" onClick={() => setFormLang('ko')} style={{ padding: '6px 12px', background: formLang === 'ko' ? '#f12d5c' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>한국어</button>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Tiêu đề {formLang === 'vi' ? '*' : ''}</label>
              <input
                required={formLang === 'vi'}
                type="text"
                value={formLang === 'vi' ? editing.data.title : (formLang === 'en' ? (editing.data.title_en || '') : (editing.data.title_ko || ''))}
                onChange={(e) => {
                  const key = formLang === 'vi' ? 'title' : (formLang === 'en' ? 'title_en' : 'title_ko');
                  setEditing({ ...editing, data: { ...editing.data, [key]: e.target.value } });
                }}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                placeholder="VD: Cầu Nguyện Kiêng Ăn"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Ngày & Giờ *</label>
                <input
                  required
                  type="datetime-local"
                  value={editing.data.event_date}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, event_date: e.target.value } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem', colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Số lượng tối đa (Tùy chọn)</label>
                <input
                  type="number"
                  min="1"
                  value={editing.data.max_attendees || ''}
                  onChange={(e) => setEditing({ ...editing, data: { ...editing.data, max_attendees: e.target.value ? Number(e.target.value) : undefined } })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                  placeholder="VD: 50"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Địa điểm</label>
              <input
                type="text"
                value={formLang === 'vi' ? (editing.data.location || '') : (formLang === 'en' ? (editing.data.location_en || '') : (editing.data.location_ko || ''))}
                onChange={(e) => {
                  const key = formLang === 'vi' ? 'location' : (formLang === 'en' ? 'location_en' : 'location_ko');
                  setEditing({ ...editing, data: { ...editing.data, [key]: e.target.value } });
                }}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                placeholder="VD: Hội trường chính"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Mô tả chi tiết</label>
              <textarea
                value={formLang === 'vi' ? (editing.data.description || '') : (formLang === 'en' ? (editing.data.description_en || '') : (editing.data.description_ko || ''))}
                onChange={(e) => {
                  const key = formLang === 'vi' ? 'description' : (formLang === 'en' ? 'description_en' : 'description_ko');
                  setEditing({ ...editing, data: { ...editing.data, [key]: e.target.value } });
                }}
                rows={5}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem', resize: 'vertical' }}
                placeholder="Thông tin thêm về sự kiện..."
              />
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
                Lưu sự kiện
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách sự kiện */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '0 1rem', height: '44px', marginBottom: '1.5rem' }}>
        <Calendar size={18} style={{ color: '#7a8599' }} />
        <input
          type="text"
          placeholder="Tìm kiếm sự kiện..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', width: '100%', fontSize: '0.95rem' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={32} className="spin" style={{ color: '#48BCE1' }} />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7a8599' }}>
          Không tìm thấy sự kiện nào
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredEvents.map((ev) => {
            const date = new Date(ev.event_date);
            const isPast = date < new Date();
            
            return (
              <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ color: '#fff', fontWeight: 600, fontSize: '1.05rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ev.title}
                    </h4>
                    {isPast && (
                      <span style={{ background: 'rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                        Đã qua
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#9ca3af', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={14} /> {date.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    {ev.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={14} /> {ev.location}
                      </span>
                    )}
                    <span 
                      onClick={() => handleViewRegistrants(ev)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#48BCE1', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      <Users size={14} /> {ev.registrations_count} / {ev.max_attendees || '∞'} đăng ký
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => {
                    const params = new URLSearchParams({
                      tab: 'notifications',
                      title: `Nhắc nhở sự kiện: ${ev.title}`,
                      message: `Kính mời quý tín hữu tham dự sự kiện vào lúc ${new Date(ev.event_date).toLocaleString('vi-VN')} tại ${ev.location || 'Hội thánh'}.`,
                      url: '/events'
                    });
                    window.location.href = `/admin?${params.toString()}`;
                  }} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(72,188,225,0.1)', border: '1px solid rgba(72,188,225,0.2)', borderRadius: '8px', color: '#48BCE1', cursor: 'pointer' }} title="Báo tin">
                    <Bell size={16} />
                  </button>
                  <button onClick={() => handleEdit(ev)} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', cursor: 'pointer' }} title="Sửa">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(ev.id)} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(241,45,92,0.1)', border: '1px solid rgba(241,45,92,0.2)', borderRadius: '8px', color: '#f12d5c', cursor: 'pointer' }} title="Xóa">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && filteredEvents.length > 0 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
        />
      )}

      {/* Modal / Overlay for Registrants */}
      {viewingRegistrants && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '1rem' }}>
          <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Người đăng ký: {viewingRegistrants.title}</h3>
              <button onClick={() => setViewingRegistrants(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '0 1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                onClick={() => setViewTab('attendees')}
                style={{ background: 'none', border: 'none', padding: '1rem 0', color: viewTab === 'attendees' ? '#48BCE1' : '#9ca3af', fontWeight: viewTab === 'attendees' ? 600 : 400, borderBottom: viewTab === 'attendees' ? '2px solid #48BCE1' : '2px solid transparent', cursor: 'pointer' }}
              >
                Người đăng ký ({registrants.length})
              </button>
              <button
                onClick={() => setViewTab('volunteers')}
                style={{ background: 'none', border: 'none', padding: '1rem 0', color: viewTab === 'volunteers' ? '#48BCE1' : '#9ca3af', fontWeight: viewTab === 'volunteers' ? 600 : 400, borderBottom: viewTab === 'volunteers' ? '2px solid #48BCE1' : '2px solid transparent', cursor: 'pointer' }}
              >
                Ban phục vụ ({volunteers.length})
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {loadingRegistrants ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Loader2 size={32} className="spin" style={{ color: '#48BCE1' }} />
                </div>
              ) : viewTab === 'attendees' ? (
                registrants.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    Chưa có người nào đăng ký sự kiện này.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {registrants.map(reg => {
                      // It can be an array if supabase joins multiple, or object
                      const profile = Array.isArray(reg.profiles) ? reg.profiles[0] : reg.profiles;
                      
                      return (
                        <div key={reg.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Users size={20} color="#fff" />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 0.25rem', color: '#fff', fontWeight: 600 }}>{profile?.full_name || 'Người dùng ẩn danh'}</p>
                            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>{profile?.email || 'Không có email'}</p>
                          </div>
                          <div style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'right' }}>
                            <p style={{ margin: '0 0 0.25rem' }}>Ngày đăng ký:</p>
                            <p style={{ margin: 0 }}>{new Date(reg.registered_at).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                volunteers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    Chưa có thành viên phục vụ nào đăng ký.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {volunteers.map(vol => {
                      const profile = Array.isArray(vol.profiles) ? vol.profiles[0] : vol.profiles;
                      
                      return (
                        <div key={vol.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {profile?.avatar_url ? (
                              <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <UserCheck size={20} color="#fff" />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 0.25rem', color: '#fff', fontWeight: 600 }}>{profile?.full_name || 'Người dùng ẩn danh'}</p>
                            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>Vai trò: <span style={{ color: '#48BCE1', fontWeight: 600 }}>{vol.role}</span></p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {vol.status === 'pending' ? (
                              <>
                                <button onClick={() => updateVolunteerStatus(vol.id, 'approved')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Duyệt</button>
                                <button onClick={() => updateVolunteerStatus(vol.id, 'rejected')} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Từ chối</button>
                              </>
                            ) : (
                              <span style={{ 
                                padding: '4px 10px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600,
                                background: vol.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: vol.status === 'approved' ? '#10b981' : '#ef4444'
                              }}>
                                {vol.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
