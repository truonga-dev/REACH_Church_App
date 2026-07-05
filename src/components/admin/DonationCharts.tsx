'use client';

const MONTH_SHORT = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

interface MonthBar {
  label: string;
  total: number;
  count: number;
}

interface CategorySlice {
  key: string;
  label: string;
  total: number;
  color: string;
  percent: number;
}

interface DonationChartsProps {
  monthlyData: MonthBar[];
  categoryData: CategorySlice[];
  year: number;
  formatVND: (n: number) => string;
}

export function buildCategoryBreakdown(
  donations: { category: string; amount: number }[],
  labels: Record<string, string>,
  colors: Record<string, string>,
): CategorySlice[] {
  const totals: Record<string, number> = {};
  for (const d of donations) {
    totals[d.category] = (totals[d.category] || 0) + (Number(d.amount) || 0);
  }
  const grand = Object.values(totals).reduce((s, v) => s + v, 0);
  if (grand === 0) return [];

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([key, total]) => ({
      key,
      label: labels[key] || key,
      total,
      color: colors[key] || '#94a3b8',
      percent: Math.round((total / grand) * 100),
    }));
}

export default function DonationCharts({
  monthlyData,
  categoryData,
  year,
  formatVND,
}: DonationChartsProps) {
  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1);
  const donutGradient =
    categoryData.length > 0
      ? (() => {
          let acc = 0;
          const stops = categoryData.map((c) => {
            const start = acc;
            acc += c.percent;
            return `${c.color} ${start}% ${acc}%`;
          });
          return `conic-gradient(${stops.join(', ')})`;
        })()
      : 'conic-gradient(#334155 0% 100%)';

  return (
    <div className="donations-charts">
      <div className="donations-chart-card">
        <h4 className="donations-chart-title">Biểu đồ theo tháng — {year}</h4>
        <div className="donations-bar-chart" role="img" aria-label={`Biểu đồ dâng hiến theo tháng năm ${year}`}>
          {monthlyData.map((m, i) => {
            const heightPct = m.total > 0 ? Math.max((m.total / maxMonthly) * 100, 8) : 4;
            return (
              <div key={m.label} className="donations-bar-col" title={`${MONTH_SHORT[i]}: ${formatVND(m.total)} (${m.count} GD)`}>
                <div className="donations-bar-value">{m.total > 0 ? formatVND(m.total).replace('₫', '').trim() : ''}</div>
                <div
                  className="donations-bar"
                  style={{
                    height: `${heightPct}%`,
                    opacity: m.total > 0 ? 1 : 0.25,
                  }}
                />
                <span className="donations-bar-label">{MONTH_SHORT[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="donations-chart-card">
        <h4 className="donations-chart-title">Theo mục đích</h4>
        {categoryData.length === 0 ? (
          <p className="donations-chart-empty">Chưa có dữ liệu để hiển thị.</p>
        ) : (
          <div className="donations-donut-wrap">
            <div className="donations-donut" style={{ background: donutGradient }}>
              <div className="donations-donut-hole" />
            </div>
            <ul className="donations-donut-legend">
              {categoryData.map((c) => (
                <li key={c.key}>
                  <span className="donations-legend-dot" style={{ background: c.color }} />
                  <span className="donations-legend-label">{c.label}</span>
                  <span className="donations-legend-value">{c.percent}% · {formatVND(c.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
