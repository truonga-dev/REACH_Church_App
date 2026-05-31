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
