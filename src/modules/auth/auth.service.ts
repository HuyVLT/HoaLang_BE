import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/core/User.model';
import { AppError } from '../../middleware/error.middleware';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../../utils/jwt';
import { redisClient } from '../../config/redis';

export class AuthService {
  /**
   * Register a new user profile in hoalang_core
   */
  public async register(payload: {
    email: string;
    name: string;
    password: string;
    avatar?: string;
    role?: 'USER' | 'VILLAGE_OWNER' | 'ADMIN';
    locale?: string;
  }): Promise<{ user: Record<string, unknown>; accessToken: string; refreshToken: string }> {
    const { email, name, password, avatar, role, locale } = payload;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email address is already in use.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      avatar,
      role: role ?? 'USER',
      locale: locale ?? 'vi',
    });

    await newUser.save();

    const tokenPayload: TokenPayload = {
      userId: newUser.id as string,
      role: newUser.role,
      email: newUser.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const userResponse = newUser.toObject() as unknown as Record<string, unknown>;
    delete userResponse.password;

    return { user: userResponse, accessToken, refreshToken };
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
