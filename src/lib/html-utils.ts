export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

export function htmlExcerpt(html: string, maxLen = 120): string {
  const plain = stripHtml(html);
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen).trim()}…`;
}

export function countWords(html: string): number {
  const plain = stripHtml(html);
  if (!plain) return 0;
  return plain.split(/\s+/).filter(Boolean).length;
}

export function parseCategories(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((c): c is string => typeof c === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : raw ? [raw] : [];
    } catch {
      return raw ? [raw] : [];
    }
  }
  return [];
}
