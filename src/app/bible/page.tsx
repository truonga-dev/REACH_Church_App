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

function findVerseElement(node: Node | null): Element | null {
  if (!node) return null;
  const el =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  return el?.closest?.('[data-verse]') ?? null;
}

function verseTextLength(verseEl: Element): number {
  return verseEl.querySelector('.verse-text')?.textContent?.length ?? 0;
}

function offsetInVerse(verseEl: Element, container: Node, offset: number): number {
  const verseTextEl = verseEl.querySelector('.verse-text');
  if (!verseTextEl) return 0;
  const preRange = document.createRange();
  preRange.selectNodeContents(verseTextEl);
  preRange.setEnd(container, offset);
  return preRange.toString().length;
}

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
  const initial = parseBibleLocation(searchParams.toString());

  const [bookIndex, setBookIndex] = useState(initial.book || 1);
  const [chapter, setChapter] = useState(initial.chapter || 1);
  const [verses, setVerses] = useState<{ verse: number; text: string }[]>([]);
  const [version, setVersion] = useState('VIE1925');
  const [versionLabel, setVersionLabel] = useState('Kinh Thánh Tiếng Việt Bản Truyền Thống Hiệu Đính (VIE1925)');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [highlights, setHighlights] = useState<VerseHighlight[]>([]);
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [focusVerses, setFocusVerses] = useState<{ start: number; end: number } | null>(
    initial.startVerse ? { start: initial.startVerse, end: initial.endVerse || initial.startVerse } : null,
  );
  const readerRef = useRef<HTMLElement>(null);
  const pendingScrollRef = useRef<number | null>(initial.startVerse || null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const refreshHighlights = useCallback(() => {
    setHighlights(getChapterHighlights(bookIndex, chapter));
  }, [bookIndex, chapter]);

  useEffect(() => {
    fetchChapter(bookIndex, chapter);
    refreshHighlights();
  }, [bookIndex, chapter, refreshHighlights]);

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
  const fetchChapter = async (bIndex: number, cIndex: number) => {
    setLoading(true);
    setError(false);
    setSelection(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`/api/bible?book=${bIndex}&chapter=${cIndex}`, { signal: controller.signal });
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

  const parseSelection = useCallback((): SelectionInfo | null => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !readerRef.current) return null;

    const range = sel.getRangeAt(0);
    if (!readerRef.current.contains(range.commonAncestorContainer)) return null;

    const startVerseEl = findVerseElement(range.startContainer);
    const endVerseEl = findVerseElement(range.endContainer);
    if (!startVerseEl || !endVerseEl) return null;

    const startVerse = Number(startVerseEl.getAttribute('data-verse'));
    const endVerse = Number(endVerseEl.getAttribute('data-verse'));
    const text = range.toString().trim();
    if (!text) return null;

    const bookName = books[bookIndex - 1];
    const verseLabel =
      startVerse === endVerse
        ? `${bookName} ${chapter}:${startVerse}`
        : `${bookName} ${chapter}:${startVerse}-${endVerse}`;

    const ranges: VerseRange[] = [];

    if (startVerse === endVerse) {
      ranges.push({
        verse: startVerse,
        start: offsetInVerse(startVerseEl, range.startContainer, range.startOffset),
        end: offsetInVerse(startVerseEl, range.endContainer, range.endOffset),
      });
    } else {
      const verseEls = Array.from(readerRef.current.querySelectorAll('[data-verse]')) as Element[];
      for (const verseEl of verseEls) {
        const verse = Number(verseEl.getAttribute('data-verse'));
        if (verse < startVerse || verse > endVerse) continue;

        if (verse === startVerse) {
          ranges.push({
            verse,
            start: offsetInVerse(verseEl, range.startContainer, range.startOffset),
            end: verseTextLength(verseEl),
          });
        } else if (verse === endVerse) {
          ranges.push({
            verse,
            start: 0,
            end: offsetInVerse(verseEl, range.endContainer, range.endOffset),
          });
        } else {
          ranges.push({
            verse,
            start: 0,
            end: verseTextLength(verseEl),
          });
        }
      }
    }

    return {
      startVerse,
      endVerse,
      ranges,
      text,
      label: `${verseLabel} ${version}`,
    };
  }, [bookIndex, chapter, version]);

  const handleSelectionChange = useCallback(() => {
    const info = parseSelection();
    setSelection(info);
  }, [parseSelection]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const applyHighlight = (color: HighlightColor) => {
    if (!selection) return;
    for (const r of selection.ranges) {
      setHighlightInRange(bookIndex, chapter, r.verse, r.start, r.end, color);
    }
    refreshHighlights();
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    showToast('Đã tô sáng đoạn đã chọn');
  };

  const removeSelectionHighlight = () => {
    if (!selection) return;
    for (const r of selection.ranges) {
      removeHighlightsInRange(bookIndex, chapter, r.verse, r.start, r.end);
    }
    refreshHighlights();
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    showToast('Đã xóa tô sáng');
  };

  const copySelection = async () => {
    if (!selection) return;
    const copyText = `${selection.text}\n— ${selection.label}`;
    await navigator.clipboard.writeText(copyText);
    showToast('Đã sao chép');
    window.getSelection()?.removeAllRanges();
    setSelection(null);
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
        window.getSelection()?.removeAllRanges();
        setSelection(null);
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
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  };
  return (
    <div className="bible-container">
      {toast && <div className="bible-toast">{toast}</div>}

      <header className="bible-header">
        <select
          className="book-selector"
          value={bookIndex}
          onChange={(e) => {
            const nextBook = Number(e.target.value);
            setBookIndex(nextBook);
            setChapter(1);
            setFocusVerses(null);
            updateUrl(nextBook, 1);
          }}        >
          {books.map((b, idx) => (
            <option key={b} value={idx + 1}>{b}</option>
          ))}
        </select>

        <div className="bible-chapter-nav">
          <button type="button" className="chapter-selector" onClick={() => { const ch = Math.max(1, chapter - 1); setChapter(ch); setFocusVerses(null); updateUrl(bookIndex, ch); }}>«</button>
          <span className="bible-chapter-label">Ch. {chapter}</span>
          <button type="button" className="chapter-selector" onClick={() => { const ch = chapter + 1; setChapter(ch); setFocusVerses(null); updateUrl(bookIndex, ch); }}>»</button>        </div>
      </header>

      <p className="bible-version-badge">{versionLabel}</p>

      <main className="bible-reader" ref={readerRef}>
        <h2 className="bible-chapter-title">
          {books[bookIndex - 1]} {chapter}
        </h2>

        {loading && (
          <div className="bible-loading">
            <Loader2 size={24} className="spin" /> Đang tải Kinh Thánh...
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

          return (
            <span key={v.verse} className={`verse${isFocused ? ' verse-focus' : ''}`} data-verse={v.verse}>              <span className="verse-num">{v.verse}</span>
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

      {selection && (
        <div className="bible-selection-sheet">
          <div className="bible-selection-header">
            <span className="bible-selection-label">
              Đang chọn: <strong>{selection.label}</strong>
            </span>
            <button type="button" className="bible-sheet-close" onClick={() => { setSelection(null); window.getSelection()?.removeAllRanges(); }} aria-label="Đóng">
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
          <div className="bible-share-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Chia sẻ đoạn Kinh Thánh">
            <div className="bible-share-header">
              <h3>Chia sẻ đoạn Kinh Thánh</h3>
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
    </div>
  );
}

export default function BiblePage() {
  return (
    <Suspense fallback={
      <div className="bible-container">
        <div className="bible-loading"><Loader2 size={24} className="spin" /> Đang tải Kinh Thánh...</div>
      </div>
    }>
      <BibleReader />
    </Suspense>
  );
}
