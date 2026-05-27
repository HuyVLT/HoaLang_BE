import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export const restrictTo = (...roles: ('USER' | 'VILLAGE_OWNER' | 'ADMIN' | string)[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('You are not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

export default restrictTo;
