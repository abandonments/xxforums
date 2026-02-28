
import { UserProfile, UserRole, Thread, Reply } from '../types';

type Resource = Thread | Reply | UserProfile | null;
type Action = 'delete' | 'edit' | 'moderate' | 'view_admin' | 'create_thread';

const STAFF_ROLES = [UserRole.ROOT, UserRole.ADMIN, UserRole.MOD];
const ADMIN_ROLES = [UserRole.ROOT, UserRole.ADMIN];

export const RBAC = {
  isStaff: (user: UserProfile | null) => user && STAFF_ROLES.includes(user.role),
  isAdmin: (user: UserProfile | null) => user && ADMIN_ROLES.includes(user.role),
  isRoot: (user: UserProfile | null) => user?.role === UserRole.ROOT,

  can: (user: UserProfile | null, action: Action, resource?: Resource): boolean => {
    if (!user) return false;
    if (user.role === UserRole.BANNED) return false;

    switch (action) {
      case 'view_admin':
        return ADMIN_ROLES.includes(user.role);

      case 'moderate': // Lock, Sticky, Warn, Ban
        return STAFF_ROLES.includes(user.role);

      case 'delete':
        if (!resource) return false;
        // Resource Owner
        if ('author' in resource && resource.author === user.uid) return true;
        // Staff Override (Admins can delete anything except Root users)
        if (ADMIN_ROLES.includes(user.role)) {
            // Prevent deleting Root/Admin if not Root
            if ('role' in resource) {
                 const targetRole = (resource as UserProfile).role;
                 if (targetRole === UserRole.ROOT) return false;
            }
            return true;
        }
        return false;

      case 'create_thread':
        return true;

      default:
        return false;
    }
  }
};
