'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Save, X, Search, AlertTriangle, UserCircle, Shield, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Pagination from '@/components/ui/Pagination';
import {
  ROLE_DESCRIPTIONS, ALL_ROLES, ROLE_PERMISSIONS, ALL_DEPARTMENTS,
  type UserRole, type Permission, type Department
} from '@/lib/permissions';

interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  department?: Department;
  custom_permissions?: Permission[];
  bio?: string;
  created_at: string;
}

/** Nhóm quyền hiển thị trong bảng phân quyền */
const PERMISSION_GROUPS: { label: string; perms: Permission[] }[] = [
  { label: 'Nội dung',    perms: ['content:view', 'content:create', 'content:edit', 'content:delete', 'content:publish'] },
  { label: 'Bài giảng',  perms: ['sermons:view', 'sermons:create', 'sermons:edit', 'sermons:delete'] },
  { label: 'Sự kiện',    perms: ['events:view', 'events:create', 'events:edit', 'events:delete'] },
  { label: 'Mục vụ',     perms: ['ministries:view', 'ministries:create', 'ministries:edit', 'ministries:delete'] },
  { label: 'Dưỡng linh', perms: ['devotionals:view', 'devotionals:create', 'devotionals:edit', 'devotionals:delete'] },
  { label: 'Thư viện',   perms: ['library:view', 'library:create', 'library:edit', 'library:delete'] },
  { label: 'Cầu nguyện', perms: ['prayers:view', 'prayers:review', 'prayers:delete'] },
  { label: 'Dâng hiến',  perms: ['donations:view', 'donations:manage'] },
  { label: 'Tín hữu',    perms: ['users:view', 'users:edit', 'users:delete', 'users:assign_role'] },
  { label: 'Hệ thống',   perms: ['stats:view', 'notifications:send', 'admin:access', 'admin:settings'] },
];

const PERM_LABELS: Partial<Record<Permission, string>> = {
  'content:view': 'Xem', 'content:create': 'Tạo', 'content:edit': 'Sửa',
  'content:delete': 'Xóa', 'content:publish': 'Xuất bản',
  'sermons:view': 'Xem', 'sermons:create': 'Tạo', 'sermons:edit': 'Sửa', 'sermons:delete': 'Xóa',
  'events:view': 'Xem', 'events:create': 'Tạo', 'events:edit': 'Sửa', 'events:delete': 'Xóa',
  'ministries:view': 'Xem', 'ministries:create': 'Tạo', 'ministries:edit': 'Sửa', 'ministries:delete': 'Xóa',
  'devotionals:view': 'Xem', 'devotionals:create': 'Tạo', 'devotionals:edit': 'Sửa', 'devotionals:delete': 'Xóa',
  'library:view': 'Xem', 'library:create': 'Tạo', 'library:edit': 'Sửa', 'library:delete': 'Xóa',
  'prayers:view': 'Xem', 'prayers:review': 'Duyệt', 'prayers:delete': 'Xóa',
  'donations:view': 'Xem', 'donations:manage': 'Quản lý',
  'users:view': 'Xem', 'users:edit': 'Sửa', 'users:delete': 'Xóa', 'users:assign_role': 'Phân quyền',
  'stats:view': 'Thống kê', 'notifications:send': 'Gửi TB',
  'admin:access': 'Vào Admin', 'admin:settings': 'Cài đặt',
};

