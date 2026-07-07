'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, X, Copy, Share2, Highlighter, Link2 } from 'lucide-react';
import {
  getChapterHighlights,
  setHighlightInRange,
  removeHighlightsInRange,
  HIGHLIGHT_COLORS,
  type HighlightColor,
  type VerseHighlight,
} from '@/lib/bible-highlights';
import { buildBibleShareUrl, buildBibleShareText, getShareTargets, parseBibleLocation } from '@/lib/bible-share';
import SharePlatformIcon from '@/components/bible/SharePlatformIcon';
import BiblePlans from '@/components/bible/BiblePlans';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import './page.css';
const books = [
  'Sáng-thế Ký', 'Xuất Ê-díp-tô Ký', 'Lê-vi Ký', 'Dân-số Ký', 'Phục-truyền Luật-lệ Ký',
  'Giô-suê', 'Các Quan Xét', 'Ru-tơ', '1 Sa-mu-ên', '2 Sa-mu-ên', '1 Các Vua', '2 Các Vua',
  '1 Sử-ký', '2 Sử-ký', 'Ê-xơ-ra', 'Nê-hê-mi', 'Ê-xơ-tê', 'Gióp', 'Thi-thiên', 'Châm-ngôn',
  'Truyền-đạo', 'Nhã-ca', 'Ê-sai', 'Giê-rê-mi', 'Ca-thương', 'Ê-xê-chi-ên', 'Đa-ni-ên',
  'Ô-sê', 'Giô-ên', 'A-mốt', 'Áp-đia', 'Giô-na', 'Mi-chê', 'Na-hum', 'Ha-ba-cúc', 'Sô-phô-ni',
  'A-gai', 'Xa-cha-ri', 'Ma-la-chi', 'Ma-thi-ơ', 'Mác', 'Lu-ca', 'Giăng', 'Công-vụ các Sứ-đồ',
  'Rô-ma', '1 Cô-rinh-tô', '2 Cô-rinh-tô', 'Ga-la-ti', 'Ê-phê-sô', 'Phi-líp', 'Cô-lô-se',
  '1 Tê-sa-lô-ni-ca', '2 Tê-sa-lô-ni-ca', '1 Ti-mô-thê', '2 Ti-mô-thê', 'Tít', 'Phi-lê-môn',
  'Hê-bơ-rơ', 'Gia-cơ', '1 Phi-e-rơ', '2 Phi-e-rơ', '1 Giăng', '2 Giăng', '3 Giăng', 'Giu-đe', 'Khải-huyền',
];

type VerseRange = {
  verse: number;
  start: number;
  end: number;
};

type SelectionInfo = {
  startVerse: number;
  endVerse: number;
  ranges: VerseRange[];
  text: string;
  label: string;
};

type BookMetadata = {
  bookIndex: number;
  name: string;
  chapterCount: number;
  chapters: number[];
};


function buildHighlightSegments(text: string, highlights: VerseHighlight[]) {
  if (!highlights.length) return [{ text }];

  const colorAt: (string | null)[] = new Array(text.length).fill(null);
  const sorted = [...highlights].sort((a, b) => a.start - b.start);

  for (const h of sorted) {
    const css = HIGHLIGHT_COLORS.find((c) => c.id === h.color)?.css;
    if (!css) continue;
    const from = Math.max(0, h.start);
    const to = Math.min(text.length, h.end);
    for (let i = from; i < to; i++) {
      colorAt[i] = css;
    }
  }

  const segments: { text: string; color?: string }[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const currentColor = colorAt[cursor];
    let next = cursor + 1;
    while (next < text.length && colorAt[next] === currentColor) next++;
    const chunk = text.slice(cursor, next);
    if (currentColor) {
      segments.push({ text: chunk, color: currentColor });
    } else {
      segments.push({ text: chunk });
    }
    cursor = next;
  }

  return segments.length ? segments : [{ text }];
}

