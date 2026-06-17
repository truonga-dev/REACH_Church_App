'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, Search, Trash2, Heart, Clock, CheckCircle, Shield, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { updatePrayerStatus, deletePrayerRequest } from '@/lib/prayers';
import {
  canClosePrayer,
  canMarkAnswered,
  canReviewPrayer,
  getPrayerStatusConfig,
  isPrayerActive,
  isPrayerAnswered,
  matchesPrayerStatusFilter,
  normalizePrayerStatus,
  prayerBody,
  prayerCategoryLabel,
  prayerIntercessionCount,
} from '@/lib/prayer-helpers';
import type { Prayer, PrayerStatus } from '@/types';
import Pagination from '@/components/ui/Pagination';

function StatusIcon({ status }: { status: string }) {
  const normalized = normalizePrayerStatus(status);
  if (normalized === 'answered') return <CheckCircle size={13} />;
  if (normalized === 'reviewed') return <Eye size={13} />;
  if (normalized === 'closed') return <Shield size={13} />;
  return <Clock size={13} />;
}

export default function AdminPrayerReviewManager() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [toast, setToast] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadPrayers = async () => {
    setLoading(true);
    try {
      const { data, count, error } = await supabase
        .from('prayers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
      if (!error) {
        setPrayers(data || []);
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      } else {
        setPrayers([]);
        setTotalPages(1);
      }
    } catch {
      setPrayers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPrayers();
    setSelectedIds([]);
  }, [currentPage]);

  const filteredPrayers = prayers.filter((p) => {
    if (!matchesPrayerStatusFilter(p, selectedStatus)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const body = prayerBody(p).toLowerCase();
      if (!p.title?.toLowerCase().includes(q) && !body.includes(q)) return false;
    }
    return true;
  });

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleUpdateStatus = async (id: string, newStatus: PrayerStatus) => {
    try {
      const updated = await updatePrayerStatus(id, newStatus);
      if (updated) {
        setPrayers(prayers.map((p) => (p.id === id ? { ...p, ...updated } : p)));
        showToast('Đã cập nhật trạng thái');
      }
    } catch {
      showToast('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa lời cầu nguyện này?')) {
      try {
        const success = await deletePrayerRequest(id);
        if (success) {
          setPrayers(prayers.filter((p) => p.id !== id));
          setSelectedIds(selectedIds.filter((i) => i !== id));
          showToast('Đã xóa thành công');
        }
      } catch {
        showToast('Lỗi khi xóa');
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredPrayers.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleBulkUpdateStatus = async (newStatus: PrayerStatus) => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    try {
      setLoading(true);
      await Promise.all(selectedIds.map((id) => updatePrayerStatus(id, newStatus)));
      await loadPrayers();
      setSelectedIds([]);
      showToast(`Đã cập nhật ${count} mục`);
    } catch {
      showToast('Lỗi cập nhật hàng loạt');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (confirm(`Bạn có chắc muốn xóa ${count} mục đã chọn?`)) {
      try {
        setLoading(true);
        await Promise.all(selectedIds.map((id) => deletePrayerRequest(id)));
        await loadPrayers();
        setSelectedIds([]);
        showToast(`Đã xóa ${count} mục`);
      } catch {
        showToast('Lỗi khi xóa hàng loạt');
      } finally {
        setLoading(false);
      }
    }
  };

  const activeCount = prayers.filter((p) => isPrayerActive(p.status)).length;
  const answeredCount = prayers.filter((p) => isPrayerAnswered(p.status)).length;
  const pendingReviewCount = prayers.filter((p) => canReviewPrayer(p.status)).length;

  const bulkBtnStyle = (color: string, bg: string) => ({
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: '0.75rem',
    fontWeight: 600,
    background: bg,
    color,
    border: 'none',
    cursor: 'pointer',
  });

  return (
    <div>
      {toast && (
        <div className="toast info" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <div className="toast-body">
            <p className="toast-msg">{toast}</p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Duyệt Cầu Nguyện
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
          Xem xét và phê duyệt các lời cầu nguyện từ hội viên
        </p>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card yellow">
          <div className="stat-icon yellow"><Clock size={22} /></div>
          <div className="stat-info">
            <span className="stat-label">Chờ duyệt</span>
            <span className="stat-value">{pendingReviewCount}</span>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><Heart size={22} /></div>
          <div className="stat-info">
            <span className="stat-label">Đang cầu nguyện</span>
            <span className="stat-value">{activeCount}</span>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><CheckCircle size={22} /></div>
          <div className="stat-info">
            <span className="stat-label">Đã nhậm / đóng</span>
            <span className="stat-value">{answeredCount}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="panel-search" style={{ flex: 1, minWidth: 200, margin: 0 }}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="role-select"
          style={{ padding: '0 0.85rem', height: 36, borderRadius: 8 }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang cầu nguyện</option>
          <option value="pending">Chờ duyệt</option>
          <option value="reviewed">Đã duyệt</option>
          <option value="answered">Đã nhậm</option>
          <option value="closed">Đã đóng</option>
        </select>
      </div>

      {selectedIds.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem',
          background: 'rgba(72,188,225,0.1)', border: '1px solid rgba(72,188,225,0.3)',
          borderRadius: 8, marginBottom: '1rem', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
            Đã chọn {selectedIds.length} mục
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              style={bulkBtnStyle('var(--primary)', 'rgba(72,188,225,0.2)')}
              onClick={() => handleBulkUpdateStatus('reviewed')}
            >
              <Eye size={12} style={{ display: 'inline', marginRight: 4 }} /> Duyệt hàng loạt
            </button>
            <button
              style={bulkBtnStyle('var(--success)', 'rgba(16,185,129,0.2)')}
              onClick={() => handleBulkUpdateStatus('answered')}
            >
              <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} /> Đánh dấu nhậm lời
            </button>
            <button
              style={bulkBtnStyle('#94a3b8', 'rgba(100,116,139,0.2)')}
              onClick={() => handleBulkUpdateStatus('closed')}
            >
              <Check size={12} style={{ display: 'inline', marginRight: 4 }} /> Đóng hàng loạt
            </button>
            <button
              style={bulkBtnStyle('var(--danger)', 'rgba(239,68,68,0.2)')}
              onClick={handleBulkDelete}
            >
              <Trash2 size={12} style={{ display: 'inline', marginRight: 4 }} /> Xóa
            </button>
          </div>
        </div>
      )}

      {!loading && filteredPrayers.length > 0 && (
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={selectedIds.length === filteredPrayers.length && filteredPrayers.length > 0}
            onChange={handleSelectAll}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chọn tất cả trên trang này</span>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : filteredPrayers.length === 0 ? (
        <div className="section-card">
          <div className="empty-state">
            <div className="empty-state-icon"><Heart size={24} /></div>
            <span>Không có lời cầu nguyện nào</span>
            <p>Các lời cầu nguyện sẽ xuất hiện ở đây sau khi hội viên gửi.</p>
          </div>
        </div>
      ) : (
        <div className="prayer-grid">
          {filteredPrayers.map((prayer) => {
            const statusCfg = getPrayerStatusConfig(prayer.status);
            const normalized = normalizePrayerStatus(prayer.status);
            return (
              <div
                key={prayer.id}
                className={`prayer-admin-card${isPrayerAnswered(prayer.status) ? ' completed' : ''}`}
                style={selectedIds.includes(prayer.id) ? { borderColor: 'var(--primary)' } : {}}
              >
                <div className="prayer-card-status" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(prayer.id)}
                      onChange={() => handleSelectOne(prayer.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span className="prayer-status-badge" style={{ color: statusCfg.color }}>
                      <StatusIcon status={prayer.status} />
                      {statusCfg.label}
                    </span>
                  </div>
                  <span className="prayer-card-time">
                    {new Date(prayer.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <h4>{prayer.title}</h4>
                <p>{prayerBody(prayer)}</p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
                    background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)',
                  }}>
                    {prayerCategoryLabel(prayer)}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
                    background: 'rgba(72,188,225,0.1)', color: 'var(--primary)',
                  }}>
                    ♥ {prayerIntercessionCount(prayer)} cầu thay
                  </span>
                  {prayer.is_private && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
                      background: 'rgba(239,68,68,0.1)', color: 'var(--danger)',
                    }}>
                      🔒 Riêng tư
                    </span>
                  )}
                </div>

                <div className="prayer-card-actions">
                  {canReviewPrayer(prayer.status) && (
                    <button
                      className="btn-prayer-action complete"
                      onClick={() => handleUpdateStatus(prayer.id, 'reviewed')}
                    >
                      <Eye size={14} /> Duyệt
                    </button>
                  )}
                  {canMarkAnswered(prayer.status) && (
                    <button
                      className="btn-prayer-action complete"
                      onClick={() => handleUpdateStatus(prayer.id, 'answered')}
                    >
                      <CheckCircle size={14} /> Đã nhậm
                    </button>
                  )}
                  {canClosePrayer(prayer.status) && normalized !== 'closed' && (
                    <button
                      className="btn-prayer-action complete"
                      onClick={() => handleUpdateStatus(prayer.id, 'closed')}
                    >
                      <Check size={14} /> Đóng
                    </button>
                  )}
                  <button
                    className="btn-prayer-action del"
                    onClick={() => handleDelete(prayer.id)}
                    title="Xóa"
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && filteredPrayers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
