/**
 * Hệ thống phân quyền REACH Church Admin
 *
 * CÁC VAI TRÒ (ROLES):
 * ─────────────────────────────────────────────────────────────────
 * Quản trị viên  — Toàn quyền hệ thống, quản lý người dùng & cài đặt
 * Ban điều hành  — Quản lý nội dung (tin tức, bài giảng, sự kiện...)
 * Thành viên     — Chỉ dùng tính năng người dùng thông thường
 * ─────────────────────────────────────────────────────────────────
 */

export type UserRole = 'Quản trị viên' | 'Ban điều hành' | 'Thành viên';

/** Danh sách tất cả quyền trong hệ thống */
export type Permission =
  // === Nội dung ===
  | 'content:view'          // Xem nội dung (tin tức, bài viết)
  | 'content:create'        // Tạo nội dung mới
  | 'content:edit'          // Sửa nội dung
  | 'content:delete'        // Xóa nội dung
  | 'content:publish'       // Xuất bản / chuyển về nháp
  // === Bài giảng ===
  | 'sermons:view'
  | 'sermons:create'
  | 'sermons:edit'
  | 'sermons:delete'
  // === Sự kiện ===
  | 'events:view'
  | 'events:create'
  | 'events:edit'
  | 'events:delete'
  // === Mục vụ ===
  | 'ministries:view'
  | 'ministries:create'
  | 'ministries:edit'
  | 'ministries:delete'
  // === Dưỡng linh ===
  | 'devotionals:view'
  | 'devotionals:create'
  | 'devotionals:edit'
  | 'devotionals:delete'
  // === Thư viện (Sách nói & PDF) ===
  | 'library:view'
  | 'library:create'
  | 'library:edit'
  | 'library:delete'
  // === Cầu nguyện ===
  | 'prayers:view'          // Xem danh sách cầu nguyện
  | 'prayers:review'        // Duyệt / đánh dấu nhậm lời
  | 'prayers:delete'        // Xóa lời cầu nguyện
  // === Dâng hiến ===
  | 'donations:view'        // Xem báo cáo dâng hiến
  | 'donations:manage'      // Quản lý / xác nhận dâng hiến
  // === Người dùng ===
  | 'users:view'            // Xem danh sách tín hữu
  | 'users:edit'            // Sửa thông tin tín hữu
  | 'users:delete'          // Xóa hồ sơ tín hữu
  | 'users:assign_role'     // Phân quyền (chỉ admin mới có)
  // === Thống kê & Hệ thống ===
  | 'stats:view'            // Xem tổng quan thống kê
  | 'notifications:send'    // Gửi thông báo push
  | 'admin:access'          // Vào được admin panel
  | 'admin:settings';       // Cài đặt hệ thống

/** Bản đồ quyền theo vai trò */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Quản trị viên': [
    // Toàn quyền — tất cả permissions
    'admin:access', 'admin:settings',
    'stats:view', 'notifications:send',
    'content:view', 'content:create', 'content:edit', 'content:delete', 'content:publish',
    'sermons:view', 'sermons:create', 'sermons:edit', 'sermons:delete',
    'events:view', 'events:create', 'events:edit', 'events:delete',
    'ministries:view', 'ministries:create', 'ministries:edit', 'ministries:delete',
    'devotionals:view', 'devotionals:create', 'devotionals:edit', 'devotionals:delete',
    'library:view', 'library:create', 'library:edit', 'library:delete',
    'prayers:view', 'prayers:review', 'prayers:delete',
    'donations:view', 'donations:manage',
    'users:view', 'users:edit', 'users:delete', 'users:assign_role',
  ],
  'Ban điều hành': [
    // Quản lý nội dung — không phân quyền user, không xóa tín hữu
    'admin:access',
    'stats:view',
    'content:view', 'content:create', 'content:edit', 'content:delete', 'content:publish',
    'sermons:view', 'sermons:create', 'sermons:edit', 'sermons:delete',
    'events:view', 'events:create', 'events:edit', 'events:delete',
    'ministries:view', 'ministries:create', 'ministries:edit', 'ministries:delete',
    'devotionals:view', 'devotionals:create', 'devotionals:edit', 'devotionals:delete',
    'library:view', 'library:create', 'library:edit', 'library:delete',
    'prayers:view', 'prayers:review',
    'donations:view',
    'users:view',
  ],
  'Thành viên': [
    // Chỉ xem — không có quyền admin
  ],
};

/**
 * Lấy danh sách quyền của một role
 */
export function getPermissions(role?: string | null): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as UserRole] ?? [];
}

/**
 * Kiểm tra một role có quyền cụ thể không
 */
export function hasPermission(role?: string | null, permission?: Permission): boolean {
  if (!role || !permission) return false;
  return getPermissions(role).includes(permission);
}

/**
 * Kiểm tra có thể vào Admin Panel không
 */
export function canAccessAdmin(role?: string | null): boolean {
  return hasPermission(role, 'admin:access');
}

/**
 * Các tab admin và permission yêu cầu để xem tab đó
 */
export const TAB_PERMISSIONS: Record<string, Permission> = {
  overview:     'stats:view',
  stats:        'stats:view',
  news:         'content:view',
  posts:        'content:view',
  events:       'events:view',
  ministries:   'ministries:view',
  sermons:      'sermons:view',
  audiobooks:   'library:view',
  pdfs:         'library:view',
  devotionals:  'devotionals:view',
  donations:    'donations:view',
  prayers:      'prayers:view',
  users:        'users:view',
};

/** Mô tả vai trò dùng trong UI */
export const ROLE_DESCRIPTIONS: Record<UserRole, {
  label: string; color: string; bg: string; desc: string; icon: string
}> = {
  'Quản trị viên': {
    label: 'Quản trị viên',
    color: '#48BCE1',
    bg: 'rgba(72,188,225,0.12)',
    desc: 'Toàn quyền hệ thống — quản lý nội dung, tín hữu và cài đặt',
    icon: '🛡️',
  },
  'Ban điều hành': {
    label: 'Ban điều hành',
    color: '#F4CC30',
    bg: 'rgba(244,204,48,0.12)',
    desc: 'Quản lý nội dung, tin tức, sự kiện và cầu nguyện',
    icon: '✍️',
  },
  'Thành viên': {
    label: 'Thành viên',
    color: '#aaa',
    bg: 'rgba(255,255,255,0.06)',
    desc: 'Tín hữu thông thường — sử dụng ứng dụng không có quyền quản trị',
    icon: '🙏',
  },
};

export const ALL_ROLES: UserRole[] = ['Quản trị viên', 'Ban điều hành', 'Thành viên'];
