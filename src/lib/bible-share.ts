export function buildBibleShareUrl(
  book: number,
  chapter: number,
  startVerse: number,
  endVerse?: number,
): string {
  if (typeof window === 'undefined') return '';
  const url = new URL('/bible', window.location.origin);
  url.searchParams.set('book', String(book));
  url.searchParams.set('chapter', String(chapter));
  if (startVerse === endVerse || !endVerse) {
    url.searchParams.set('verse', String(startVerse));
  } else {
    url.searchParams.set('verse', `${startVerse}-${endVerse}`);
  }
  return url.toString();
}

export function buildBibleShareText(text: string, label: string, link: string): string {
  return `${text}\n— ${label}\n${link}`;
}

export function getShareTargets(link: string, shareText: string, title: string) {
  const encodedLink = encodeURIComponent(link);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(title);

  return [
    {
      id: 'facebook',
      label: 'Facebook',
      color: '#1877F2',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}&quote=${encodedText}`,
    },
    {
      id: 'zalo',
      label: 'Zalo',
      color: '#0068FF',
      href: `https://zalo.me/share?url=${encodedLink}`,
    },
    {
      id: 'messenger',
      label: 'Messenger',
      color: '#0084FF',
      href: `https://www.facebook.com/dialog/send?link=${encodedLink}&app_id=87741124305&redirect_uri=${encodedLink}`,
    },
    {
      id: 'twitter',
      label: 'X (Twitter)',
      color: '#000000',
      href: `https://twitter.com/intent/tweet?text=${encodedText}`,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      color: '#26A5E4',
      href: `https://t.me/share/url?url=${encodedLink}&text=${encodedTitle}`,
    },
  ];
}

export function parseBibleLocation(search: string): {
  book?: number;
  chapter?: number;
  startVerse?: number;
  endVerse?: number;
} {
  const params = new URLSearchParams(search);
  const book = Number(params.get('book'));
  const chapter = Number(params.get('chapter'));
  const verseParam = params.get('verse') || '';

  let startVerse: number | undefined;
  let endVerse: number | undefined;

  if (verseParam.includes('-')) {
    const [a, b] = verseParam.split('-').map(Number);
    if (!Number.isNaN(a)) startVerse = a;
    if (!Number.isNaN(b)) endVerse = b;
  } else {
    const v = Number(verseParam);
    if (!Number.isNaN(v)) {
      startVerse = v;
      endVerse = v;
    }
  }

  return {
    book: Number.isNaN(book) ? undefined : book,
    chapter: Number.isNaN(chapter) ? undefined : chapter,
    startVerse,
    endVerse,
  };
}

const BIBLE_BOOKS = [
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

export function parseVerseReference(reference: string): { book?: number; chapter?: number; verse?: string } {
  // Example input: "Giăng 3:16" or "Thi-thiên 23:1-2"
  const match = reference.match(/^(.+?)\s+(\d+):(\d+(?:-\d+)?)$/);
  if (!match) return {};

  const bookName = match[1].trim();
  const chapter = parseInt(match[2], 10);
  const verse = match[3];

  const bookIndex = BIBLE_BOOKS.findIndex(b => b.toLowerCase() === bookName.toLowerCase());
  
  if (bookIndex === -1) return {};

  return {
    book: bookIndex + 1,
    chapter,
    verse,
  };
}

