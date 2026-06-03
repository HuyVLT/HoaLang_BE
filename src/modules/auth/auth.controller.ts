import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { authService } from './auth.service';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { UserTenantRole } from '../../models/core/UserTenantRole.model';
import { Tenant } from '../../models/core/Tenant.model';
import { getTenantConnection } from '../../config/tenantConnection';
import { getOrderModel } from '../../models/tenant/Order.schema';
import { getBookingModel } from '../../models/tenant/Booking.schema';
import { getProductModel } from '../../models/tenant/Product.schema';
import { getExperienceModel } from '../../models/tenant/Experience.schema';

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

        // Query user's tenants
        const userTenantRoles = await UserTenantRole.find({ userId: userObj._id }).populate('tenantId');
        userObj.tenants = userTenantRoles.map((utr: any) => ({
          slug: utr.tenantId?.slug,
          name: utr.tenantId?.name,
          role: utr.role,
        })).filter((t: any) => t.slug);

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
  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated.', 401);
      }
      const userObj = (req.user as any).toObject();
      delete userObj.password;

      // Query user's tenants
      const userTenantRoles = await UserTenantRole.find({ userId: userObj._id }).populate('tenantId');
      userObj.tenants = userTenantRoles.map((utr: any) => ({
        slug: utr.tenantId?.slug,
        name: utr.tenantId?.name,
        role: utr.role,
      })).filter((t: any) => t.slug);

      sendResponse(res, 200, true, userObj, 'Profile retrieved successfully.');
    } catch (err) {
      next(err);
    }
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

  /**
   * Request password reset token email
   */
  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      sendResponse(
        res,
        200,
        true,
        null,
        'Yêu cầu khôi phục mật khẩu thành công. Vui lòng kiểm tra email của bạn để đặt lại mật khẩu.'
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * Perform password reset using token
   */
  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      sendResponse(
        res,
        200,
        true,
        null,
        'Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập.'
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update currently authenticated user profile
   */
  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated.', 401);
      }

      const userId = (req.user as any)._id;
      const { fullName, phone } = req.body;
      let avatar = undefined;

      if (req.file) {
        console.log('[AuthController] Uploading profile avatar to Cloudinary...');
        avatar = await uploadToCloudinary(req.file.buffer);
      }

      const updatedUser = await authService.updateProfile(userId, { fullName, phone, avatar });

      sendResponse(res, 200, true, updatedUser, 'Cập nhật thông tin hồ sơ thành công.');
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get orders and bookings history for currently logged-in user across all active tenant databases
   */
  public getUserOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Not authenticated.', 401);
      }
      const userId = (req.user as any)._id;

      // 1. Fetch active tenants from core DB
      const tenants = await Tenant.find({ status: 'ACTIVE' });

      const allOrders: any[] = [];
      const allBookings: any[] = [];

      // 2. Loop through each tenant and query orders & bookings
      for (const tenant of tenants) {
        try {
          const tenantDb = await getTenantConnection(tenant.dbName);
          
          // Register models on tenant connection to allow populate
          const Product = getProductModel(tenantDb);
          const Experience = getExperienceModel(tenantDb);
          const Order = getOrderModel(tenantDb);
          const Booking = getBookingModel(tenantDb);

          // Fetch orders and populate products
          const orders = await Order.find({ userId })
            .populate({
              path: 'items.productId',
              model: Product
            })
            .sort({ createdAt: -1 });

          const mappedOrders = orders.map(o => {
            const orderObj = o.toObject();
            return {
              ...orderObj,
              tenant: {
                slug: tenant.slug,
                name: tenant.name
              },
              type: 'product'
            };
          });
          allOrders.push(...mappedOrders);

          // Fetch bookings and populate experience
          const bookings = await Booking.find({ userId })
            .populate({
              path: 'experienceId',
              model: Experience
            })
            .sort({ createdAt: -1 });

          const mappedBookings = bookings.map(b => {
            const bookingObj = b.toObject();
            return {
              ...bookingObj,
              tenant: {
                slug: tenant.slug,
                name: tenant.name
              },
              type: 'booking'
            };
          });
          allBookings.push(...mappedBookings);
        } catch (dbErr) {
          console.error(`[getUserOrders] Failed to query tenant ${tenant.slug}:`, dbErr);
        }
      }

      // Combine and sort by createdAt descending
      const combined = [...allOrders, ...allBookings].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      sendResponse(res, 200, true, combined, 'Retrieved user orders and bookings history successfully.');
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
export default authController;


