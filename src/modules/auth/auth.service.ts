import jwt from 'jsonwebtoken';
import { User } from '../../models/core/User.model';
import { AppError } from '../../middleware/error.middleware';
import {
  generateAccessToken,
  generateRefreshToken,
  generateVerifyToken,
  verifyVerifyToken,
  verifyRefreshToken,
  TokenPayload,
} from '../../utils/jwt';
import { redisClient } from '../../config/redis';
import { sendVerificationEmail } from '../../utils/mailer';

export class AuthService {
  /**
   * Register a new user profile in hoalang_core
   */
  public async register(payload: {
    email: string;
    fullName: string;
    password?: string;
    phone?: string;
    avatar?: string;
    role?: 'USER' | 'VILLAGE_OWNER' | 'ADMIN';
    locale?: string;
  }): Promise<Record<string, unknown>> {
    const { email, fullName, password, phone, avatar, role, locale } = payload;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email address is already in use.', 400);
    }

    // Set expiration for unverified accounts to 15 minutes from now
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const newUser = new User({
      email,
      fullName,
      password, // hashed automatically by Mongoose pre-save hook
      phone,
      avatar,
      role: role ?? 'USER',
      locale: locale ?? 'vi',
      isVerified: false,
      status: 'ACTIVE',
      type: 'Local',
      socialLogin: false,
      verificationExpiresAt,
    });

    await newUser.save();

    // Create a 15-minute VerifyToken containing email and type
    const verifyToken = generateVerifyToken({
      email: newUser.email,
      type: 'verification',
    });

    // Send registration activation email
    try {
      await sendVerificationEmail(newUser.email, newUser.fullName, verifyToken, newUser.locale);
    } catch (mailError) {
      console.error('[AuthService] Error sending verification email:', mailError);
      // Don't crash the register process but log the error
    }

    const userResponse = newUser.toObject() as unknown as Record<string, unknown>;
    delete userResponse.password;

    return userResponse;
  }

  /**
   * Verify registration activation link
   */
  public async verifyAccount(token: string): Promise<Record<string, unknown>> {
    try {
      const decoded = verifyVerifyToken(token);
      if (decoded.type !== 'verification') {
        throw new AppError('Invalid token type for verification.', 400);
      }

      const user = await User.findOne({ email: decoded.email });
      if (!user) {
        throw new AppError('No unverified account found with this email.', 404);
      }

      if (user.isVerified) {
        // If already verified, return the user immediately (idempotent behavior)
        const userResponse = user.toObject() as unknown as Record<string, unknown>;
        delete userResponse.password;
        return userResponse;
      }

      // Check if user status is BLOCKED
      if (user.status === 'BLOCKED') {
        throw new AppError('This account has been blocked.', 403);
      }

      // Activate user and unset TTL deletion field
      user.isVerified = true;
      user.verificationExpiresAt = undefined;
      await user.save();

      const userResponse = user.toObject() as unknown as Record<string, unknown>;
      delete userResponse.password;

      return userResponse;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Verification link has expired. Please register again.', 400);
      }
      throw err;
    }
  }

  /**
   * Upsert social media profiles (Google)
   */
  public async upsertSocialMedia(profile: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }): Promise<InstanceType<typeof User>> {
    let user = await User.findOne({ googleId: profile.googleId });
    if (user) {
      if (user.status === 'BLOCKED') {
        throw new AppError('Your account has been blocked. Please contact support.', 403);
      }
      let hasChanges = false;
      if (profile.avatar && user.avatar !== profile.avatar) {
        user.avatar = profile.avatar;
        hasChanges = true;
      }
      if (profile.fullName && user.fullName !== profile.fullName) {
        user.fullName = profile.fullName;
        hasChanges = true;
      }
      if (hasChanges) {
        await user.save();
      }
      return user;
    }

    // Try linking with existing email account
    user = await User.findOne({ email: profile.email });
    if (user) {
      if (user.status === 'BLOCKED') {
        throw new AppError('Your account has been blocked. Please contact support.', 403);
      }

      // Link googleId and mark verified since email is validated by Google
      user.googleId = profile.googleId;
      user.type = 'GOOGLE';
      user.socialLogin = true;
      user.isVerified = true;
      user.verificationExpiresAt = undefined; // Cancel any unverified self-deletion timer
      if (!user.avatar) {
        user.avatar = profile.avatar;
      }
      await user.save();
      return user;
    }

    // Create a new verified user account via Google
    const newUser = new User({
      email: profile.email,
      fullName: profile.fullName,
      avatar: profile.avatar,
      type: 'GOOGLE',
      socialLogin: true,
      googleId: profile.googleId,
      isVerified: true, // Google email is pre-verified
      status: 'ACTIVE',
      role: 'USER',
    });

    await newUser.save();
    return newUser;
  }

  /**
   * Issue access + refresh tokens for an authenticated user
   */
  public async issueTokens(
    user: InstanceType<typeof User>
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenPayload: TokenPayload = {
      userId: user.id as string,
      role: user.role,
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return { accessToken, refreshToken };
  }

  /**
   * Verify refresh token and issue a new access token
   */
  public async refresh(token: string): Promise<string> {
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted === 'true') {
      throw new AppError('This refresh token has been logged out.', 401);
    }

    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
    }

    if (user.status === 'BLOCKED') {
      throw new AppError('Your account is blocked.', 403);
    }

    const tokenPayload: TokenPayload = {
      userId: user.id as string,
      role: user.role,
      email: user.email,
    };

    return generateAccessToken(tokenPayload);
  }

  /**
   * Blacklist refresh token in Redis on logout
   */
  public async logout(token: string): Promise<void> {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) {
      throw new AppError('Invalid refresh token for logout.', 400);
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redisClient.setEx(`blacklist:${token}`, ttl, 'true');
    }
  }
}

export const authService = new AuthService();
export default authService;
