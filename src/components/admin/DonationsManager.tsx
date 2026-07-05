'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2, Search, Coins, TrendingUp, Calendar, CreditCard, Download,
  BarChart3, LayoutDashboard, List, Plus, X, CheckCircle, User, Edit2, Trash2,
  Copy, Clock, Image as ImageIcon, ThumbsUp,
} from 'lucide-react';
import {
  fetchDonationsPage,
  fetchDonationsForReport,
  fetchDonationsForReconciliation,
  fetchOverduePendingDonations,
  createAdminDonation,
  updateDonation,
  updateDonationStatus,
  deleteDonation,
  adminApproveDonation,
  getDonorDisplayName,
  type Donation,
  type DonationStatus,
  type AdminDonationInput,
} from '@/lib/donations';
import {
  buildExportRows,
  findDuplicateTransactionIds,
  getDuplicateTxIdSet,
  type DonationExportRow,
} from '@/lib/donations-export';
import DonationCharts, { buildCategoryBreakdown } from '@/components/admin/DonationCharts';
import DonationExportSheet from '@/components/admin/DonationExportSheet';
import Pagination from '@/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import './DonationsManager.css';

type DonationSection = 'overview' | 'report' | 'list';

const ITEMS_PER_PAGE = 15;

const CATEGORY_LABELS: Record<string, string> = {
  tithe: 'Một phần mười',
  offering: 'Dâng hiến',
  missions: 'Truyền giáo',
  building: 'Xây dựng',
  other: 'Khác',
};

const CATEGORY_COLORS: Record<string, string> = {
  tithe: '#48bce1',
  offering: '#10b981',
  missions: '#f4cc30',
  building: '#8b5cf6',
  other: '#94a3b8',
};

const PAYMENT_METHODS = ['Vietcombank', 'Momo', 'Tiền mặt', 'Chuyển khoản khác'];

const STATUS_LABELS: Record<DonationStatus, string> = {
  pending: 'Chờ xử lý',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
};

const SECTION_TABS: { id: DonationSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'report', label: 'Báo cáo', icon: BarChart3 },
  { id: 'list', label: 'Danh sách', icon: List },
];

const MONTH_LABELS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const emptyForm = (): AdminDonationInput => ({
  amount: 0,
  category: 'offering',
  payment_method: 'Vietcombank',
  transaction_id: '',
  donor_name: '',
  admin_notes: '',
  notes: '',
  status: 'completed',
});

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

function donationToForm(d: Donation): AdminDonationInput {
  return {
    amount: Number(d.amount),
    category: d.category,
    payment_method: d.payment_method || 'Vietcombank',
    transaction_id: d.transaction_id || '',
    donor_name: d.donor_name || getDonorDisplayName(d),
    admin_notes: d.admin_notes || '',
    notes: d.notes || '',
    status: d.status,
  };
}

function buildMonthlyReport(donations: Donation[], year: number) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: MONTH_LABELS[i],
    count: 0,
    total: 0,
  }));

  for (const d of donations) {
    const date = new Date(d.created_at);
    if (date.getFullYear() !== year) continue;
    months[date.getMonth()].count += 1;
    months[date.getMonth()].total += Number(d.amount) || 0;
  }

  return months;
}

function buildYearlyReport(donations: Donation[]) {
  const map = new Map<number, { count: number; total: number }>();
  for (const d of donations) {
    const year = new Date(d.created_at).getFullYear();
    const entry = map.get(year) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(d.amount) || 0;
    map.set(year, entry);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, data]) => ({ year, ...data }));
}

