import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { authService } from './auth.service';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

export class AuthController {
  /**
   * Register a new user profile
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      sendResponse(res, 201, true, result, 'Registration successful.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Login standard credential user using Passport local strategy
   */
  public login = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('local', { session: false }, async (err: any, user: any, info: any) => {
      try {
        if (err) return next(err);
        if (!user) {
          return next(new AppError(info?.message || 'Invalid email or password.', 401));
        }

        const tokens = await authService.issueTokens(user);
        const userObj = user.toObject();
        delete userObj.password;

        sendResponse(res, 200, true, { user: userObj, ...tokens }, 'Login successful.');
      } catch (loginErr) {
        next(loginErr);
      }
    })(req, res, next);
  };

  /**
   * Return logged-in user profile details
   */
  public getMe = (req: Request, res: Response): void => {
    if (!req.user) {
      throw new AppError('Not authenticated.', 401);
    }
    const userObj = (req.user as any).toObject();
    delete userObj.password;

    sendResponse(res, 200, true, userObj, 'Profile retrieved successfully.');
  };

  /**
   * Refresh credentials via Refresh Token
   */
  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError('Refresh token is required.', 400);
      }

      const newAccessToken = await authService.refresh(refreshToken);
      sendResponse(res, 200, true, { accessToken: newAccessToken }, 'Token refreshed successfully.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Logout user by blacklisting refresh token
   */
  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new AppError('Refresh token is required for logout.', 400);
      }

      await authService.logout(refreshToken);
      sendResponse(res, 200, true, null, 'Logout successful.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Handle Google OAuth strategy success callback
   */
  public googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    passport.authenticate('google', { session: false }, async (err: any, user: any) => {
      try {
        if (err) return next(err);
        if (!user) {
          return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/login?error=oauth_failed`);
        }

        const { accessToken, refreshToken } = await authService.issueTokens(user);

        // Redirect standard web clients passing Access & Refresh credentials in search queries
        return res.redirect(
          `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
        );
      } catch (oauthErr) {
        next(oauthErr);
      }
    })(req, res, next);
  };
}

export const authController = new AuthController();
export default authController;
