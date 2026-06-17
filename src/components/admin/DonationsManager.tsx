'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, Coins, TrendingUp, Calendar, CreditCard, Download, BarChart3 } from 'lucide-react';
import { fetchAllDonations } from '@/lib/donations';

interface Donation {
  id: string;
  user_id?: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  category: string;
  notes?: string;
  created_at: string;
}

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

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const MONTH_LABELS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

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
    const idx = date.getMonth();
    months[idx].count += 1;
    months[idx].total += d.amount || 0;
  }

  return months;
}

function buildYearlyReport(donations: Donation[]) {
  const map = new Map<number, { count: number; total: number }>();
  for (const d of donations) {
    const year = new Date(d.created_at).getFullYear();
    const entry = map.get(year) || { count: 0, total: 0 };
    entry.count += 1;
    entry.total += d.amount || 0;
    map.set(year, entry);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, data]) => ({ year, ...data }));
}

export default function AdminDonationsManager() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadDonations();
  }, []);

  async function loadDonations() {
    setLoading(true);
    try {
      const data = await fetchAllDonations(200, 0);
      setDonations(data as Donation[]);
    } catch {
      showToast('Lỗi khi tải danh sách dâng hiến');
    } finally {
      setLoading(false);
    }
  }

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const exportToCSV = () => {
    if (donations.length === 0) {
      showToast('Không có dữ liệu để xuất');
      return;
    }
    
    // Headers
    const headers = ['Ngày', 'Mục đích', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ghi chú'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(d => [
        new Date(d.created_at).toLocaleDateString('vi-VN'),
        CATEGORY_LABELS[d.category] || d.category,
        d.amount,
        d.payment_method,
        d.status,
        `"${(d.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `donations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = donations.filter((d) => {
    const matchCat = selectedCategory === 'all' || d.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      (d.notes && d.notes.toLowerCase().includes(q)) ||
      d.payment_method.toLowerCase().includes(q) ||
      CATEGORY_LABELS[d.category]?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const totalAmount = filtered.reduce((acc, d) => acc + (d.amount || 0), 0);
  const completedCount = filtered.filter((d) => d.status === 'completed').length;

  const availableYears = [...new Set([
    ...filtered.map((d) => new Date(d.created_at).getFullYear()),
    new Date().getFullYear(),
  ])].sort((a, b) => b - a);

  const monthlyReport = buildMonthlyReport(filtered, reportYear);
  const yearlyReport = buildYearlyReport(filtered);

  const yearTotal = monthlyReport.reduce((sum, m) => sum + m.total, 0);
  const yearCount = monthlyReport.reduce((sum, m) => sum + m.count, 0);

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
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
          Quản lý Dâng hiến
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
          Theo dõi và quản lý các khoản dâng hiến của hội thánh
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card green">
          <div className="stat-icon green"><Coins size={22} /></div>
          <div className="stat-info">
            <span className="stat-label">Tổng số tiền</span>
            <span className="stat-value" style={{ fontSize: '1.2rem' }}>{formatVND(totalAmount)}</span>
          </div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue"><TrendingUp size={22} /></div>
          <div className="stat-info">
            <span className="stat-label">Tổng giao dịch</span>
            <span className="stat-value">{filtered.length}</span>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Đã hoàn thành</span>
            <span className="stat-value">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Báo cáo tổng hợp */}
      <div className="section-card" style={{ marginBottom: '1.25rem' }}>
        <div className="section-card-header">
          <h3>
            <BarChart3 size={16} />
            Báo cáo tổng hợp
          </h3>
          <select
            value={reportYear}
            onChange={(e) => setReportYear(Number(e.target.value))}
            className="role-select"
            style={{ padding: '0 0.75rem', height: 32, borderRadius: 8, fontSize: '0.82rem' }}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Theo tháng */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 0.75rem', fontWeight: 700 }}>
              Theo tháng — {reportYear}
            </h4>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th>Giao dịch</th>
                    <th>Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyReport.map((row) => (
                    <tr key={row.month} style={row.count === 0 ? { opacity: 0.45 } : undefined}>
                      <td>{row.label}</td>
                      <td>{row.count}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                        {formatVND(row.total)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.12)' }}>
                    <td style={{ fontWeight: 700, color: '#fff' }}>Tổng năm {reportYear}</td>
                    <td style={{ fontWeight: 700 }}>{yearCount}</td>
                    <td style={{ fontWeight: 800, color: 'var(--success)' }}>{formatVND(yearTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Theo năm */}
          <div>
            <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 0.75rem', fontWeight: 700 }}>
              Theo năm
            </h4>
            {yearlyReport.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Chưa có dữ liệu báo cáo.</p>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Năm</th>
                      <th>Giao dịch</th>
                      <th>Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyReport.map((row) => (
                      <tr
                        key={row.year}
                        style={row.year === reportYear ? { background: 'rgba(72,188,225,0.06)' } : undefined}
                      >
                        <td style={{ fontWeight: row.year === reportYear ? 700 : 400 }}>{row.year}</td>
                        <td>{row.count}</td>
                        <td style={{ fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                          {formatVND(row.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0.75rem 0 0' }}>
          Báo cáo dựa trên dữ liệu đang được lọc trên màn hình.
        </p>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div className="panel-search" style={{ flex: 1, minWidth: 200, margin: 0 }}>
            <Search size={15} />
            <input
              type="text"
              placeholder="Tìm kiếm theo ghi chú, phương thức..."
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
        </div>
        <button
          onClick={exportToCSV}
          style={{
            padding: '0 1rem', height: 36, borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
            background: 'rgba(72,188,225,0.1)', color: 'var(--primary)', border: '1px solid rgba(72,188,225,0.2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <Download size={14} /> Xuất CSV
        </button>
      </div>

      {/* Table */}
      <div className="section-card">
        <div className="section-card-header">
          <h3>
            <Calendar size={16} />
            Danh sách dâng hiến
          </h3>
          <span className="panel-card-count">{filtered.length} giao dịch</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Coins size={24} /></div>
            <span>Chưa có dữ liệu dâng hiến</span>
            <p>Các khoản dâng hiến sẽ hiển thị ở đây sau khi hội viên đăng ký.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Mục đích</th>
                  <th>Số tiền</th>
                  <th>Phương thức</th>
                  <th>Ghi chú</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((donation) => (
                  <tr key={donation.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} />
                        {new Date(donation.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: `${CATEGORY_COLORS[donation.category] || '#94a3b8'}18`,
                          color: CATEGORY_COLORS[donation.category] || '#94a3b8',
                          border: `1px solid ${CATEGORY_COLORS[donation.category] || '#94a3b8'}35`,
                        }}
                      >
                        {CATEGORY_LABELS[donation.category] || donation.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>
                      {formatVND(donation.amount)}
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                      {donation.payment_method}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 180 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {donation.notes || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={donation.status === 'completed' ? 'data-item-badge badge-published' : 'data-item-badge badge-draft'}>
                        {donation.status === 'completed' ? 'Hoàn thành' : donation.status === 'pending' ? 'Chờ xử lý' : donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
