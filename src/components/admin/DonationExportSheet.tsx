'use client';

import { useMemo } from 'react';
import { Download, FileSpreadsheet, Loader2, Printer, X } from 'lucide-react';
import {
  EXPORT_COL_LETTERS,
  EXPORT_HEADERS,
  buildCsvContent,
  downloadCsvFile,
  type DonationExportRow,
} from '@/lib/donations-export';
import './DonationExportSheet.css';

interface DonationExportSheetProps {
  open: boolean;
  loading: boolean;
  rows: DonationExportRow[];
  title: string;
  subtitle: string;
  formatVND: (n: number) => string;
  onClose: () => void;
}

export default function DonationExportSheet({
  open,
  loading,
  rows,
  title,
  subtitle,
  formatVND,
  onClose,
}: DonationExportSheetProps) {
  const totalAmount = useMemo(
    () => rows.reduce((s, r) => s + r.amount, 0),
    [rows],
  );

  if (!open) return null;

  const handleDownload = () => {
    const csv = buildCsvContent(rows);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`REACH_DangHien_${date}.csv`, csv);
  };

  const handlePrint = () => {
    document.body.classList.add('printing-donation-export');
    const cleanup = () => {
      document.body.classList.remove('printing-donation-export');
    };
    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    setTimeout(cleanup, 1000);
  };

  return (
    <div className="donation-export-overlay" role="dialog" aria-modal="true" aria-label="Xuất báo cáo dâng hiến">
      <div className="donation-export-modal">
        <div className="donation-export-ribbon">
          <div className="donation-export-ribbon-left">
            <div className="donation-export-ribbon-icon">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <p className="donation-export-ribbon-title">{title}</p>
              <p className="donation-export-ribbon-sub">{subtitle}</p>
            </div>
          </div>
          <div className="donation-export-ribbon-actions">
            <button type="button" className="donation-export-ribbon-btn primary" onClick={handleDownload} disabled={loading || rows.length === 0}>
              <Download size={14} /> Tải .csv
            </button>
            <button type="button" className="donation-export-ribbon-btn" onClick={handlePrint} disabled={loading || rows.length === 0}>
              <Printer size={14} /> In
            </button>
            <button type="button" className="donation-export-ribbon-btn close-btn" onClick={onClose} aria-label="Đóng">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="donation-export-formula-bar">
          <span className="donation-export-formula-label">fx</span>
          <input
            className="donation-export-formula-input"
            readOnly
            value={`=SUM(E2:E${rows.length + 1}) → ${formatVND(totalAmount)}`}
          />
        </div>

        <div className="donation-export-sheet-wrap">
          {loading ? (
            <div className="donation-export-loading">
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#217346' }} />
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="donation-export-loading">
              <p>Không có dữ liệu phù hợp bộ lọc hiện tại.</p>
            </div>
          ) : (
            <div className="donation-export-sheet">
              <table className="donation-export-table">
                <thead>
                  <tr>
                    <th className="col-corner" />
                    {EXPORT_COL_LETTERS.map((letter) => (
                      <th key={letter} className="col-letter">{letter}</th>
                    ))}
                  </tr>
                  <tr>
                    <th className="row-num">1</th>
                    {EXPORT_HEADERS.map((h) => (
                      <th key={h} className="header-cell">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.stt}>
                      <td className="row-num">{idx + 2}</td>
                      <td className="data-cell" style={{ textAlign: 'center' }}>{row.stt}</td>
                      <td className="data-cell">{row.date}</td>
                      <td className="data-cell">{row.donor}</td>
                      <td className="data-cell">{row.category}</td>
                      <td className={`data-cell num-cell${row.isDuplicateTx ? ' dup-cell' : ''}`}>
                        {row.amount.toLocaleString('vi-VN')}
                      </td>
                      <td className="data-cell">{row.paymentMethod || '—'}</td>
                      <td className={`data-cell${row.isDuplicateTx ? ' dup-cell' : ''}`}>{row.transactionId || '—'}</td>
                      <td className="data-cell">{row.status}</td>
                      <td className="data-cell" title={row.notes}>{row.notes || '—'}</td>
                      <td className="data-cell" title={row.adminNotes}>{row.adminNotes || '—'}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td className="row-num">{rows.length + 2}</td>
                    <td className="data-cell" colSpan={3} />
                    <td className="data-cell total-label">TỔNG CỘNG</td>
                    <td className="data-cell num-cell">{totalAmount.toLocaleString('vi-VN')}</td>
                    <td className="data-cell" colSpan={4} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="donation-export-footer">
          <span>{rows.length} dòng dữ liệu · Phân cách CSV: dấu chấm phẩy (;) — tương thích Excel VN</span>
          <span>REACH Church Vietnam</span>
        </div>
      </div>
    </div>
  );
}
