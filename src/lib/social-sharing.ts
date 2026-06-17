/**
 * Social Media Sharing Service
 */

export interface ShareData {
  title: string;
  text: string;
  url: string;
  platform?: 'whatsapp' | 'telegram' | 'facebook' | 'twitter' | 'email';
}

/**
 * Share verse to WhatsApp
 */
export const shareToWhatsApp = (
  verseRef: string,
  verseText: string,
  bookName: string
): void => {
  const message = encodeURIComponent(
    `📖 "${verseText}"\n\n— ${bookName} ${verseRef}\n\nShared via REACH Church App 🙏`
  );
  const url = `https://wa.me/?text=${message}`;
  window.open(url, '_blank');
};

/**
 * Share verse to Telegram
 */
export const shareToTelegram = (
  verseRef: string,
  verseText: string,
  bookName: string
): void => {
  const message = encodeURIComponent(
    `📖 "${verseText}"\n\n— ${bookName} ${verseRef}\n\nShared via REACH Church App 🙏`
  );
  const url = `https://t.me/share/url?url=${encodeURIComponent(
    window.location.href
  )}&text=${message}`;
  window.open(url, '_blank');
};

/**
 * Share verse to Facebook
 */
export const shareToFacebook = (verseRef: string, shareUrl: string): void => {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  window.open(url, '_blank', 'width=600,height=400');
};

/**
 * Share verse to Twitter
 */
export const shareToTwitter = (
  verseRef: string,
  verseText: string,
  bookName: string,
  shareUrl: string
): void => {
  const text = encodeURIComponent(
    `📖 "${verseText}" — ${bookName} ${verseRef}\n\nShared via @reachchurchvn`
  );
  const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(
    shareUrl
  )}&hashtags=Bible,Scripture,ReachChurch`;
  window.open(url, '_blank', 'width=600,height=400');
};

/**
 * Share via email
 */
export const shareViaEmail = (
  verseRef: string,
  verseText: string,
  bookName: string,
  shareUrl: string
): void => {
  const subject = encodeURIComponent(`Chia sẻ Kinh Thánh: ${bookName} ${verseRef}`);
  const body = encodeURIComponent(
    `"${verseText}"\n\n— ${bookName} ${verseRef}\n\n${shareUrl}\n\nShared via REACH Church App 🙏`
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

/**
 * Copy share link to clipboard
 */
export const copyShareLink = async (shareUrl: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch (error) {
    console.error('Failed to copy link:', error);
    return false;
  }
};

/**
 * Share to all platforms (shows menu)
 */
export const showShareMenu = (
  verseRef: string,
  verseText: string,
  bookName: string,
  shareUrl: string,
  _onPlatformSelect?: (platform: string) => void
): { name: string; icon: string; action: () => void }[] => {
  const platforms = [
    {
      name: 'WhatsApp',
      icon: '💬',
      action: () => shareToWhatsApp(verseRef, verseText, bookName),
    },
    {
      name: 'Telegram',
      icon: '✈️',
      action: () => shareToTelegram(verseRef, verseText, bookName),
    },
    {
      name: 'Facebook',
      icon: 'f',
      action: () => shareToFacebook(verseRef, shareUrl),
    },
    {
      name: 'Twitter',
      icon: '𝕏',
      action: () => shareToTwitter(verseRef, verseText, bookName, shareUrl),
    },
    {
      name: 'Email',
      icon: '✉️',
      action: () => shareViaEmail(verseRef, verseText, bookName, shareUrl),
    },
    {
      name: 'Copy Link',
      icon: '🔗',
      action: () => copyShareLink(shareUrl),
    },
  ];

  return platforms;
};

/**
 * Get share count for social platforms
 */
export const getShareMetrics = async (_url: string): Promise<Record<string, number>> => {
  // This would require backend integration with social APIs
  // For now, return empty metrics
  return {
    whatsapp: 0,
    telegram: 0,
    facebook: 0,
    twitter: 0,
  };
};

/**
 * Generate share URL for verse
 */
export const generateVerseShareUrl = (
  baseUrl: string,
  book: number,
  chapter: number,
  verse: number
): string => {
  return `${baseUrl}/bible?book=${book}&chapter=${chapter}&verse=${verse}`;
};

/**
 * Generate share URL for news
 */
export const generateNewsShareUrl = (baseUrl: string, newsId: string): string => {
  return `${baseUrl}/news/${newsId}`;
};

/**
 * Generate share text for verse
 */
export const generateVerseShareText = (
  verseText: string,
  bookName: string,
  verseRef: string,
  includeUrl = true,
  shareUrl = ''
): string => {
  let text = `📖 "${verseText}"\n\n— ${bookName} ${verseRef}`;
  if (includeUrl && shareUrl) {
    text += `\n\n${shareUrl}`;
  }
  text += '\n\nShared via REACH Church App 🙏';
  return text;
};
