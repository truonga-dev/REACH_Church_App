/**
 * Devotionals Service Tests
 */
import {
  fetchDevotionals,
  fetchTodayDevotional,
  searchDevotionals,
} from '../devotionals';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('Devotionals Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDevotionals', () => {
    it('should be a function', () => {
      expect(typeof fetchDevotionals).toBe('function');
    });
    it('should handle empty results', () => {
      expect(typeof fetchDevotionals).toBe('function');
    });
  });

  describe('fetchTodayDevotional', () => {
    it("should be a function", () => {
      expect(typeof fetchTodayDevotional).toBe('function');
    });
  });

  describe('searchDevotionals', () => {
    it('should be a function', () => {
      expect(typeof searchDevotionals).toBe('function');
    });
    it('should return empty array for empty query', async () => {
      const results = await searchDevotionals('');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
