/**
 * Skeleton.tsx — Centralized skeleton loading components for REACH Church App
 * Usage: import { LibrarySkeleton } from '@/components/ui/Skeleton';
 */
import './skeleton.css';

/* ─────────────────────────────────────────────────────────────
   BASE PRIMITIVES
   ───────────────────────────────────────────────────────────── */

interface SkProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Sk({ className = '', style }: SkProps) {
  return <span className={`sk ${className}`} style={style} />;
}

export function SkCircle({ size = 40, className = '' }: { size?: number; className?: string }) {
  return <span className={`sk sk-circle ${className}`} style={{ width: size, height: size, flexShrink: 0 }} />;
}

export function SkText({ width = '80%', height = 14, className = '', style }: { width?: string | number; height?: number; className?: string; style?: React.CSSProperties }) {
  return <span className={`sk ${className}`} style={{ width, height, display: 'block', borderRadius: 6, ...style }} />;
}

export function SkBlock({ w, h, radius = 12, className = '', style }: { w?: string | number; h: number; radius?: number; className?: string; style?: React.CSSProperties }) {
  return <span className={`sk ${className}`} style={{ width: w ?? '100%', height: h, borderRadius: radius, ...style }} />;
}

/* ─────────────────────────────────────────────────────────────
   CARD WRAPPER
   ───────────────────────────────────────────────────────────── */

function SkCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="sk-card" style={style}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────────
   1. HOME PAGE SKELETON
   ───────────────────────────────────────────────────────────── */

