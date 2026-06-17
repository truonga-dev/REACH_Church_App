'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Users, FileText, Heart, Video, BookOpen,
  Download, RefreshCw, Calendar, BarChart2, PieChart as PieIcon,
  Coins, Activity, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

/* ─── Types ─── */
interface Stats {
  profiles: number;
  sermons: number;
  news: number;
  prayers: number;
  devotionals: number;
  donations: number;
  events: number;
}

interface MonthlyPoint { month: string; profiles: number; sermons: number; news: number; prayers: number }
interface ContentDist { label: string; value: number; color: string }
interface RecentActivity { id: string; type: string; title: string; date: string; icon: string }

type Period = '7d' | '30d' | '90d' | '1y';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7 ngày',
  '30d': '30 ngày',
  '90d': '3 tháng',
  '1y': '1 năm',
};

/* ─── Helpers ─── */
const fmtDate = (v: string) => new Date(v).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
const fmtNum = (n: number) => n.toLocaleString('vi-VN');

/** Generate n months back from today */
function getMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

/** Count items per month from array of {created_at} */
function countByMonth(items: { created_at: string }[], months: string[]): number[] {
  return months.map(m => items.filter(i => i.created_at?.startsWith(m)).length);
}

/* ─── SVG Bar Chart ─── */
function BarChart({ data, labels, colors, height = 160 }: {
  data: number[][];
  labels: string[];
  colors: string[];
  height?: number;
}) {
  const maxVal = Math.max(...data.flat(), 1);
  const barW = Math.floor(520 / (labels.length * (data.length + 0.5)));
  const gap = 2;
  const groupW = barW * data.length + gap * (data.length - 1) + 6;
  const totalW = groupW * labels.length;

  return (
    <svg viewBox={`0 0 ${totalW} ${height + 30}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f}
          x1={0} y1={height - height * f}
          x2={totalW} y2={height - height * f}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />
      ))}
      {/* Bars */}
      {labels.map((lbl, gi) => (
        <g key={lbl}>
          {data.map((series, si) => {
            const val = series[gi] || 0;
            const barH = Math.max(2, (val / maxVal) * height);
            const x = gi * groupW + si * (barW + gap);
            return (
              <g key={si}>
                <rect
                  x={x} y={height - barH}
                  width={barW} height={barH}
                  fill={colors[si]} rx={3}
                  opacity={0.85}
                />
                {val > 0 && (
                  <text x={x + barW / 2} y={height - barH - 3}
                    textAnchor="middle" fontSize={8} fill={colors[si]}>
                    {val}
                  </text>
                )}
              </g>
            );
          })}
          <text
            x={gi * groupW + (groupW / 2) - 3}
            y={height + 16}
            textAnchor="middle"
            fontSize={9}
            fill="#666"
          >{lbl.slice(5)}</text>
        </g>
      ))}
    </svg>
  );
}

/* ─── SVG Line Chart ─── */
function LineChart({ series, labels, colors, height = 140 }: {
  series: number[][];
  labels: string[];
  colors: string[];
  height?: number;
}) {
  const maxVal = Math.max(...series.flat(), 1);
  const w = 520;
  const stepX = w / Math.max(labels.length - 1, 1);

  const pts = (data: number[]) =>
    data.map((v, i) => `${i * stepX},${height - (v / maxVal) * height}`).join(' ');

  const area = (data: number[]) =>
    `M${data.map((v, i) => `${i * stepX},${height - (v / maxVal) * height}`).join(' L')} L${(data.length - 1) * stepX},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height + 24}`} style={{ width: '100%', height: 'auto' }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={0} y1={height - height * f} x2={w} y2={height - height * f}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      {series.map((data, si) => (
        <g key={si}>
          <path d={area(data)} fill={colors[si]} opacity={0.08} />
          <polyline points={pts(data)} fill="none" stroke={colors[si]} strokeWidth={2} strokeLinejoin="round" />
          {data.map((v, i) => (
            <circle key={i} cx={i * stepX} cy={height - (v / maxVal) * height}
              r={3} fill={colors[si]} />
          ))}
        </g>
      ))}
      {labels.map((lbl, i) => (
        <text key={i} x={i * stepX} y={height + 18} textAnchor="middle" fontSize={9} fill="#666">
          {lbl.slice(5)}
        </text>
      ))}
    </svg>
  );
}

/* ─── SVG Pie Chart ─── */
function PieChart({ data, size = 140 }: { data: ContentDist[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -Math.PI / 2;
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;

  const slices = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`;
    angle += sweep;
    return { ...d, path };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.9} stroke="#1a1d24" strokeWidth={1.5} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.45} fill="#1a1d24" />
    </svg>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon: Icon, color, trend }: {
  label: string; value: number; icon: any; color: string; trend?: number;
}) {
  return (
    <div style={{
      padding: '18px 20px', borderRadius: '14px', background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}25`, display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.75rem', fontWeight: 700,
            color: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#888',
          }}>
            {trend > 0 ? <ArrowUp size={12} /> : trend < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1 }}>
          {fmtNum(value)}
        </p>
        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#888' }}>{label}</p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════ */
export default function StatsManager() {
  const [stats, setStats] = useState<Stats>({ profiles: 0, sermons: 0, news: 0, prayers: 0, devotionals: 0, donations: 0, events: 0 });
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [contentDist, setContentDist] = useState<ContentDist[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [activeChart, setActiveChart] = useState<'bar' | 'line'>('bar');

  const numMonths = period === '7d' ? 1 : period === '30d' ? 3 : period === '90d' ? 6 : 12;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Parallel fetch
      const [
        { count: profilesCount },
        { count: sermonsCount },
        { count: newsCount },
        { count: prayersCount },
        { count: devotionalsCount },
        { count: donationsCount },
        { count: eventsCount },
        { data: profilesData },
        { data: sermonsData },
        { data: newsData },
        { data: prayersData },
        { data: recentNews },
        { data: recentSermons },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('sermons').select('*', { count: 'exact', head: true }),
        supabase.from('news').select('*', { count: 'exact', head: true }),
        supabase.from('prayers').select('*', { count: 'exact', head: true }),
        supabase.from('devotionals').select('*', { count: 'exact', head: true }),
        supabase.from('donations').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('created_at'),
        supabase.from('sermons').select('created_at'),
        supabase.from('news').select('created_at, type'),
        supabase.from('prayers').select('created_at'),
        supabase.from('news').select('id,title,type,created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('sermons').select('id,title,created_at').order('created_at', { ascending: false }).limit(3),
      ]);

      setStats({
        profiles:    profilesCount    || 0,
        sermons:     sermonsCount     || 0,
        news:        newsCount        || 0,
        prayers:     prayersCount     || 0,
        devotionals: devotionalsCount || 0,
        donations:   donationsCount   || 0,
        events:      eventsCount      || 0,
      });

      // Monthly breakdown
      const months = getMonths(numMonths);
      const mData: MonthlyPoint[] = months.map(m => ({
        month: m,
        profiles: countByMonth(profilesData || [], [m])[0],
        sermons:  countByMonth(sermonsData  || [], [m])[0],
        news:     countByMonth(newsData     || [], [m])[0],
        prayers:  countByMonth(prayersData  || [], [m])[0],
      }));
      setMonthly(mData);

      // Content distribution (news by type)
      const typeMap: Record<string, number> = {};
      (newsData || []).forEach((n: any) => {
        typeMap[n.type || 'Khác'] = (typeMap[n.type || 'Khác'] || 0) + 1;
      });
      const COLORS = ['#48BCE1', '#F4CC30', '#10b981', '#a855f7', '#f97316', '#ef4444'];
      const dist = Object.entries(typeMap).map(([label, value], i) => ({
        label, value, color: COLORS[i % COLORS.length],
      }));
      setContentDist(dist);

      // Recent activity
      const activity: RecentActivity[] = [
        ...(recentNews || []).map((n: any) => ({
          id: n.id, type: n.type || 'Bài viết', title: n.title, date: n.created_at, icon: '📰',
        })),
        ...(recentSermons || []).map((s: any) => ({
          id: s.id, type: 'Bài giảng', title: s.title, date: s.created_at, icon: '🎬',
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
      setRecentActivity(activity);
    } finally {
      setLoading(false);
    }
  }, [numMonths]);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Export CSV ── */
  const exportCSV = () => {
    const rows = [
      ['Chỉ số', 'Số lượng'],
      ['Tín hữu', stats.profiles],
      ['Bài giảng', stats.sermons],
      ['Tin tức & Bài viết', stats.news],
      ['Cầu nguyện', stats.prayers],
      ['Dưỡng linh', stats.devotionals],
      ['Dâng hiến', stats.donations],
      ['Sự kiện', stats.events],
      [],
      ['Tháng', 'Tín hữu mới', 'Bài giảng mới', 'Bài viết mới', 'Cầu nguyện mới'],
      ...monthly.map(m => [m.month, m.profiles, m.sermons, m.news, m.prayers]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reach-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Export JSON ── */
  const exportJSON = () => {
    const payload = { stats, monthly, contentDist, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reach-stats-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const months  = monthly.map(m => m.month);
  const chartSeries = [
    monthly.map(m => m.profiles),
    monthly.map(m => m.sermons),
    monthly.map(m => m.news),
    monthly.map(m => m.prayers),
  ];
  const chartColors = ['#48BCE1', '#F4CC30', '#10b981', '#a855f7'];
  const chartLegend = ['Tín hữu', 'Bài giảng', 'Bài viết', 'Cầu nguyện'];

  /* ── Styles ── */
  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '20px',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(72,188,225,0.3)', borderTop: '3px solid #48BCE1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#888' }}>Đang tải thống kê...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={20} style={{ color: '#48BCE1' }} /> Báo cáo & Thống kê
          </h3>
          <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.8rem' }}>
            Tổng hợp dữ liệu hoạt động của hội thánh
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, gap: 2 }}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 600,
                background: period === p ? '#48BCE1' : 'transparent',
                color:      period === p ? '#fff'    : '#888',
              }}>{PERIOD_LABELS[p]}</button>
            ))}
          </div>
          {/* Chart toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, gap: 2 }}>
            <button onClick={() => setActiveChart('bar')} title="Biểu đồ cột" style={{
              padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeChart === 'bar' ? '#48BCE1' : 'transparent',
              color: activeChart === 'bar' ? '#fff' : '#888',
            }}><BarChart2 size={14} /></button>
            <button onClick={() => setActiveChart('line')} title="Biểu đồ đường" style={{
              padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: activeChart === 'line' ? '#48BCE1' : 'transparent',
              color: activeChart === 'line' ? '#fff' : '#888',
            }}><Activity size={14} /></button>
          </div>
          {/* Export */}
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
          }}>
            <Download size={13} /> CSV
          </button>
          <button onClick={exportJSON} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
          }}>
            <Download size={13} /> JSON
          </button>
          <button onClick={loadAll} style={{
            padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)', color: '#888', cursor: 'pointer',
          }} title="Làm mới"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard label="Tín hữu"      value={stats.profiles}    icon={Users}    color="#48BCE1" />
        <StatCard label="Bài giảng"    value={stats.sermons}     icon={Video}    color="#F4CC30" />
        <StatCard label="Tin tức/Bài" value={stats.news}        icon={FileText} color="#10b981" />
        <StatCard label="Cầu nguyện"   value={stats.prayers}     icon={Heart}    color="#a855f7" />
        <StatCard label="Dưỡng linh"   value={stats.devotionals} icon={BookOpen} color="#f97316" />
        <StatCard label="Dâng hiến"    value={stats.donations}   icon={Coins}    color="#06b6d4" />
        <StatCard label="Sự kiện"      value={stats.events}      icon={Calendar} color="#ec4899" />
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(260px,320px)', gap: 16 }}>
        {/* Main Chart */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
              Tăng trưởng theo tháng
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {chartLegend.map((l, i) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#888' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: chartColors[i], display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          {months.length > 0 ? (
            activeChart === 'bar'
              ? <BarChart data={chartSeries} labels={months} colors={chartColors} />
              : <LineChart series={chartSeries} labels={months} colors={chartColors} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: '#444' }}>
              Chưa có đủ dữ liệu
            </div>
          )}
        </div>

        {/* Pie + Legend */}
        <div style={card}>
          <p style={{ margin: '0 0 16px', fontWeight: 700, color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PieIcon size={15} style={{ color: '#48BCE1' }} /> Phân loại nội dung
          </p>
          {contentDist.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <PieChart data={contentDist} size={140} />
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {contentDist.map(d => {
                  const total = contentDist.reduce((s, x) => s + x.value, 0) || 1;
                  const pct = Math.round((d.value / total) * 100);
                  return (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.78rem', color: '#aaa' }}>{d.label}</span>
                      <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 700 }}>{d.value}</span>
                      <span style={{ fontSize: '0.72rem', color: '#555' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#444' }}>
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>

      {/* ── Monthly Data Table ── */}
      <div style={card}>
        <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={15} style={{ color: '#48BCE1' }} /> Chi tiết theo tháng
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Tháng', 'Tín hữu mới', 'Bài giảng', 'Bài viết', 'Cầu nguyện', 'Tổng'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Tháng' ? 'left' : 'right', color: '#666', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.map((m, i) => {
                const total = m.profiles + m.sermons + m.news + m.prayers;
                return (
                  <tr key={m.month} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '10px 12px', color: '#ccc', fontWeight: 600 }}>
                      {new Date(m.month + '-01').toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </td>
                    {[m.profiles, m.sermons, m.news, m.prayers].map((v, j) => (
                      <td key={j} style={{ padding: '10px 12px', textAlign: 'right', color: v > 0 ? chartColors[j] : '#444', fontWeight: v > 0 ? 700 : 400 }}>
                        {v > 0 ? `+${v}` : '—'}
                      </td>
                    ))}
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: total > 0 ? '#fff' : '#444', fontWeight: 700 }}>
                      {total > 0 ? fmtNum(total) : '—'}
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr style={{ borderTop: '2px solid rgba(255,255,255,0.1)', background: 'rgba(72,188,225,0.05)' }}>
                <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 800 }}>Tổng cộng</td>
                {[
                  monthly.reduce((s, m) => s + m.profiles, 0),
                  monthly.reduce((s, m) => s + m.sermons, 0),
                  monthly.reduce((s, m) => s + m.news, 0),
                  monthly.reduce((s, m) => s + m.prayers, 0),
                ].map((v, i) => (
                  <td key={i} style={{ padding: '10px 12px', textAlign: 'right', color: chartColors[i], fontWeight: 800 }}>
                    {fmtNum(v)}
                  </td>
                ))}
                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#fff', fontWeight: 800 }}>
                  {fmtNum(monthly.reduce((s, m) => s + m.profiles + m.sermons + m.news + m.prayers, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div style={card}>
        <p style={{ margin: '0 0 14px', fontWeight: 700, color: '#fff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={15} style={{ color: '#48BCE1' }} /> Hoạt động gần đây
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recentActivity.length === 0 ? (
            <p style={{ color: '#444', textAlign: 'center', padding: '24px 0' }}>Chưa có hoạt động nào</p>
          ) : recentActivity.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 8,
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: '#fff', fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.title}
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '0.75rem' }}>{a.type}</p>
              </div>
              <span style={{ color: '#555', fontSize: '0.75rem', flexShrink: 0 }}>
                {new Date(a.date).toLocaleDateString('vi-VN')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Stats Summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { label: 'Tổng nội dung', value: stats.sermons + stats.news + stats.devotionals, icon: FileText, color: '#48BCE1', desc: 'bài giảng + tin tức + dưỡng linh' },
          { label: 'Tương tác cộng đồng', value: stats.prayers + stats.donations, icon: Heart, color: '#a855f7', desc: 'cầu nguyện + dâng hiến' },
          { label: 'Tỉ lệ nội dung/tín hữu', value: Math.round((stats.sermons + stats.news) / Math.max(stats.profiles, 1) * 10) / 10, icon: TrendingUp, color: '#10b981', desc: 'bài / người dùng' },
        ].map(s => (
          <div key={s.label} style={{ ...card, display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: 800 }}>{s.value}</p>
              <p style={{ margin: '2px 0 0', color: '#888', fontSize: '0.75rem', fontWeight: 600 }}>{s.label}</p>
              <p style={{ margin: 0, color: '#555', fontSize: '0.7rem' }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
