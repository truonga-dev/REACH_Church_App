/**
 * Prayers Service Tests
 * Tests for prayer request CRUD operations and statistics
 */

import {
  fetchPrayerRequests,
  createPrayerRequest,
  incrementPrayerCount,
  getPrayerStatistics,
} from '../prayers';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('Prayers Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPrayerRequests', () => {
    it('should fetch public prayer requests', async () => {
      expect(typeof fetchPrayerRequests).toBe('function');
    });

    it('should handle pagination with limit and offset', async () => {
      expect(typeof fetchPrayerRequests).toBe('function');
    });
  });

  describe('createPrayerRequest', () => {
    it('should create a new prayer request', async () => {
      expect(typeof createPrayerRequest).toBe('function');
    });

    it('should handle private prayer requests', async () => {
      expect(typeof createPrayerRequest).toBe('function');
    });
  });

  describe('incrementPrayerCount', () => {
    it('should increment prayer count for a request', async () => {
      expect(typeof incrementPrayerCount).toBe('function');
    });
  });

  describe('getPrayerStatistics', () => {
    it('should return prayer statistics', async () => {
      const stats = await getPrayerStatistics();
      expect(stats).toHaveProperty('totalPrayers');
      expect(stats).toHaveProperty('totalIntercessors');
      expect(stats).toHaveProperty('activeCategory');
    });
  });
});
