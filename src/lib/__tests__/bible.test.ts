/**
 * Example test file for bible utilities
 * 
 * Usage:
 * npm run test -- bible.test.ts
 * npm run test:watch -- bible.test.ts
 * npm run test:coverage -- bible.test.ts
 */

import { searchBible, searchByBook, getBibleBooks } from '../bible-search';

describe('Bible Search', () => {
  // We mock the global fetch used by loadBibleData
  beforeAll(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve([
          {
            book: 1,
            name: 'Sáng Thế Ký',
            chapters: [
              {
                chapter: 1,
                verses: [
                  { verse: 1, text: 'Ban đầu Đức Chúa Trời dựng nên trời đất.' },
                  { verse: 2, text: 'Vả, đất là vô hình và trống không...' }
                ]
              }
            ]
          },
          {
            book: 43,
            name: 'Giăng',
            chapters: [
              {
                chapter: 3,
                verses: [
                  { verse: 16, text: 'Vì Đức Chúa Trời yêu thương thế gian...' }
                ]
              }
            ]
          }
        ])
      })
    ) as jest.Mock;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('searchBible', () => {
    test('should return empty for short queries', async () => {
      const results = await searchBible('a');
      expect(results.length).toBe(0);
    });

    test('should return correct verse matching keyword', async () => {
      const results = await searchBible('trời đất');
      expect(results.length).toBe(1);
      expect(results[0].text).toContain('dựng nên trời đất');
      expect(results[0].bookName).toBe('Sáng Thế Ký');
      expect(results[0].highlight).toContain('<mark');
    });

    test('should return correct verse matching keyword ignoring case/accents', async () => {
      const results = await searchBible('duc chua troi');
      expect(results.length).toBe(2);
    });
  });

  describe('searchByBook', () => {
    test('should return verses of a specific book', async () => {
      const results = await searchByBook('Giăng');
      expect(results.length).toBe(1);
      expect(results[0].bookName).toBe('Giăng');
    });
  });

  describe('getBibleBooks', () => {
    test('should return list of books', async () => {
      const books = await getBibleBooks();
      expect(books.length).toBe(2);
      expect(books[0].name).toBe('Sáng Thế Ký');
    });
  });
});