export default function UserManager() {
  const { can, profile: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeView, setActiveView] = useState<'list' | 'permissions'>('list');
  const ITEMS_PER_PAGE = 15;

  const [toast, setToast] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  const canAssignRole = can('users:assign_role');
  const canEditUser   = can('users:edit');
  const canDeleteUser = can('users:delete');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to   = from + ITEMS_PER_PAGE - 1;
      const { data, count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      setProfiles(data || []);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (err: any) {  
      showToast('Lỗi khi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
   
  }, [currentPage]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const updateData: Record<string, any> = {  
        full_name: editing.full_name,
        username:  editing.username,
        email:     editing.email,
        bio:       editing.bio || '',
      };
      if (canAssignRole) {
        updateData.role = editing.role;
        updateData.department = editing.department || null;
        updateData.custom_permissions = editing.custom_permissions || [];
      }

      const { error } = await supabase.from('profiles').update(updateData).eq('id', editing.id);
      if (error) throw error;
      showToast('✅ Đã cập nhật thành công');
      setEditing(null);
      loadProfiles();
    } catch (err: any) {  
      showToast('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteUser) { showToast('⛔ Bạn không có quyền xóa hồ sơ tín hữu'); return; }
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ này? Tài khoản Auth gốc có thể vẫn tồn tại nhưng hồ sơ sẽ bị mất.')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      showToast('✅ Đã xóa hồ sơ');
      loadProfiles();
    } catch (err: any) {  
      showToast('Lỗi khi xóa: ' + err.message);
    }
  };

  const filteredProfiles = profiles.filter(p =>
    (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.email     || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.username  || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const rd = ROLE_DESCRIPTIONS[role as UserRole];
    if (!rd) return { color: '#aaa', bg: 'rgba(255,255,255,0.06)', label: role || 'Thành viên', icon: '🙏' };
    return rd;
  };

  /* ─── INPUT STYLE ─── */
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #333', background: '#0f1115', color: '#fff', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '0.9rem' };

  return (
    <div className="panel-card" style={{ maxWidth: '100%' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#48BCE1', color: '#fff',
          padding: '12px 24px', borderRadius: '8px', zIndex: 10000, fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      {/* ─── HEADER ─── */}
      <div className="panel-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3>Danh sách Tín hữu</h3>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '4px' }}>
            Quản lý thông tin và phân quyền người dùng.<br />
            <span style={{ color: '#F4CC30' }}>
              <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'text-top' }} />
              {' '}Lưu ý: Tín hữu phải tự đăng ký để tạo tài khoản bảo mật.
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '3px', gap: '2px' }}>
            {(['list', 'permissions'] as const).map(v => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 600,
                  background: activeView === v ? '#48BCE1' : 'transparent',
                  color:      activeView === v ? '#fff'    : '#888',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                {v === 'permissions' && <Shield size={13} />}
                {v === 'list' ? 'Danh sách' : 'Bảng quyền'}
              </button>
            ))}
          </div>
          <div className="panel-search">
            <Search size={14} />
            <input placeholder="Tìm theo tên, email..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ════════ VIEW: DANH SÁCH ════════ */}
      {activeView === 'list' && (
        <>
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Email / Tên đăng nhập</th>
                  <th>Vai trò</th>
                  <th>Ngày tham gia</th>
                  {(canEditUser || canDeleteUser) && <th style={{ textAlign: 'right' }}>Hành động</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Đang tải...</td></tr>
                ) : filteredProfiles.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Không tìm thấy người dùng nào</td></tr>
                ) : filteredProfiles.map(u => {
                  const rb = getRoleBadge(u.role);
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-name-cell">
                          <div className="user-avatar-sm">
                            {u.full_name ? u.full_name[0].toUpperCase() : <UserCircle size={18} />}
                          </div>
                          {u.full_name || '(Chưa đặt tên)'}
                          {isSelf && <span style={{ fontSize: '0.7rem', color: '#48BCE1', marginLeft: '6px' }}>(Bạn)</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: '#fff' }}>{u.email || '—'}</span>
                          <span style={{ color: '#888', fontSize: '0.8rem' }}>{u.username || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px', borderRadius: '12px',
                          fontSize: '0.8rem', fontWeight: 'bold',
                          backgroundColor: rb.bg, color: rb.color,
                        }}>
                          {rb.icon} {rb.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      {(canEditUser || canDeleteUser) && (
                        <td style={{ textAlign: 'right' }}>
                          {canEditUser && (
                            <button className="icon-btn" onClick={() => setEditing(u)} title="Sửa"
                              style={{ color: '#48BCE1', marginRight: '8px' }}>
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDeleteUser && !isSelf && (
                            <button className="icon-btn" onClick={() => handleDelete(u.id)} title="Xóa"
                              style={{ color: '#F12D5C' }}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          )}
        </>
      )}

      {/* ════════ VIEW: BẢNG PHÂN QUYỀN ════════ */}
      {activeView === 'permissions' && (
        <div style={{ padding: '1rem 0' }}>
          {/* Role summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {ALL_ROLES.map(role => {
              const rd = ROLE_DESCRIPTIONS[role];
              const permCount = ROLE_PERMISSIONS[role].length;
              return (
                <div key={role} style={{
                  padding: '16px', borderRadius: '12px',
                  border: `1px solid ${rd.color}30`, background: rd.bg,
                  display: 'flex', flexDirection: 'column', gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{rd.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: rd.color, fontSize: '0.95rem' }}>{rd.label}</p>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#888' }}>{permCount} quyền</p>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#aaa', lineHeight: 1.5 }}>{rd.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Permission matrix table */}
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={14} style={{ color: '#48BCE1' }} />
              <span style={{ fontSize: '0.85rem', color: '#ccc', fontWeight: 600 }}>Bảng quyền chi tiết theo vai trò</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 600, minWidth: '120px' }}>Nhóm</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 600, minWidth: '100px' }}>Quyền</th>
                    {ALL_ROLES.map(role => (
                      <th key={role} style={{
                        padding: '10px 16px', textAlign: 'center', fontWeight: 700, minWidth: '130px',
                        color: ROLE_DESCRIPTIONS[role].color,
                      }}>
                        {ROLE_DESCRIPTIONS[role].icon} {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_GROUPS.map((group, gi) =>
                    group.perms.map((perm, pi) => (
                      <tr key={perm} style={{
                        background: gi % 2 === 0
                          ? (pi % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)')
                          : (pi % 2 === 0 ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.1)'),
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <td style={{ padding: '8px 16px', color: '#888', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {pi === 0 ? group.label : ''}
                        </td>
                        <td style={{ padding: '8px 16px', color: '#ccc' }}>{PERM_LABELS[perm] || perm}</td>
                        {ALL_ROLES.map(role => (
                          <td key={role} style={{ padding: '8px 16px', textAlign: 'center' }}>
                            {ROLE_PERMISSIONS[role].includes(perm)
                              ? <span style={{ color: '#10b981', fontSize: '1.1rem' }}>✓</span>
                              : <span style={{ color: '#333' }}>—</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Sửa & Phân Quyền ─── */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setEditing(null)}>
          <div style={{ background: '#1a1d24', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} /> Chỉnh sửa hồ sơ
              </h3>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Họ và tên</label>
                <input type="text" value={editing.full_name || ''} style={inputStyle}
                  onChange={e => setEditing({ ...editing, full_name: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Tên đăng nhập (Username)</label>
                <input type="text" value={editing.username || ''} style={inputStyle}
                  onChange={e => setEditing({ ...editing, username: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={editing.email || ''} style={inputStyle}
                  onChange={e => setEditing({ ...editing, email: e.target.value })} />
              </div>

              {/* Phân quyền — chỉ hiện nếu có quyền assign_role */}
              {canAssignRole ? (
                <div>
                  <label style={labelStyle}>
                    <Shield size={13} style={{ display: 'inline', marginRight: '4px', color: '#48BCE1', verticalAlign: 'middle' }} />
                    Vai trò & Phân quyền
                  </label>
                  <select value={editing.role || 'Thành viên'} style={inputStyle}
                    onChange={e => {
                      const newRole = e.target.value;
                      setEditing({ 
                        ...editing, 
                        role: newRole,
                        department: newRole === 'Trưởng ban' ? (editing.department || 'Ban điều hành') : undefined,
                        custom_permissions: newRole === 'Trưởng ban' ? (editing.custom_permissions || []) : undefined
                      });
                    }}>
                    {ALL_ROLES.map(r => (
                      <option key={r} value={r}>
                        {ROLE_DESCRIPTIONS[r as UserRole].icon} {r}
                      </option>
                    ))}
                  </select>
                  {editing.role && ROLE_DESCRIPTIONS[editing.role as UserRole] && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: ROLE_DESCRIPTIONS[editing.role as UserRole].color }}>
                      {ROLE_DESCRIPTIONS[editing.role as UserRole].desc}
                    </p>
                  )}

                  {editing.role === 'Trưởng ban' && (
                    <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <label style={labelStyle}>Ban phụ trách</label>
                      <select value={editing.department || 'Ban điều hành'} style={inputStyle}
                        onChange={e => setEditing({ ...editing, department: e.target.value as Department })}>
                        {ALL_DEPARTMENTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>

                      <label style={{ ...labelStyle, marginTop: '16px' }}>Quyền hạn tùy chỉnh (Giới hạn tính năng)</label>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {PERMISSION_GROUPS.map(group => {
                          if (group.label === 'Hệ thống') return null; // Không cho Trưởng ban quyền Hệ thống
                          return (
                            <div key={group.label}>
                              <strong style={{ fontSize: '0.8rem', color: '#48BCE1' }}>{group.label}</strong>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
                                {group.perms.map(p => (
                                  <label key={p} style={{ fontSize: '0.8rem', color: '#ccc', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                    <input type="checkbox" 
                                      checked={editing.custom_permissions?.includes(p) || false}
                                      onChange={e => {
                                        const perms = editing.custom_permissions || [];
                                        if (e.target.checked) {
                                          setEditing({ ...editing, custom_permissions: [...perms, p] });
                                        } else {
                                          setEditing({ ...editing, custom_permissions: perms.filter(x => x !== p) });
                                        }
                                      }}
                                    />
                                    {PERM_LABELS[p] || p}
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #333', background: 'rgba(0,0,0,0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>
                    <Shield size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    Vai trò: <strong style={{ color: '#aaa' }}>{editing.role || 'Thành viên'}</strong>
                    <br />
                    <span style={{ fontSize: '0.72rem', color: '#555' }}>Chỉ Quản trị viên mới có thể thay đổi vai trò</span>
                  </p>
                </div>
              )}

              <div>
                <label style={labelStyle}>Giới thiệu (Bio)</label>
                <textarea rows={3} value={editing.bio || ''} style={{ ...inputStyle, resize: 'vertical' }}
                  onChange={e => setEditing({ ...editing, bio: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setEditing(null)}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: '#48BCE1', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