function BibleReader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const initial = parseBibleLocation(searchParams.toString());

  
  const { user } = useAuth();
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<string>('Inter');

  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        const savedSize = localStorage.getItem('bibleFontSize');
        const savedFamily = localStorage.getItem('bibleFontFamily');
        if (savedSize) setFontSize(Number(savedSize));
        if (savedFamily) setFontFamily(savedFamily);
        return;
      }
      const { data } = await supabase.from('profiles').select('bible_font_size, bible_font_family').eq('id', user.id).single();
      if (data) {
        if (data.bible_font_size) setFontSize(data.bible_font_size);
        if (data.bible_font_family) setFontFamily(data.bible_font_family);
      }
    }
    loadPreferences();
  }, [user]);

  const [bookIndex, setBookIndex] = useState(initial.book || 1);
  const [chapter, setChapter] = useState(initial.chapter || 1);
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([]);
  const [version, setVersion] = useState('VIE1925');
  const [versionLabel, setVersionLabel] = useState(t('page_bible.version_label'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [highlights, setHighlights] = useState<VerseHighlight[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([]);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [focusVerses, setFocusVerses] = useState<{ start: number; end: number } | null>(
    initial.startVerse ? { start: initial.startVerse, end: initial.endVerse || initial.startVerse } : null,
  );
  
  // Navigation State
  const [metadata, setMetadata] = useState<BookMetadata[]>([]);
  const [navOpen, setNavOpen] = useState(false);
  const [navTab, setNavTab] = useState<'book' | 'chapter' | 'verse'>('book');
  const [navSelectedBook, setNavSelectedBook] = useState<number>(initial.book || 1);
  const [navSelectedChapter, setNavSelectedChapter] = useState<number>(initial.chapter || 1);

  const isVietnameseVersion = version === 'VIE1925' || version === 'NVB';
  const currentBookName = isVietnameseVersion 
    ? books[bookIndex - 1] 
    : (metadata[bookIndex - 1]?.name || books[bookIndex - 1]);
  const readerRef = useRef<HTMLElement>(null);
  const pendingScrollRef = useRef<number | null>(initial.startVerse || null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const { language } = useLanguage();
  const prevLangRef = useRef(language);
  useEffect(() => {
    if (prevLangRef.current !== language) {
      if (language === 'en' && (version === 'VIE1925' || version === 'NVB')) {
        setVersion('NKJV');
      } else if (language === 'vi' && version === 'NKJV') {
        setVersion('VIE1925');
      }
      prevLangRef.current = language;
    }
  }, [language, version]);

  useEffect(() => {
    const loc = parseBibleLocation(searchParams.toString());
    let changed = false;
    if (loc.book && loc.book !== bookIndex) { setBookIndex(loc.book); changed = true; }
    if (loc.chapter && loc.chapter !== chapter) { setChapter(loc.chapter); changed = true; }
    
    if (loc.startVerse) {
      setFocusVerses({ start: loc.startVerse, end: loc.endVerse || loc.startVerse });
      if (changed || loading) {
        pendingScrollRef.current = loc.startVerse;
      } else {
        requestAnimationFrame(() => {
          const el = readerRef.current?.querySelector(`[data-verse="${loc.startVerse}"]`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        const timer = setTimeout(() => setFocusVerses(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  const refreshHighlights = useCallback(() => {
    setHighlights(getChapterHighlights(bookIndex, chapter));
  }, [bookIndex, chapter]);

  useEffect(() => {
    setSelectedVerses([]);
    setSelection(null);
  }, [bookIndex, chapter]);

  useEffect(() => {
    fetch(`/api/bible/metadata?version=${version}`)
      .then(res => res.json())
      .then(data => setMetadata(data))
      .catch(console.error);
  }, [version]);

  useEffect(() => {
    fetchChapter(bookIndex, chapter, version);
    refreshHighlights();
  }, [bookIndex, chapter, version, refreshHighlights]);

  useEffect(() => {
    if (loading || !pendingScrollRef.current) return;
    const verse = pendingScrollRef.current;
    pendingScrollRef.current = null;
    requestAnimationFrame(() => {
      const el = readerRef.current?.querySelector(`[data-verse="${verse}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const timer = setTimeout(() => setFocusVerses(null), 4000);
    return () => clearTimeout(timer);
  }, [loading, verses]);

  const updateUrl = useCallback((book: number, ch: number, startVerse?: number, endVerse?: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('book', String(book));
    url.searchParams.set('chapter', String(ch));
    if (startVerse) {
      url.searchParams.set('verse', startVerse === endVerse || !endVerse ? String(startVerse) : `${startVerse}-${endVerse}`);
    } else {
      url.searchParams.delete('verse');
    }
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  const handlePrevChapter = () => {
    if (chapter > 1) {
      updateUrl(bookIndex, chapter - 1);
      setChapter(chapter - 1);
    } else if (bookIndex > 1) {
      const prevBookMeta = metadata[bookIndex - 2];
      const prevBookChapterCount = prevBookMeta ? prevBookMeta.chapterCount : 50;
      updateUrl(bookIndex - 1, prevBookChapterCount);
      setBookIndex(bookIndex - 1);
      setChapter(prevBookChapterCount);
    }
  };

  const handleNextChapter = () => {
    const currentBookMeta = metadata[bookIndex - 1];
    const chapterCount = currentBookMeta ? currentBookMeta.chapterCount : 50;
    if (chapter < chapterCount) {
      updateUrl(bookIndex, chapter + 1);
      setChapter(chapter + 1);
    } else if (bookIndex < 66) {
      updateUrl(bookIndex + 1, 1);
      setBookIndex(bookIndex + 1);
      setChapter(1);
    }
  };

  const fetchChapter = async (bIndex: number, cIndex: number, ver: string) => {
    setLoading(true);
    setError(false);
    setSelectedVerses([]);
    setSelection(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`/api/bible?book=${bIndex}&chapter=${cIndex}&version=${ver}`, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      if (!data.verses || data.error) throw new Error('No verses');
      setVerses(data.verses);
      if (data.version) setVersion(data.version);
      if (data.versionLabel) setVersionLabel(data.versionLabel);
      const { recordChapterRead } = await import('@/lib/reading-tracker');
      recordChapterRead(bIndex, cIndex);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVerses.length === 0) {
      setSelection(null);
      return;
    }
    const sorted = [...selectedVerses].sort((a, b) => a - b);
    const startVerse = sorted[0];
    const endVerse = sorted[sorted.length - 1];

    const vLabel = sorted.length === 1 ? `${startVerse}` : `${startVerse}-${endVerse}`;
    const label = `${currentBookName} ${chapter}:${vLabel} ${version}`;

    const textParts = [];
    const ranges: VerseRange[] = [];

    for (const vNum of sorted) {
      const vData = verses.find(v => v.verse === vNum);
      if (vData) {
        textParts.push(`[${vNum}] ${vData.text}`);
        ranges.push({ verse: vNum, start: 0, end: vData.text.length });
      }
    }

    setSelection({
      startVerse,
      endVerse,
      ranges,
      text: textParts.join(' '),
      label,
    });
  }, [selectedVerses, bookIndex, chapter, version, verses]);

  const toggleVerseSelection = (verseNum: number) => {
    const next = selectedVerses.includes(verseNum) ? selectedVerses.filter(v => v !== verseNum) : [...selectedVerses, verseNum];
    setSelectedVerses(next);
    
    if (next.length === 0) {
      updateUrl(bookIndex, chapter);
    } else {
      const sorted = [...next].sort((a, b) => a - b);
      updateUrl(bookIndex, chapter, sorted[0], sorted[sorted.length - 1]);
    }
  };

  const clearSelection = () => {
    setSelectedVerses([]);
    setSelection(null);
    updateUrl(bookIndex, chapter);
  };

  const applyHighlight = (color: HighlightColor) => {
    if (!selection) return;
    for (const r of selection.ranges) {
      setHighlightInRange(bookIndex, chapter, r.verse, r.start, r.end, color);
    }
    refreshHighlights();
    clearSelection();
    showToast('Đã tô sáng đoạn đã chọn');
  };

  const removeSelectionHighlight = () => {
    if (!selection) return;
    for (const r of selection.ranges) {
      removeHighlightsInRange(bookIndex, chapter, r.verse, r.start, r.end);
    }
    refreshHighlights();
    clearSelection();
    showToast('Đã xóa tô sáng');
  };

  const copySelection = async () => {
    if (!selection) return;
    const copyText = `${selection.text}\n— ${selection.label}`;
    await navigator.clipboard.writeText(copyText);
    showToast('Đã sao chép');
    clearSelection();
  };

  const openShareCard = () => {
    if (!selection) return;
    setShareOpen(true);
  };

  const closeShareCard = () => {
    setShareOpen(false);
  };

  const shareLink = selection
    ? buildBibleShareUrl(bookIndex, chapter, selection.startVerse, selection.endVerse)
    : '';
  const shareText = selection
    ? buildBibleShareText(selection.text, selection.label, shareLink)
    : '';
  const shareTargets = selection ? getShareTargets(shareLink, shareText, selection.label) : [];

  const handleNativeShare = async () => {
    if (!selection) return;
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, title: selection.label, url: shareLink });
        closeShareCard();
        clearSelection();
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      showToast('Đã sao chép nội dung chia sẻ');
      closeShareCard();
    }
  };

  const handleSharePlatform = (href: string) => {
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=520');
  };

  const copyShareContent = async () => {
    if (!selection) return;
    await navigator.clipboard.writeText(shareText);
    showToast('Đã sao chép nội dung chia sẻ');
    closeShareCard();
  };

  const copySelectionLink = async () => {
    if (!selection) return;
    const link = buildBibleShareUrl(bookIndex, chapter, selection.startVerse, selection.endVerse);
    await navigator.clipboard.writeText(link);
    showToast('Đã sao chép link');
    closeShareCard();
    clearSelection();
  };
  return (
    <div className="bible-container">
      {toast && <div className="bible-toast">{toast}</div>}

      <main className="bible-reader" ref={readerRef} style={{ fontSize: `${fontSize}px`, fontFamily }}>
        <div className="bible-sticky-header">
          <header className="bible-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '0 8px' }}>
            <div 
              className="bible-header-title" 
              onClick={() => {
                setNavSelectedBook(bookIndex);
                setNavSelectedChapter(chapter);
                setNavTab('book');
                setNavOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'var(--color-surface)',
                borderRadius: '99px',
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <span style={{ color: 'var(--color-text-main)', fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                {currentBookName} {chapter}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-main)',
                border: '1px solid var(--color-border)',
                padding: '8px 32px 8px 16px',
                borderRadius: '99px',
                fontWeight: 700,
                outline: 'none',
                appearance: 'none',
                cursor: 'pointer',
                backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polyline points="6 9 12 15 18 9"></polyline></svg>')`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '12px',
                maxWidth: '160px',
                textOverflow: 'ellipsis'
              }}
            >
              <option value="VIE1925" style={{color: '#000'}}>{t('page_bible.version_vie1925')}</option>
              <option value="NVB" style={{color: '#000'}}>{t('page_bible.version_nvb')}</option>
              <option value="NKJV" style={{color: '#000'}}>{t('page_bible.version_nkjv')}</option>
            </select>
          </header>
        </div>

        <h2 className="bible-chapter-title">
          {currentBookName} {chapter}
        </h2>

        {loading && (
          <div className="bible-loading">
            <Loader2 size={24} className="spin" /> {t('page_bible.loading')}
          </div>
        )}

        {error && !loading && (
          <div className="bible-error">
            Không thể tải chương này. Vui lòng thử lại sau.
          </div>
        )}

        {!loading && !error && verses.map((v) => {
          const verseHighlights = highlights.filter((h) => h.verse === v.verse);
          const segments = buildHighlightSegments(v.text, verseHighlights);
          const isFocused = focusVerses && v.verse >= focusVerses.start && v.verse <= focusVerses.end;

          const isSelected = selectedVerses.includes(v.verse);

          return (
            <span 
              key={v.verse} 
              className={`verse${isFocused ? ' verse-focus' : ''}${isSelected ? ' verse-selected' : ''}`} 
              data-verse={v.verse}
              onClick={() => toggleVerseSelection(v.verse)}
              style={{ cursor: 'pointer', borderRadius: '6px', transition: 'background 0.2s', padding: '2px 4px', margin: '-2px -4px', userSelect: 'none' }}
            >              <span className="verse-num">{v.verse}</span>
              <span className="verse-text">
                {segments.map((seg, i) =>
                  seg.color ? (
                    <mark key={i} className="verse-highlight" style={{ backgroundColor: seg.color }}>{seg.text}</mark>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  ),
                )}
              </span>
            </span>
          );
        })}
      </main>

      {/* Floating chapter navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', position: 'fixed', bottom: 'calc(65px + env(safe-area-inset-bottom, 0px))', left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
        <button 
          onClick={handlePrevChapter} 
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%', cursor: 'pointer', padding: '12px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (bookIndex === 1 && chapter === 1) ? 0.3 : 1, pointerEvents: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          disabled={bookIndex === 1 && chapter === 1}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <button 
          onClick={handleNextChapter} 
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%', cursor: 'pointer', padding: '12px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (bookIndex === 66 && chapter === (metadata[65]?.chapterCount || 22)) ? 0.3 : 1, pointerEvents: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          disabled={bookIndex === 66 && chapter === (metadata[65]?.chapterCount || 22)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      {selection && (
        <div className="bible-selection-sheet">
          <div className="bible-selection-header">
            <span className="bible-selection-label">
              Đang chọn: <strong>{selection.label}</strong>
            </span>
            <button type="button" className="bible-sheet-close" onClick={clearSelection} aria-label="Đóng">
              <X size={18} />
            </button>
          </div>

          <div className="bible-selection-row">
            <Highlighter size={18} />
            <span>Tô sáng</span>
            <div className="bible-highlight-colors">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="bible-color-dot"
                  style={{ backgroundColor: c.css }}
                  title={c.label}
                  onClick={() => applyHighlight(c.id)}
                />
              ))}
            </div>
          </div>

          <button type="button" className="bible-selection-action" onClick={copySelection}>
            <Copy size={18} /> Sao chép
          </button>
          <button type="button" className="bible-selection-action" onClick={copySelectionLink}>
            <Link2 size={18} /> Sao chép link
          </button>
          <button type="button" className="bible-selection-action" onClick={openShareCard}>
            <Share2 size={18} /> Chia sẻ link
          </button>
          <button type="button" className="bible-selection-action bible-selection-action-muted" onClick={removeSelectionHighlight}>
            <X size={18} /> Xóa tô sáng
          </button>
        </div>
      )}

      {shareOpen && selection && (
        <div className="bible-share-overlay" onClick={closeShareCard} role="presentation">
          <div className="bible-share-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('page_bible.share_title')}>
            <div className="bible-share-header">
              <h3>{t('page_bible.share_title')}</h3>
              <button type="button" className="bible-sheet-close" onClick={closeShareCard} aria-label="Đóng">
                <X size={18} />
              </button>
            </div>
            <p className="bible-share-preview">{selection.label}</p>
            <p className="bible-share-excerpt">&ldquo;{selection.text.slice(0, 120)}{selection.text.length > 120 ? '…' : ''}&rdquo;</p>
            <div className="bible-share-grid">
              {shareTargets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  className="bible-share-platform"
                  onClick={() => handleSharePlatform(target.href)}
                >
                  <span className="bible-share-platform-icon" style={{ backgroundColor: target.color }}>
                    <SharePlatformIcon id={target.id} />
                  </span>
                  <span>{target.label}</span>
                </button>
              ))}
            </div>
            <div className="bible-share-actions">
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button type="button" className="bible-share-btn bible-share-btn-primary" onClick={handleNativeShare}>
                  <Share2 size={16} /> Chia sẻ nhanh
                </button>
              )}
              <button type="button" className="bible-share-btn" onClick={copyShareContent}>
                <Copy size={16} /> Sao chép nội dung
              </button>
              <button type="button" className="bible-share-btn" onClick={copySelectionLink}>
                <Link2 size={16} /> Sao chép link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigator Modal */}
      {navOpen && (
        <div className="bible-nav-overlay" onClick={() => setNavOpen(false)}>
          <div className="bible-nav-modal" onClick={e => e.stopPropagation()}>
            <div className="bible-nav-handle" />
            <div className="bible-nav-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem', padding: '0 1rem' }}>
              <button 
                onClick={() => setNavTab('book')} 
                style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: navTab === 'book' ? '2px solid #48bce1' : '2px solid transparent', color: navTab === 'book' ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >{t('page_bible.select_book')}</button>
              <button 
                onClick={() => setNavTab('chapter')} 
                style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: navTab === 'chapter' ? '2px solid #48bce1' : '2px solid transparent', color: navTab === 'chapter' ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >{t('page_bible.select_chapter')}</button>
              <button 
                onClick={() => setNavTab('verse')} 
                style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: navTab === 'verse' ? '2px solid #48bce1' : '2px solid transparent', color: navTab === 'verse' ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >CÂU</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem' }}>
              {navTab === 'book' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '8px', marginTop: '4px' }}>{t('page_bible.old_testament')}</div>
                  {books.slice(0, 39).map((b, idx) => (
                    <button key={idx} onClick={() => { setNavSelectedBook(idx + 1); setNavSelectedChapter(1); setNavTab('chapter'); }} style={{ background: navSelectedBook === idx + 1 ? 'var(--color-primary-light, rgba(72,188,225,0.1))' : 'transparent', color: navSelectedBook === idx + 1 ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '12px', textAlign: 'left', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{b}</button>
                  ))}
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '8px', marginTop: '16px' }}>{t('page_bible.new_testament')}</div>
                  {books.slice(39).map((b, idx) => (
                    <button key={idx + 39} onClick={() => { setNavSelectedBook(idx + 40); setNavSelectedChapter(1); setNavTab('chapter'); }} style={{ background: navSelectedBook === idx + 40 ? 'var(--color-primary-light, rgba(72,188,225,0.1))' : 'transparent', color: navSelectedBook === idx + 40 ? 'var(--color-primary)' : 'var(--color-text-main)', padding: '12px', textAlign: 'left', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>{b}</button>
                  ))}
                </div>
              )}

              {navTab === 'chapter' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {Array.from({ length: metadata[navSelectedBook - 1]?.chapterCount || 1 }).map((_, i) => (
                    <button key={i} onClick={() => { setNavSelectedChapter(i + 1); setNavTab('verse'); }} style={{ aspectRatio: '1', background: navSelectedChapter === i + 1 ? 'var(--color-primary)' : 'var(--color-surface)', color: navSelectedChapter === i + 1 ? 'var(--color-text-main)' : '#e5e7eb', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>{i + 1}</button>
                  ))}
                </div>
              )}

              {navTab === 'verse' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  <button onClick={() => { setNavOpen(false); setBookIndex(navSelectedBook); setChapter(navSelectedChapter); setFocusVerses(null); updateUrl(navSelectedBook, navSelectedChapter); }} style={{ gridColumn: 'span 5', padding: '12px', background: 'var(--color-primary-light, rgba(72,188,225,0.1))', color: 'var(--color-primary)', borderRadius: '8px', border: '1px solid var(--color-primary-light, rgba(72,188,225,0.3))', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginBottom: '8px' }}>Đọc cả chương</button>
                  {Array.from({ length: metadata[navSelectedBook - 1]?.chapters[navSelectedChapter - 1] || 1 }).map((_, i) => (
                    <button key={i} onClick={() => {
                      setNavOpen(false);
                      setBookIndex(navSelectedBook);
                      setChapter(navSelectedChapter);
                      setFocusVerses({ start: i + 1, end: i + 1 });
                      pendingScrollRef.current = i + 1;
                      updateUrl(navSelectedBook, navSelectedChapter, i + 1);
                    }} style={{ aspectRatio: '1', background: 'var(--color-surface)', color: '#e5e7eb', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>{i + 1}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BiblePage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'read' | 'plans'>('read');
  const router = useRouter();
  
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-background)' }}>
       <div style={{ display: 'flex', background: 'var(--color-surface)', padding: '10px 10px 0', borderBottom: '1px solid var(--color-border)' }}>
          <button 
             onClick={() => setActiveTab('read')}
             style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'read' ? '2px solid #48bce1' : '2px solid transparent', color: activeTab === 'read' ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
             {t('page_bible.read_title')}
          </button>
          <button 
             onClick={() => setActiveTab('plans')}
             style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: activeTab === 'plans' ? '2px solid #48bce1' : '2px solid transparent', color: activeTab === 'plans' ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          >
             KẾ HOẠCH
          </button>
       </div>
       <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
         {activeTab === 'read' ? (
           <Suspense fallback={
             <div className="bible-container">
               <div className="bible-loading"><Loader2 size={24} className="spin" /> {t('page_bible.loading')}</div>
             </div>
           }>
             <BibleReader />
           </Suspense>
         ) : (
            <BiblePlans onStartReading={(book, chapter) => {
              if (book && chapter) {
                const params = new URLSearchParams(window.location.search);
                params.set('book', book.toString());
                params.set('chapter', chapter.toString());
                router.push(`/bible?${params.toString()}`);
              }
              setActiveTab('read');
            }} />
         )}
       </div>
    </div>
  );
}
