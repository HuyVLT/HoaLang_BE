import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/core/User.model';
import { AppError } from './error.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const checkAccessToken = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let token = '';

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access.', 401)
      );
    }

    try {
      const decoded = verifyAccessToken(token);

      const currentUser = await User.findById(decoded.userId);
      if (!currentUser) {
        return next(
          new AppError('The user belonging to this token no longer exists.', 401)
        );
      }

      // Check if user account is blocked
      if (currentUser.status === 'BLOCKED') {
        return next(
          new AppError('Your account has been blocked. Please contact support.', 403)
        );
      }

      req.user = currentUser;
      next();
    } catch (err: any) {
      return next(new AppError('Invalid or expired access token.', 401));
    }
  }
);

// Maintain compatibility with existing 'protect' middleware name
export const protect = checkAccessToken;

export default checkAccessToken;

