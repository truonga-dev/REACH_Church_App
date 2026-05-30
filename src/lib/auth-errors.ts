const AUTH_ERROR_MAP: Record<string, string> = {
  'Email not confirmed':
    'Email chưa được xác nhận. Vui lòng mở hộp thư và bấm link xác nhận trong email Supabase gửi cho bạn.',
  'Invalid login credentials':
    'Email hoặc mật khẩu không đúng.',
  'User already registered':
    'Email này đã được đăng ký. Hãy thử đăng nhập.',
  'Password should be at least 6 characters':
    'Mật khẩu phải có ít nhất 6 ký tự.',
  'Signup requires a valid password':
    'Mật khẩu không hợp lệ.',
  'Unable to validate email address: invalid format':
    'Định dạng email không hợp lệ.',
};

export function translateAuthError(message: string): string {
  return AUTH_ERROR_MAP[message] ?? message;
}

export function isEmailNotConfirmedError(message: string): boolean {
  return message === 'Email not confirmed';
}
