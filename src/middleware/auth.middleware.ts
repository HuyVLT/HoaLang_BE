import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User.model';
import { AppError } from './error.middleware';
import { asyncHandler } from '../utils/asyncHandler';

export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
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

  // Verify the JWT Access Token
  const decoded = verifyAccessToken(token);

  // Check if the user still exists in the database
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // Bind the mongoose document to req.user for further controller consumption
  req.user = currentUser;
  next();
});

export default protect;
