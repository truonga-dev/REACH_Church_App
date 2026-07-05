import { fetchNewsPosts, getFeaturedNewsPost } from '../news';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('News Library', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchNewsPosts', () => {
    it('should fetch news from the "news" table and handle pagination', async () => {
      const mockData = [{ id: '1', title: 'Test News' }];
      const rangeMock = jest.fn().mockResolvedValue({ data: mockData, error: null });
      const orderMock = jest.fn().mockReturnValue({ range: rangeMock });
      const selectMock = jest.fn().mockReturnValue({ order: orderMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const result = await fetchNewsPosts(10, 0);

      expect(supabase.from).toHaveBeenCalledWith('news');
      expect(selectMock).toHaveBeenCalledWith('*');
      expect(orderMock).toHaveBeenCalledWith('published_at', { ascending: false });
      expect(rangeMock).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockData);
    });
  });

  describe('getFeaturedNewsPost', () => {
    it('should query for news where image_url is not null', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: { id: '2' }, error: null });
      const limitMock = jest.fn().mockReturnValue({ single: singleMock });
      const orderMock = jest.fn().mockReturnValue({ limit: limitMock });
      const notMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ not: notMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const result = await getFeaturedNewsPost();

      expect(supabase.from).toHaveBeenCalledWith('news');
      expect(notMock).toHaveBeenCalledWith('image_url', 'is', null);
      expect(result).toEqual({ id: '2' });
    });
  });
});