export function HomePageSkeleton() {
  return (
    <div className="sk-page-wide">
      {/* Hero banner */}
      <SkBlock h={220} radius={0} />

      {/* Quick action buttons row */}
      <div className="sk-row" style={{ padding: '16px 16px 0', gap: 10 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="sk-col sk-gap6" style={{ flex: 1, alignItems: 'center' }}>
            <SkCircle size={48} />
            <SkText width={40} height={10} />
          </div>
        ))}
      </div>

      {/* Section title */}
      <div style={{ padding: '20px 16px 8px' }}>
        <SkText width={140} height={18} />
      </div>

      {/* Horizontal scroll cards */}
      <div className="sk-row" style={{ padding: '0 16px', overflowX: 'hidden', gap: 12 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ minWidth: 200, flexShrink: 0 }}>
            <SkBlock h={120} radius={14} />
            <div className="sk-col sk-gap6" style={{ marginTop: 10 }}>
              <SkText width="90%" height={13} />
              <SkText width="60%" height={11} />
            </div>
          </div>
        ))}
      </div>

      {/* Section title 2 */}
      <div style={{ padding: '8px 16px' }}>
        <SkText width={160} height={18} />
      </div>

      {/* News list */}
      <div className="sk-col" style={{ padding: '0 16px', gap: 12 }}>
        {[1,2,3].map(i => (
          <SkCard key={i}>
            <div className="sk-row">
              <SkBlock w={80} h={80} radius={12} />
              <div className="sk-col sk-flex1 sk-gap8">
                <SkText width="90%" height={14} />
                <SkText width="70%" height={12} />
                <SkText width="50%" height={10} />
              </div>
            </div>
          </SkCard>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. LIBRARY SKELETON
   ───────────────────────────────────────────────────────────── */

export function LibrarySkeleton() {
  return (
    <div className="sk-page-wide">
      {/* Tab bar */}
      <div className="sk-row" style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 8 }}>
        {[1,2,3,4].map(i => (
          <SkBlock key={i} w={70} h={34} radius={20} />
        ))}
      </div>

      {/* Filter chips */}
      <div className="sk-row" style={{ padding: '12px 16px', gap: 8 }}>
        {[1,2,3,4].map(i => (
          <SkBlock key={i} w={60} h={28} radius={99} />
        ))}
      </div>

      {/* Media card grid */}
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="sk-col sk-gap8">
            <SkBlock h={120} radius={14} />
            <SkText width="90%" height={13} />
            <SkText width="60%" height={11} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. EVENTS SKELETON
   ───────────────────────────────────────────────────────────── */

export function EventsSkeleton() {
  return (
    <div className="sk-page">
      {/* Header */}
      <div className="sk-row" style={{ justifyContent: 'space-between' }}>
        <SkText width={160} height={22} />
        <SkBlock w={80} h={32} radius={20} />
      </div>

      {/* Tabs */}
      <div className="sk-row" style={{ gap: 8 }}>
        <SkBlock w="50%" h={38} radius={20} />
        <SkBlock w="50%" h={38} radius={20} />
      </div>

      {/* Event cards */}
      {[1,2,3,4].map(i => (
        <SkCard key={i}>
          <SkBlock h={160} radius={10} style={{ marginBottom: 14 }} />
          <div className="sk-col sk-gap8">
            <SkText width="85%" height={16} />
            <SkText width="55%" height={12} />
            <SkText width="45%" height={12} />
            <div className="sk-row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
              <SkBlock w={90} h={32} radius={20} />
              <SkText width={60} height={12} />
            </div>
          </div>
        </SkCard>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. GROUPS SKELETON
   ───────────────────────────────────────────────────────────── */

export function GroupsSkeleton() {
  return (
    <div className="sk-page">
      {/* Search bar */}
      <SkBlock h={44} radius={22} />

      {/* Tabs */}
      <div className="sk-row" style={{ gap: 8 }}>
        <SkBlock w="50%" h={38} radius={20} />
        <SkBlock w="50%" h={38} radius={20} />
      </div>

      {/* Group cards */}
      {[1,2,3].map(i => (
        <SkCard key={i}>
          <div className="sk-row" style={{ marginBottom: 12 }}>
            <SkCircle size={52} />
            <div className="sk-col sk-flex1 sk-gap8">
              <SkText width="75%" height={16} />
              <SkText width="50%" height={12} />
            </div>
          </div>
          <SkText width="100%" height={12} />
          <SkText width="80%" height={12} style={{ marginTop: 6 }} />
          <div className="sk-row" style={{ marginTop: 14, justifyContent: 'space-between' }}>
            <SkText width={80} height={11} />
            <SkBlock w={90} h={32} radius={20} />
          </div>
        </SkCard>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. NEWS SKELETON
   ───────────────────────────────────────────────────────────── */

export function NewsSkeleton() {
  return (
    <div className="sk-page">
      {/* Search + header */}
      <SkBlock h={44} radius={22} />

      {/* Category tabs */}
      <div className="sk-row" style={{ gap: 8, overflowX: 'hidden' }}>
        {[1,2,3,4].map(i => (
          <SkBlock key={i} w={70} h={30} radius={99} />
        ))}
      </div>

      {/* Featured card */}
      <SkCard>
        <SkBlock h={180} radius={10} style={{ marginBottom: 12 }} />
        <SkText width="90%" height={16} />
        <SkText width="60%" height={12} style={{ marginTop: 8 }} />
        <SkText width="40%" height={10} style={{ marginTop: 6 }} />
      </SkCard>

      {/* List items */}
      {[1,2,3,4].map(i => (
        <SkCard key={i} style={{ padding: '12px' }}>
          <div className="sk-row sk-gap12">
            <SkBlock w={80} h={80} radius={12} />
            <div className="sk-col sk-flex1 sk-gap8">
              <SkText width="90%" height={14} />
              <SkText width="75%" height={12} />
              <SkText width="50%" height={10} />
            </div>
          </div>
        </SkCard>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. PRAYER WALL SKELETON
   ───────────────────────────────────────────────────────────── */

export function PrayerWallSkeleton() {
  return (
    <div className="sk-page">
      {/* Form area */}
      <SkCard>
        <SkText width={140} height={16} style={{ marginBottom: 12 }} />
        <SkBlock h={80} radius={10} style={{ marginBottom: 10 }} />
        <div className="sk-row" style={{ gap: 8 }}>
          <SkBlock w="60%" h={38} radius={10} />
          <SkBlock w="40%" h={38} radius={10} />
        </div>
      </SkCard>

      {/* Section title */}
      <SkText width={160} height={18} />

      {/* Prayer wall cards */}
      {[1,2,3,4,5].map(i => (
        <SkCard key={i} style={{ padding: '14px' }}>
          <div className="sk-row" style={{ marginBottom: 10 }}>
            <SkCircle size={36} />
            <div className="sk-col sk-flex1 sk-gap6">
              <SkText width="55%" height={13} />
              <SkText width="35%" height={10} />
            </div>
            <SkBlock w={60} h={24} radius={99} />
          </div>
          <SkText width="95%" height={12} />
          <SkText width="80%" height={12} style={{ marginTop: 6 }} />
          <SkText width="65%" height={12} style={{ marginTop: 6 }} />
          <div className="sk-row" style={{ marginTop: 12, gap: 8 }}>
            <SkBlock w={70} h={28} radius={99} />
            <SkBlock w={80} h={28} radius={99} />
          </div>
        </SkCard>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   7. MINISTRY SKELETON
   ───────────────────────────────────────────────────────────── */

export function MinistryGridSkeleton() {
  return (
    <div className="sk-page">
      {/* Header */}
      <SkText width={200} height={22} />
      <SkText width="80%" height={13} />

      {/* Search bar */}
      <SkBlock h={44} radius={22} />

      {/* Grid cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[1,2,3,4,5,6].map(i => (
          <SkCard key={i}>
            <div className="sk-col sk-gap10" style={{ alignItems: 'center', textAlign: 'center' }}>
              <SkCircle size={48} />
              <SkText width="80%" height={14} />
              <SkText width="95%" height={11} />
              <SkText width="75%" height={11} />
              <SkBlock h={32} radius={20} style={{ marginTop: 4 }} />
            </div>
          </SkCard>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   8. LIVESTREAM SKELETON
   ───────────────────────────────────────────────────────────── */

export function LivestreamSkeleton() {
  return (
    <div className="sk-page-wide">
      {/* Video player */}
      <SkBlock h={220} radius={0} style={{ width: '100%' }} />

      <div style={{ padding: '16px' }}>
        {/* Title + meta */}
        <div className="sk-col sk-gap10" style={{ marginBottom: 20 }}>
          <SkText width="85%" height={20} />
          <SkText width="50%" height={13} />
        </div>

        {/* Tabs */}
        <div className="sk-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 20, gap: 4 }}>
          {[1,2,3].map(i => (
            <SkBlock key={i} w="33%" h={42} radius={8} />
          ))}
        </div>

        {/* Note area */}
        <div className="sk-col sk-gap12">
          <SkBlock h={140} radius={12} />
          <SkBlock h={44} radius={12} w="100%" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   9. BIBLE SKELETON (bonus)
   ───────────────────────────────────────────────────────────── */

export function BibleSkeleton() {
  return (
    <div className="sk-page">
      {/* Book/chapter selector */}
      <div className="sk-row" style={{ gap: 8 }}>
        <SkBlock w="60%" h={42} radius={12} />
        <SkBlock w="40%" h={42} radius={12} />
      </div>

      {/* Verses */}
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} className="sk-col sk-gap6">
          <div className="sk-row sk-gap8">
            <SkText width={20} height={11} />
            <div className="sk-col sk-flex1 sk-gap4">
              <SkText width="100%" height={13} />
              <SkText width={`${60 + (i * 7) % 35}%`} height={13} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
