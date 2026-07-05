import type { Donation, DonationStatus } from './donations';
import { getDonorDisplayName } from './donations';

export interface DonationExportRow {
  stt: number;
  date: string;
  donor: string;
  category: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  status: string;
  notes: string;
  adminNotes: string;
  isDuplicateTx: boolean;
}

export const EXPORT_HEADERS = [
  'STT',
  'Ngày',
  'Người dâng',
  'Mục đích',
  'Số tiền (VND)',
  'Phương thức',
  'Mã GD',
  'Trạng thái',
  'Ghi chú',
  'Ghi chú admin',
] as const;

export const EXPORT_COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export function findDuplicateTransactionIds(
  donations: Donation[],
): Map<string, Donation[]> {
  const map = new Map<string, Donation[]>();
  for (const d of donations) {
    const tx = d.transaction_id?.trim();
    if (!tx) continue;
    const key = tx.toLowerCase();
    const list = map.get(key) || [];
    list.push(d);
    map.set(key, list);
  }
  const duplicates = new Map<string, Donation[]>();
  for (const [key, list] of map) {
    if (list.length > 1) duplicates.set(key, list);
  }
  return duplicates;
}

export function getDuplicateTxIdSet(duplicates: Map<string, Donation[]>): Set<string> {
  const ids = new Set<string>();
  for (const list of duplicates.values()) {
    for (const d of list) ids.add(d.id);
  }
  return ids;
}

export function getOverduePendingDonations(donations: Donation[], days = 7): Donation[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return donations.filter((d) => {
    if (d.status !== 'pending') return false;
    return new Date(d.created_at).getTime() < cutoff;
  });
}

export function buildExportRows(
  donations: Donation[],
  categoryLabels: Record<string, string>,
  statusLabels: Record<DonationStatus, string>,
  duplicateTxIds?: Set<string>,
): DonationExportRow[] {
  return donations.map((d, i) => ({
    stt: i + 1,
    date: new Date(d.created_at).toLocaleDateString('vi-VN'),
    donor: getDonorDisplayName(d),
    category: categoryLabels[d.category] || d.category,
    amount: Number(d.amount) || 0,
    paymentMethod: d.payment_method || '',
    transactionId: d.transaction_id || '',
    status: statusLabels[d.status] || d.status,
    notes: d.notes || '',
    adminNotes: d.admin_notes || '',
    isDuplicateTx: duplicateTxIds?.has(d.id) ?? false,
  }));
}

function escapeCsvCell(value: string | number, delimiter: string): string {
  const str = String(value);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Dùng `;` để Excel VN mở đúng cột khi double-click file */
export function buildCsvContent(rows: DonationExportRow[], delimiter = ';'): string {
  const lines = [
    EXPORT_HEADERS.join(delimiter),
    ...rows.map((r) =>
      [
        r.stt,
        r.date,
        r.donor,
        r.category,
        r.amount,
        r.paymentMethod,
        r.transactionId,
        r.status,
        r.notes,
        r.adminNotes,
      ]
        .map((v) => escapeCsvCell(v, delimiter))
        .join(delimiter),
    ),
  ];

  const total = rows.reduce((s, r) => s + r.amount, 0);
  lines.push(
    ['', '', '', 'TỔNG CỘNG', total, '', '', '', '', '']
      .map((v) => escapeCsvCell(v, delimiter))
      .join(delimiter),
  );

  return lines.join('\r\n');
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
