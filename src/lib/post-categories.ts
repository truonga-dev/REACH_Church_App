export const POST_CATEGORIES = [
  'Dưỡng linh',
  'Bản tin mục vụ',
  'Blog',
  'Featured',
  'Hướng dẫn đọc Kinh Thánh & cầu nguyện',
  'Prayer Request',
  'Thư viện',
] as const;

export const POST_CONTENT_TYPES = ['Sự kiện', 'Thông báo', 'Bản tin', 'Bài viết'] as const;

export type PostStatus = 'published' | 'draft';
