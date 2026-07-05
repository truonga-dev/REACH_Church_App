import { getDonorDisplayName, createDonation, fetchUserDonations } from '../donations';
import { supabase } from '../supabase';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Donations Library', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDonorDisplayName', () => {
    it('should return donor_name if present', () => {
      expect(getDonorDisplayName({ donor_name: 'John Doe' })).toBe('John Doe');
    });

    it('should fall back to profile full_name if donor_name is empty', () => {
      expect(getDonorDisplayName({ profile: { full_name: 'Jane Doe' } })).toBe('Jane Doe');
    });

    it('should fall back to email if both names are missing', () => {
      expect(getDonorDisplayName({ profile: { email: 'test@example.com' } })).toBe('test@example.com');
    });

    it('should return "Ẩn danh" if nothing is provided', () => {
      expect(getDonorDisplayName({})).toBe('Ẩn danh');
    });
  });

  describe('createDonation', () => {
    it('should insert a donation into the database', async () => {
      const mockInput = { amount: 1000, category: 'Tithes', currency: 'VND' };
      const singleMock = jest.fn().mockResolvedValue({ data: { id: 'donation-1', ...mockInput }, error: null });
      const selectMock = jest.fn().mockReturnValue({ single: singleMock });
      const insertMock = jest.fn().mockReturnValue({ select: selectMock });
      (supabase.from as jest.Mock).mockReturnValue({ insert: insertMock });

      const result = await createDonation(mockInput, 'user-123');

      expect(supabase.from).toHaveBeenCalledWith('donations');
      expect(insertMock).toHaveBeenCalledWith([{
        amount: 1000,
        currency: 'VND',
        category: 'Tithes',
        payment_method: null,
        transaction_id: null,
        notes: null,
        user_id: 'user-123',
        status: 'pending',
      }]);
      expect(result).toHaveProperty('id', 'donation-1');
    });
  });

  describe('fetchUserDonations', () => {
    it('should query donations by user_id', async () => {
      const orderMock = jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });
      const eqMock = jest.fn().mockReturnValue({ order: orderMock });
      const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
      (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

      const result = await fetchUserDonations('user-1');

      expect(supabase.from).toHaveBeenCalledWith('donations');
      expect(eqMock).toHaveBeenCalledWith('user_id', 'user-1');
      expect(result).toEqual([{ id: '1' }]);
    });
  });
});
