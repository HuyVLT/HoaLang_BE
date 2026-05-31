import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { authService } from './auth.service';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { uploadToCloudinary } from '../../utils/cloudinary';

export class AuthController {
  /**
   * Register a new user profile
   */
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // If a file is uploaded, send it to Cloudinary first
      if (req.file) {
        console.log('[AuthController] Uploading avatar file to Cloudinary...');
        const avatarUrl = await uploadToCloudinary(req.file.buffer);
        req.body.avatar = avatarUrl;
      }

      const result = await authService.register(req.body);
      sendResponse(
        res,
        201,
        true,
        result,
        'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để kích hoạt tài khoản trong vòng 15 phút.'
      );
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

        sendResponse(
          res,
          200,
          true,
          { user: userObj, ...tokens },
          'Login successful.'
        );
      } catch (loginErr) {
        next(loginErr);
      }
    })(req, res, next);
  };

  /**
   * Activate / Verify account via token
   */
  public verifyAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        throw new AppError('Xác thực thất bại: thiếu mã kích hoạt.', 400);
      }

      const result = await authService.verifyAccount(token);
      sendResponse(res, 200, true, result, 'Kích hoạt tài khoản thành công!');
    } catch (err) {
      next(err);
    }
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

        // Detect device redirection target from Google OAuth state
        const state = req.query.state as string;
        const isMobile = state === 'mobile';

        const userObj = {
          id: user.id || user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar,
          walletBalance: user.walletBalance,
        };

        const serializedUser = encodeURIComponent(JSON.stringify(userObj));
        const redirectBase = isMobile
          ? 'hoalang://auth/callback'
          : `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback`;

        const redirectUrl = `${redirectBase}?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${serializedUser}`;
        
        console.log(`[GoogleCallback] Redirecting ${isMobile ? 'mobile' : 'web'} user:`, redirectUrl);
        return res.redirect(redirectUrl);
      } catch (oauthErr) {
        next(oauthErr);
      }
    })(req, res, next);
  };
}

export const authController = new AuthController();
export default authController;

