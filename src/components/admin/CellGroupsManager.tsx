'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Users, MapPin, Clock, Search, Shield, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CellGroup, CellGroupMember, Profile } from '@/types';
import Pagination from '@/components/ui/Pagination';

export default function CellGroupsManager() {
  const [groups, setGroups] = useState<CellGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<{ id: string | null; data: Partial<CellGroup> }>({
    id: null,
    data: { name: '', description: '', meeting_time: '', location: '' }
  });
  
  const [viewingMembers, setViewingMembers] = useState<{ groupId: string; name: string } | null>(null);
  const [members, setMembers] = useState<(CellGroupMember & { profiles: { full_name: string; email: string; avatar_url: string } })[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loadingPending, setLoadingPending] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGroups();
    loadPendingRequests();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cell_groups')
        .select(`
          *,
          profiles:leader_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      showToast('Lỗi khi tải danh sách nhóm');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    setLoadingPending(true);
    try {
      const { data, error } = await supabase
        .from('cell_group_members')
        .select(`
          *,
          profiles:user_id (full_name, email, avatar_url),
          cell_groups:group_id (name)
        `)
        .eq('status', 'pending')
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.data.name?.trim()) {
      showToast('Tên nhóm không được để trống');
      return;
    }

    try {
      if (editing.id) {
        const { error } = await supabase
          .from('cell_groups')
          .update(editing.data)
          .eq('id', editing.id);
        if (error) throw error;
        showToast('Đã cập nhật nhóm');
      } else {
        const { error } = await supabase
          .from('cell_groups')
          .insert([editing.data]);
        if (error) throw error;
        showToast('Đã tạo nhóm mới');
      }
      setShowForm(false);
      setEditing({ id: null, data: { name: '', description: '', meeting_time: '', location: '' } });
      loadGroups();
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      showToast('Lỗi khi lưu nhóm');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa nhóm này? Toàn bộ thành viên sẽ bị xóa khỏi nhóm.')) {
      try {
        const { error } = await supabase.from('cell_groups').delete().eq('id', id);
        if (error) throw error;
        showToast('Đã xóa nhóm');
        setGroups(groups.filter((g) => g.id !== id));
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(err);
        showToast('Lỗi khi xóa nhóm');
      }
    }
  };

  const handleEdit = (g: CellGroup) => {
    setEditing({
      id: g.id,
      data: {
        name: g.name,
        description: g.description,
        meeting_time: g.meeting_time,
        location: g.location,
        leader_id: g.leader_id
      }
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('cell_group_members')
        .select(`
          *,
          profiles:user_id (full_name, email, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      setMembers(data as any || []); // eslint-disable-line @typescript-eslint/no-explicit-any
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      showToast('Lỗi tải danh sách thành viên');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleViewMembers = (g: CellGroup) => {
    setViewingMembers({ groupId: g.id, name: g.name });
    loadMembers(g.id);
  };

  const updateMemberStatus = async (memberId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('cell_group_members')
        .update({ status })
        .eq('id', memberId);
      if (error) throw error;
      
      setMembers(members.map(m => m.id === memberId ? { ...m, status } : m));
      setPendingRequests(pendingRequests.filter(req => req.id !== memberId));
      showToast(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} thành viên`);
      if (status === 'approved' && viewingMembers === null) {
         loadGroups(); // reload counts if needed later
      }
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      showToast('Lỗi khi cập nhật thành viên');
    }
  };

  const updateMemberRole = async (memberId: string, role: 'member' | 'co_leader' | 'leader') => {
    try {
      const { error } = await supabase
        .from('cell_group_members')
        .update({ role })
        .eq('id', memberId);
      if (error) throw error;
      
      setMembers(members.map(m => m.id === memberId ? { ...m, role } : m));
      showToast(`Đã thay đổi vai trò`);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
      showToast('Lỗi khi cập nhật vai trò');
    }
  };

  const removeMember = async (memberId: string) => {
    if (confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) {
      try {
        const { error } = await supabase.from('cell_group_members').delete().eq('id', memberId);
        if (error) throw error;
        setMembers(members.filter(m => m.id !== memberId));
        showToast('Đã xóa thành viên');
      } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error(err);
        showToast('Lỗi khi xóa thành viên');
      }
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-content-card" style={{ padding: '2rem' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#48BCE1', color: '#fff', padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 600 }}>
          {toast}
        </div>
      )}

      {viewingMembers ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={() => setViewingMembers(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Trở lại
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Thành viên: {viewingMembers.name}
            </h2>
          </div>

          {loadingMembers ? (
            <p style={{ color: '#94a3b8' }}>Đang tải danh sách thành viên...</p>
          ) : members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <Users size={48} style={{ color: '#4b5563', marginBottom: '1rem' }} />
              <p style={{ color: '#9ca3af' }}>Chưa có thành viên nào đăng ký tham gia nhóm này.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', color: '#9ca3af', fontWeight: 600 }}>Thành viên</th>
                    <th style={{ padding: '1rem', color: '#9ca3af', fontWeight: 600 }}>Vai trò</th>
                    <th style={{ padding: '1rem', color: '#9ca3af', fontWeight: 600 }}>Trạng thái</th>
                    <th style={{ padding: '1rem', color: '#9ca3af', fontWeight: 600 }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {member.profiles?.avatar_url ? (
                            <img src={member.profiles.avatar_url} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <UserCheck size={20} color="#fff" />
                            </div>
                          )}
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>{member.profiles?.full_name}</p>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>{member.profiles?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select 
                          value={member.role}
                          onChange={(e) => updateMemberRole(member.id, e.target.value as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                          style={{ background: 'rgba(0,0,0,0.2)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}
                        >
                          <option value="member">Thành viên</option>
                          <option value="co_leader">Phó nhóm</option>
                          <option value="leader">Trưởng nhóm</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600,
                          background: member.status === 'approved' ? 'rgba(16,185,129,0.1)' : member.status === 'pending' ? 'rgba(244,204,48,0.1)' : 'rgba(239,68,68,0.1)',
                          color: member.status === 'approved' ? '#10b981' : member.status === 'pending' ? '#f4cc30' : '#ef4444'
                        }}>
                          {member.status === 'approved' ? 'Đã duyệt' : member.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {member.status === 'pending' && (
                            <>
                              <button onClick={() => updateMemberStatus(member.id, 'approved')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Duyệt</button>
                              <button onClick={() => updateMemberStatus(member.id, 'rejected')} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>Từ chối</button>
                            </>
                          )}
                          <button onClick={() => removeMember(member.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px' }} title="Xóa khỏi nhóm">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                Quản lý Nhóm nhỏ
              </h2>
              <p style={{ color: '#7a8599', fontSize: '0.9rem' }}>
                Quản lý các nhóm (Cell groups) và danh sách thành viên tham gia
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => { setEditing({ id: null, data: { name: '', description: '', meeting_time: '', location: '' } }); setShowForm(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#48BCE1', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                <Plus size={18} /> Thêm nhóm
              </button>
            )}
          </div>

          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && !showForm && (
            <div style={{ background: 'rgba(244,204,48,0.05)', border: '1px solid rgba(244,204,48,0.2)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Shield size={20} color="#f4cc30" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f4cc30', margin: 0 }}>
                  Yêu cầu chờ duyệt ({pendingRequests.length})
                </h3>
              </div>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {pendingRequests.map(req => {
                  const profile = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
                  const group = Array.isArray(req.cell_groups) ? req.cell_groups[0] : req.cell_groups;
                  return (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserCheck size={20} color="#fff" />
                          </div>
                        )}
                        <div>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: '#fff' }}>
                            {profile?.full_name || 'Người dùng ẩn danh'} <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.9rem' }}>muốn tham gia nhóm</span> <span style={{ color: '#48BCE1' }}>{group?.name}</span>
                          </p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af' }}>{profile?.email || 'Không có email'} • {new Date(req.joined_at).toLocaleString('vi-VN')}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => updateMemberStatus(req.id, 'approved')} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>Duyệt</button>
                        <button onClick={() => updateMemberStatus(req.id, 'rejected')} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>Từ chối</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showForm && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                  {editing.id ? 'Sửa nhóm' : 'Thêm nhóm mới'}
                </h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#7a8599', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Tên nhóm *</label>
                  <input
                    required
                    type="text"
                    value={editing.data.name}
                    onChange={(e) => setEditing({ ...editing, data: { ...editing.data, name: e.target.value } })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                    placeholder="VD: Nhóm Thanh Niên"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Mô tả ngắn</label>
                  <textarea
                    value={editing.data.description || ''}
                    onChange={(e) => setEditing({ ...editing, data: { ...editing.data, description: e.target.value } })}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem', minHeight: '80px' }}
                    placeholder="VD: Nhóm dành cho sinh viên và người trẻ đi làm..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Thời gian sinh hoạt</label>
                    <input
                      type="text"
                      value={editing.data.meeting_time || ''}
                      onChange={(e) => setEditing({ ...editing, data: { ...editing.data, meeting_time: e.target.value } })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                      placeholder="VD: 19:30 Thứ Sáu hàng tuần"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af', fontSize: '0.9rem' }}>Địa điểm</label>
                    <input
                      type="text"
                      value={editing.data.location || ''}
                      onChange={(e) => setEditing({ ...editing, data: { ...editing.data, location: e.target.value } })}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#fff', fontSize: '0.95rem' }}
                      placeholder="VD: Phòng sinh hoạt thanh niên"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    Hủy
                  </button>
                  <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#48BCE1', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    <Save size={18} /> Lưu nhóm
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Tìm kiếm nhóm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <p style={{ color: '#94a3b8' }}>Đang tải dữ liệu...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
              <Users size={48} style={{ color: '#4b5563', margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#e2e8f0', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Không tìm thấy nhóm nào</h3>
              <p style={{ color: '#9ca3af' }}>Hãy tạo nhóm nhỏ mới để bắt đầu.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filteredGroups.map((g) => (
                <div key={g.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>{g.name}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(g)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Sửa">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(g.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '6px', cursor: 'pointer' }} title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ color: '#9ca3af', fontSize: '0.95rem', marginBottom: '1.5rem', flex: 1 }}>
                    {g.description || 'Chưa có mô tả'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {g.meeting_time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                        <Clock size={16} color="#48bce1" /> {g.meeting_time}
                      </div>
                    )}
                    {g.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                        <MapPin size={16} color="#f59e0b" /> {g.location}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button 
                      onClick={() => handleViewMembers(g)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      <Users size={18} /> Xem thành viên
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
