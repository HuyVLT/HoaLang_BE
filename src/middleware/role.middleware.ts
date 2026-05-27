import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { AppError } from './error.middleware';
import { UserTenantRole } from '../models/core/UserTenantRole.model';

type GlobalRole = 'USER' | 'VILLAGE_OWNER' | 'ADMIN';
type TenantRole = 'OWNER' | 'STAFF';

/**
 * Restrict access by global user role (stored in hoalang_core.users).
 * Used for platform-wide operations.
 */
export const restrictTo = (...roles: GlobalRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('You are not authenticated.', 401));
    }

    if (!roles.includes(req.user.role as GlobalRole)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

/**
 * Restrict access by tenant-specific role (from hoalang_core.user_tenant_roles).
 * Use AFTER both protect() and resolveTenant() middleware.
 *
 * Example:
 *   router.post('/products', protect, resolveTenant, requireTenantRole('OWNER', 'STAFF'), ...)
 */
export const requireTenantRole = (...roles: TenantRole[]) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      return next(new AppError('You are not authenticated.', 401));
    }

    if (!req.tenant) {
      return next(new AppError('Tenant context is missing.', 500));
    }

    // ADMIN bypasses tenant role checks
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const tenantRole = await UserTenantRole.findOne({
      userId: new Types.ObjectId(String(req.user._id)),
      tenantId: new Types.ObjectId(String(req.tenant._id)),
      role: { $in: roles },
    });

    if (!tenantRole) {
      return next(
        new AppError(
          `Access denied. Required tenant role: ${roles.join(' or ')}.`,
          403
        )
      );
    }

    next();
  };
};

export default restrictTo;
