import { hasPermission, canAccessAdmin, getPermissions } from '../permissions';


describe('Permissions Logic', () => {
  describe('hasPermission', () => {
    it('should grant true to admins for all permissions', () => {
      expect(hasPermission('Quản trị viên', 'admin:access')).toBe(true);
      expect(hasPermission('Quản trị viên', 'users:assign_role')).toBe(true);
      expect(hasPermission('Quản trị viên', 'events:create')).toBe(true);
    });

    it('should grant limited access to Ban điều hành', () => {
      expect(hasPermission('Ban điều hành', 'content:create')).toBe(true);
      expect(hasPermission('Ban điều hành', 'users:assign_role')).toBe(false); // only admin
    });

    it('should grant custom permissions to Trưởng ban', () => {
      expect(hasPermission('Trưởng ban', 'events:create', ['events:create'])).toBe(true);
      expect(hasPermission('Trưởng ban', 'users:assign_role', ['events:create'])).toBe(false);
    });

    it('should return false for invalid roles', () => {
      expect(hasPermission('UnknownRole' as any, 'content:view')).toBe(false); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  });

  describe('canAccessAdmin', () => {
    it('should allow Quản trị viên, Ban điều hành, Trưởng ban', () => {
      expect(canAccessAdmin('Quản trị viên')).toBe(true);
      expect(canAccessAdmin('Ban điều hành')).toBe(true);
      expect(canAccessAdmin('Trưởng ban')).toBe(true);
    });

    it('should deny Thành viên', () => {
      expect(canAccessAdmin('Thành viên')).toBe(false);
    });
  });

  describe('getPermissions', () => {
    it('should return empty array for missing role', () => {
      expect(getPermissions(null)).toEqual([]);
    });

    it('should combine custom permissions for Trưởng ban', () => {
      const perms = getPermissions('Trưởng ban', ['events:create', 'events:edit']);
      expect(perms).toContain('admin:access');
      expect(perms).toContain('events:create');
    });
  });
});
