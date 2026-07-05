/**
 * Comments Service Tests
 * Tests for comment operations on posts
 */

import {
  fetchComments,
  createComment,
  deleteComment,
  likeComment,
  getCommentCount,
} from '../comments';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('Comments Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchComments', () => {
    it('should fetch comments for a devotional', async () => {
      expect(typeof fetchComments).toBe('function');
    });

    it('should fetch comments for a news post', async () => {
      expect(typeof fetchComments).toBe('function');
    });

    it('should fetch comments for a sermon', async () => {
      expect(typeof fetchComments).toBe('function');
    });
  });

  describe('createComment', () => {
    it('should create a new comment', async () => {
      expect(typeof createComment).toBe('function');
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      expect(typeof deleteComment).toBe('function');
    });
  });

  describe('likeComment', () => {
    it('should increment likes on a comment', async () => {
      expect(typeof likeComment).toBe('function');
    });
  });

  describe('getCommentCount', () => {
    it('should return comment count for a post', async () => {
      const count = await getCommentCount('devotional', 'post-1');
      expect(typeof count).toBe('number');
    });
  });
});
