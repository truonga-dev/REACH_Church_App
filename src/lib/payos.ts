/**
 * PayOS Client Factory – SERVER ONLY
 * Sử dụng lazy initialization để tránh lỗi khi build (thiếu env vars).
 * Chỉ dùng trong API routes, không import vào Client Components.
 */
import { PayOS } from '@payos/node';

let _payos: PayOS | null = null;

/**
 * Trả về PayOS instance. Throw lỗi rõ ràng nếu thiếu env.
 */
export function getPayOS(): PayOS {
  if (_payos) return _payos;

  const clientId = process.env.PAYOS_CLIENT_ID;
  const apiKey = process.env.PAYOS_API_KEY;
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error(
      '[PayOS] Missing environment variables.\n' +
      'Thêm PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY vào .env.local\n' +
      'Đăng ký tài khoản tại: https://my.payos.vn',
    );
  }

  _payos = new PayOS({ clientId, apiKey, checksumKey });
  return _payos;
}