export default function AdminDonationsManager() {
  const { can, user } = useAuth();
  const canManage = can('donations:manage');

  const [donations, setDonations] = useState<Donation[]>([]);
  const [reportDonations, setReportDonations] = useState<Donation[]>([]);
  const [overduePending, setOverduePending] = useState<Donation[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<Map<string, Donation[]>>(new Map());
  const [duplicateTxIds, setDuplicateTxIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<DonationSection>('overview');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminDonationInput>(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportRows, setExportRows] = useState<DonationExportRow[]>([]);
  const [receiptModal, setReceiptModal] = useState<string | null>(null); // URL ảnh biên lai
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({ category: selectedCategory, search: searchQuery, status: selectedStatus }),
    [selectedCategory, searchQuery, selectedStatus],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const { data, count } = await fetchDonationsPage(ITEMS_PER_PAGE, offset, filters);
      setDonations(data);
      setTotalCount(count);
    } catch {
      showToast('Lỗi khi tải danh sách dâng hiến');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, showToast]);

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const data = await fetchDonationsForReport(reportYear, filters);
      setReportDonations(data);
    } catch {
      setReportDonations([]);
    } finally {
      setReportLoading(false);
    }
  }, [reportYear, filters]);

  const loadPhase3Ops = useCallback(async () => {
    const [reconData, overdue] = await Promise.all([
      fetchDonationsForReconciliation(),
      fetchOverduePendingDonations(7),
    ]);
    const dupes = findDuplicateTransactionIds(reconData);
    setDuplicateGroups(dupes);
    setDuplicateTxIds(getDuplicateTxIdSet(dupes));
    setOverduePending(overdue);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (activeSection === 'overview' || activeSection === 'report') {
      void loadReport();
    }
  }, [activeSection, loadReport]);

  useEffect(() => {
    if (activeSection === 'overview') {
      void loadPhase3Ops();
    }
  }, [activeSection, loadPhase3Ops]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
    setActiveSection('list');
  };

  const openEditForm = (donation: Donation) => {
    setEditingId(donation.id);
    setForm(donationToForm(donation));
    setShowForm(true);
    setActiveSection('list');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    const payload: AdminDonationInput = {
      ...form,
      amount: Number(form.amount),
      transaction_id: form.transaction_id?.trim() || undefined,
      donor_name: form.donor_name?.trim() || undefined,
      admin_notes: form.admin_notes?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    };

    setSaving(true);
    let result: Donation | null = null;

    if (editingId) {
      result = await updateDonation(editingId, payload);
    } else {
      result = await createAdminDonation(payload);
    }
    setSaving(false);

    if (result) {
      showToast(editingId ? 'Đã cập nhật khoản dâng hiến' : 'Đã ghi nhận khoản dâng hiến');
      closeForm();
      void loadList();
      void loadReport();
      void loadPhase3Ops();
    } else {
      showToast('Không lưu được. Kiểm tra quyền admin và schema DB.');
    }
  };

  const handleStatusChange = async (id: string, status: DonationStatus) => {
    setStatusUpdating(id);
    const updated = await updateDonationStatus(id, status);
    setStatusUpdating(null);
    if (updated) {
      showToast(`Đã cập nhật: ${STATUS_LABELS[status]}`);
      void loadList();
      void loadReport();
      void loadPhase3Ops();
    } else {
      showToast('Không cập nhật được trạng thái');
    }
  };

  const handleDelete = async (donation: Donation) => {
    const name = getDonorDisplayName(donation);
    if (!window.confirm(`Xóa khoản dâng hiến của "${name}" (${formatVND(Number(donation.amount))})?`)) {
      return;
    }
    setStatusUpdating(donation.id);
    const ok = await deleteDonation(donation.id);
    setStatusUpdating(null);
    if (ok) {
      if (editingId === donation.id) closeForm();
      showToast('Đã xóa khoản dâng hiến');
      if (donations.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        void loadList();
      }
      void loadReport();
      void loadPhase3Ops();
    } else {
      showToast('Không xóa được. Kiểm tra quyền admin.');
    }
  };

  const openExportSheet = async () => {
    setShowExport(true);
    setExportLoading(true);
    try {
      const { data } = await fetchDonationsPage(500, 0, filters);
      if (data.length === 0) {
        setExportRows([]);
        showToast('Không có dữ liệu để xuất');
      } else {
        const dupes = findDuplicateTransactionIds(data);
        const dupIds = getDuplicateTxIdSet(dupes);
        setExportRows(buildExportRows(data, CATEGORY_LABELS, STATUS_LABELS, dupIds));
      }
    } catch {
      setExportRows([]);
      showToast('Lỗi khi tải dữ liệu xuất');
    } finally {
      setExportLoading(false);
    }
  };

  const duplicateList = [...duplicateGroups.values()];

  const monthlyReport = buildMonthlyReport(reportDonations, reportYear);
  const yearlyReport = buildYearlyReport(reportDonations);
  const categoryBreakdown = buildCategoryBreakdown(reportDonations, CATEGORY_LABELS, CATEGORY_COLORS);
  const yearTotal = monthlyReport.reduce((sum, m) => sum + m.total, 0);
  const yearCount = monthlyReport.reduce((sum, m) => sum + m.count, 0);

  const overviewTotal = reportDonations.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const completedCount = reportDonations.filter((d) => d.status === 'completed').length;
  const pendingCount = reportDonations.filter((d) => d.status === 'pending').length;

  const availableYears = [...new Set([
    ...reportDonations.map((d) => new Date(d.created_at).getFullYear()),
    new Date().getFullYear(),
  ])].sort((a, b) => b - a);

  const formTitle = editingId ? 'Sửa khoản dâng hiến' : 'Ghi nhận khoản dâng hiến thủ công';
  const formSubmitLabel = editingId ? 'Lưu thay đổi' : 'Lưu khoản dâng hiến';

  return (
    <div className="donations-manager">
      {toast && (
        <div className="toast info" style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999 }}>
          <div className="toast-body">
            <p className="toast-msg">{toast}</p>
          </div>
        </div>
      )}

      <div className="donations-page-header">
        <h2 className="donations-section-title">Quản lý Dâng hiến</h2>
        <p className="donations-section-desc">
          Ghi nhận, sửa, xóa, duyệt và xem báo cáo dâng hiến
        </p>
      </div>

      <div className="donations-sticky-bar">
        <div className="donations-subtabs" role="tablist" aria-label="Mục dâng hiến">
          {SECTION_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeSection === id}
              className={`donations-subtab${activeSection === id ? ' active' : ''}`}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="donations-toolbar">
          <div className="donations-toolbar-filters">
            <div className="panel-search" style={{ flex: 1, minWidth: 200, margin: 0 }}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Tìm người dâng, mã GD, ghi chú..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="role-select"
              style={{ padding: '0 0.85rem', height: 36, borderRadius: 8 }}
            >
              <option value="all">Tất cả mục đích</option>
              <option value="tithe">Một phần mười</option>
              <option value="offering">Dâng hiến tự nguyện</option>
              <option value="missions">Truyền giáo</option>
              <option value="building">Xây dựng</option>
              <option value="other">Khác</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="role-select"
              style={{ padding: '0 0.85rem', height: 36, borderRadius: 8 }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="failed">Thất bại</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            {(activeSection === 'report' || activeSection === 'overview') && (
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="role-select"
                style={{ padding: '0 0.85rem', height: 36, borderRadius: 8 }}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            )}
          </div>
          {canManage && (
            <button
              type="button"
              className="donations-add-btn"
              onClick={() => (showForm ? closeForm() : openCreateForm())}
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? 'Đóng form' : 'Thêm khoản'}
            </button>
          )}
          <button type="button" className="donations-export-btn" onClick={() => void openExportSheet()}>
            <Download size={14} /> Xuất báo cáo
          </button>
        </div>
      </div>

      {showForm && canManage && (
        <div className="donations-form-card">
          <h3 style={{ color: '#fff', fontSize: '1rem', margin: '0 0 1rem', fontWeight: 700 }}>
            {formTitle}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="donations-form-grid">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Số tiền (VND) *</label>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  required
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Mục đích *</label>
                <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="tithe">Một phần mười</option>
                  <option value="offering">Dâng hiến tự nguyện</option>
                  <option value="missions">Truyền giáo</option>
                  <option value="building">Xây dựng</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phương thức</label>
                <select className="form-select" value={form.payment_method || ''} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Mã giao dịch</label>
                <input className="form-input" value={form.transaction_id || ''} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Tên người dâng</label>
                <input className="form-input" value={form.donor_name || ''} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Trạng thái</label>
                <select className="form-select" value={form.status || 'completed'} onChange={(e) => setForm({ ...form, status: e.target.value as DonationStatus })}>
                  <option value="completed">Hoàn thành</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="failed">Thất bại</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Ghi chú công khai</label>
              <input className="form-input" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Ghi chú nội bộ (admin)</label>
              <input className="form-input" value={form.admin_notes || ''} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} />
            </div>
            <div className="donations-form-actions">
              <button type="submit" className="btn-submit" disabled={saving}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={16} />}
                {saving ? 'Đang lưu...' : formSubmitLabel}
              </button>
              <button type="button" className="btn-secondary" onClick={closeForm}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {activeSection === 'overview' && (
        reportLoading ? (
          <div className="empty-state">
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
          </div>
        ) : (
          <>
            {(overduePending.length > 0 || duplicateList.length > 0) && (
              <div className="donations-ops-alerts">
                {overduePending.length > 0 && (
                  <div className="donations-alert warning">
                    <Clock size={18} />
                    <div>
                      <strong>{overduePending.length} khoản chờ xử lý quá 7 ngày</strong>
                      <p>
                        {overduePending.slice(0, 3).map((d) => getDonorDisplayName(d)).join(' · ')}
                        {overduePending.length > 3 ? ` · +${overduePending.length - 3} khác` : ''}
                      </p>
                      {canManage && (
                        <button type="button" className="donations-alert-link" onClick={() => { setSelectedStatus('pending'); setActiveSection('list'); }}>
                          Xem danh sách chờ duyệt →
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {duplicateList.length > 0 && (
                  <div className="donations-alert danger">
                    <Copy size={18} />
                    <div>
                      <strong>{duplicateList.length} mã giao dịch trùng lặp</strong>
                      <p>
                        {duplicateList.slice(0, 2).map((group) => (
                          <span key={group[0].transaction_id} className="donations-dup-chip">
                            {group[0].transaction_id} ({group.length} lần)
                          </span>
                        ))}
                      </p>
                      <button type="button" className="donations-alert-link" onClick={() => setActiveSection('list')}>
                        Kiểm tra trong danh sách →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
              <div className="stat-card green">
                <div className="stat-icon green"><Coins size={22} /></div>
                <div className="stat-info">
                  <span className="stat-label">Tổng năm {reportYear}</span>
                  <span className="stat-value" style={{ fontSize: '1.2rem' }}>{formatVND(overviewTotal)}</span>
                </div>
              </div>
              <div className="stat-card blue">
                <div className="stat-icon blue"><TrendingUp size={22} /></div>
                <div className="stat-info">
                  <span className="stat-label">Giao dịch</span>
                  <span className="stat-value">{reportDonations.length}</span>
                </div>
              </div>
              <div className="stat-card yellow">
                <div className="stat-icon yellow"><CreditCard size={22} /></div>
                <div className="stat-info">
                  <span className="stat-label">Chờ xử lý</span>
                  <span className="stat-value">{pendingCount}</span>
                </div>
              </div>
              <div className="stat-card purple">
                <div className="stat-icon purple" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <CheckCircle size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Hoàn thành</span>
                  <span className="stat-value">{completedCount}</span>
                </div>
              </div>
            </div>
            <div className="section-card">
              <DonationCharts
                monthlyData={monthlyReport}
                categoryData={categoryBreakdown}
                year={reportYear}
                formatVND={formatVND}
              />
            </div>
          </>
        )
      )}

      {activeSection === 'report' && (
        <div className="section-card">
          <div className="section-card-header">
            <h3><BarChart3 size={16} /> Báo cáo — {reportYear}</h3>
            <span className="panel-card-count">{yearCount} giao dịch</span>
          </div>
          {reportLoading ? (
            <div className="empty-state">
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            </div>
          ) : (
            <>
              <DonationCharts
                monthlyData={monthlyReport}
                categoryData={categoryBreakdown}
                year={reportYear}
                formatVND={formatVND}
              />
              <div style={{ padding: '0 1.25rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Tháng</th><th>GD</th><th>Tổng</th></tr>
                    </thead>
                    <tbody>
                      {monthlyReport.map((row) => (
                        <tr key={row.month} style={row.count === 0 ? { opacity: 0.45 } : undefined}>
                          <td>{row.label}</td>
                          <td>{row.count}</td>
                          <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatVND(row.total)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ fontWeight: 700 }}>Tổng {reportYear}</td>
                        <td style={{ fontWeight: 700 }}>{yearCount}</td>
                        <td style={{ fontWeight: 800, color: 'var(--success)' }}>{formatVND(yearTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Năm</th><th>GD</th><th>Tổng</th></tr>
                    </thead>
                    <tbody>
                      {yearlyReport.map((row) => (
                        <tr key={row.year}>
                          <td>{row.year}</td>
                          <td>{row.count}</td>
                          <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatVND(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeSection === 'list' && (
        <div className="section-card">
          <div className="section-card-header">
            <h3><Calendar size={16} /> Danh sách dâng hiến</h3>
            <span className="panel-card-count">{totalCount} giao dịch</span>
          </div>
          {loading ? (
            <div className="empty-state">
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            </div>
          ) : donations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Coins size={24} /></div>
              <span>Chưa có dữ liệu</span>
              <p>Nhấn &quot;Thêm khoản&quot; để ghi nhận chuyển khoản.</p>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ngày</th>
                      <th>Người dâng</th>
                      <th>Mục đích</th>
                      <th>Số tiền</th>
                      <th>PT</th>
                      <th>Mã GD</th>
                      <th>TT</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((donation) => {
                      const isDup = duplicateTxIds.has(donation.id);
                      return (
                      <tr
                        key={donation.id}
                        className={isDup ? 'donations-row-dup' : undefined}
                        style={editingId === donation.id ? { background: 'rgba(72,188,225,0.06)' } : undefined}
                      >
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {new Date(donation.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={13} style={{ color: 'var(--primary)' }} />
                            {getDonorDisplayName(donation)}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                            background: `${CATEGORY_COLORS[donation.category] || '#94a3b8'}18`,
                            color: CATEGORY_COLORS[donation.category] || '#94a3b8',
                          }}>
                            {CATEGORY_LABELS[donation.category] || donation.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                          {formatVND(Number(donation.amount))}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{donation.payment_method || '—'}</td>
                        <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: isDup ? '#f59e0b' : 'var(--text-muted)' }}>
                          {donation.transaction_id || '—'}
                          {isDup && <span className="donations-dup-badge" title="Mã GD trùng">!</span>}
                        </td>
                        <td>
                          <span className={donation.status === 'completed' ? 'data-item-badge badge-published' : 'data-item-badge badge-draft'}>
                            {STATUS_LABELS[donation.status]}
                          </span>
                        </td>
                        <td>
                          {canManage ? (
                          <div className="donations-row-actions">
                            <button type="button" className="donations-action-btn edit" disabled={statusUpdating === donation.id} onClick={() => openEditForm(donation)} title="Sửa">
                              <Edit2 size={12} />
                            </button>
                            <button type="button" className="donations-action-btn delete" disabled={statusUpdating === donation.id} onClick={() => void handleDelete(donation)} title="Xóa">
                              <Trash2 size={12} />
                            </button>
                            {donation.receipt_image_url && (
                              <button
                                type="button"
                                className="donations-action-btn"
                                style={{ color: '#48bce1', borderColor: 'rgba(72,188,225,0.3)' }}
                                onClick={() => setReceiptModal(donation.receipt_image_url!)}
                                title="Xem biên lai"
                              >
                                <ImageIcon size={12} />
                              </button>
                            )}
                            {donation.status === 'pending' && (
                              <button
                                type="button"
                                className="donations-action-btn approve"
                                disabled={statusUpdating === donation.id || approvingId === donation.id}
                                onClick={async () => {
                                  setApprovingId(donation.id);
                                  const updated = await adminApproveDonation(donation.id, user?.id ?? '');
                                  if (updated) {
                                    setDonations(prev => prev.map(d => d.id === donation.id ? { ...d, status: 'completed' } : d));
                                    showToast('✅ Đã xác nhận dâng hiến!');
                                  }
                                  setApprovingId(null);
                                }}
                              >
                                {approvingId === donation.id ? <Loader2 size={11} className="spin" /> : <ThumbsUp size={11} />}
                                {approvingId !== donation.id && ' Duyệt'}
                              </button>
                            )}
                          </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chỉ xem</span>
                          )}
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      )}

      <DonationExportSheet
        open={showExport}
        loading={exportLoading}
        rows={exportRows}
        title="Báo cáo Dâng hiến — REACH Church"
        subtitle={`${exportRows.length} dòng · Lọc: ${selectedCategory !== 'all' ? CATEGORY_LABELS[selectedCategory] : 'Tất cả mục đích'} · ${selectedStatus !== 'all' ? STATUS_LABELS[selectedStatus as DonationStatus] : 'Tất cả TT'}`}
        formatVND={formatVND}
        onClose={() => setShowExport(false)}
      />

      {/* Receipt Image Modal */}
      {receiptModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setReceiptModal(null)}
        >
          <div
            style={{ position: 'relative', maxWidth: 480, width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setReceiptModal(null)}
              style={{
                position: 'absolute', top: -16, right: -16, zIndex: 1,
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: 'white', fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
            { }
            <img
              src={receiptModal}
              alt="Biên lai chuyển khoản"
              style={{ width: '100%', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            />
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12 }}>
              Nhấp bên ngoài để đóng
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
