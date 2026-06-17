/**
 * Bible Search Service - Full-text search on local Bible data
 */

export interface BibleSearchResult {
  book: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  highlight?: string; // HTML with highlights
}

interface BibleCacheData {
  book: number;
  name: string;
  chapters: { chapter: number; verses: { verse: number; text: string; }[] }[];
}

// Helper to normalize Vietnamese text (including handling 'đ' character)
const normalizeVietnamese = (str: string) => {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
};

// Cache for Bible data
let bibleCache: BibleCacheData[] | null = null;

/**
 * Load Bible data from public/bible_vie.json
 */
const loadBibleData = async () => {
  if (bibleCache) return bibleCache;

  try {
    const response = await fetch('/bible_vie.json');
    bibleCache = await response.json();
    return bibleCache;
  } catch (error) {
    console.error('Failed to load Bible data:', error);
    return null;
  }
};

/**
 * Search Bible verses by keyword
 */
export const searchBible = async (query: string): Promise<BibleSearchResult[]> => {
  if (!query || query.trim().length < 2) return [];

  const bible = await loadBibleData();
  if (!bible) return [];

  const searchQuery = normalizeVietnamese(query);
  const results: BibleSearchResult[] = [];

  // Search through all books
  for (const book of bible) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        const verseText = normalizeVietnamese(verse.text);

        // Simple keyword match (case-insensitive, accent-insensitive)
        if (verseText.includes(searchQuery)) {
          results.push({
            book: book.book,
            bookName: book.name,
            chapter: chapter.chapter,
            verse: verse.verse,
            text: verse.text,
            highlight: highlightText(verse.text, query),
          });

          // Limit results to 50
          if (results.length >= 50) {
            return results;
          }
        }
      }
    }
  }

  return results;
};

/**
 * Highlight search term in text
 */
const highlightText = (text: string, query: string): string => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark style="background: #FEF08A; color: inherit;">$1</mark>');
};

/**
 * Search by book name
 */
export const searchByBook = async (bookName: string): Promise<BibleSearchResult[]> => {
  const bible = await loadBibleData();
  if (!bible) return [];

  const results: BibleSearchResult[] = [];
  const searchName = normalizeVietnamese(bookName);

  for (const book of bible) {
    const name = normalizeVietnamese(book.name);

    if (name.includes(searchName)) {
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          results.push({
            book: book.book,
            bookName: book.name,
            chapter: chapter.chapter,
            verse: verse.verse,
            text: verse.text,
          });
        }
      }
    }
  }

  return results;
};

/**
 * Advanced search with filters
 */
export const advancedSearch = async (
  query: string,
  filters?: {
    books?: number[]; // Specific book numbers
    minVerses?: number;
    maxVerses?: number;
  }
): Promise<BibleSearchResult[]> => {
  if (!query || query.trim().length < 2) return [];

  const bible = await loadBibleData();
  if (!bible) return [];

  const searchQuery = normalizeVietnamese(query);
  const results: BibleSearchResult[] = [];

  for (const book of bible) {
    // Apply book filter if specified
    if (filters?.books && !filters.books.includes(book.book)) {
      continue;
    }

    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) {
        // Apply verse range filter
        if (
          filters?.minVerses &&
          filters?.maxVerses &&
          (verse.verse < filters.minVerses || verse.verse > filters.maxVerses)
        ) {
          continue;
        }

        const verseText = normalizeVietnamese(verse.text);

        if (verseText.includes(searchQuery)) {
          results.push({
            book: book.book,
            bookName: book.name,
            chapter: chapter.chapter,
            verse: verse.verse,
            text: verse.text,
            highlight: highlightText(verse.text, query),
          });

          if (results.length >= 100) {
            return results;
          }
        }
      }
    }
  }

  return results;
};

/**
 * Get books list from Bible data
 */
export const getBibleBooks = async () => {
  const bible = await loadBibleData();
  if (!bible) return [];

  return bible.map((b: BibleCacheData) => ({
    number: b.book,
    name: b.name,
    chapters: b.chapters.length,
  }));
};
