import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User.model';
import { AppError } from '../../middleware/error.middleware';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../../utils/jwt';
import { redisClient } from '../../config/redis';

export class AuthService {
  /**
   * Register a new user profile
   */
  public async register(payload: any): Promise<{ user: any; accessToken: string; refreshToken: string }> {
    const { email, name, password, avatar, role, locale } = payload;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email address is already in use.', 400);
    }

    // Hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save the user profile
    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      avatar,
      role: role || 'USER',
      locale: locale || 'vi'
    });

    await newUser.save();

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: newUser.id,
      role: newUser.role,
      email: newUser.email
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Ensure password is not returned in response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      accessToken,
      refreshToken
    };
  }

  /**
   * Generate access and refresh tokens for user profile
   */
  public async issueTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return { accessToken, refreshToken };
  }

  /**
   * Verify and refresh Access Token
   */
  public async refresh(token: string): Promise<string> {
    // 1. Check if token is blacklisted in Redis
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted === 'true') {
      throw new AppError('This refresh token has been logged out.', 401);
    }

    // 2. Verify token signature
    const decoded = verifyRefreshToken(token);

    // 3. Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
    }

    // 4. Issue new Access Token
    const tokenPayload: TokenPayload = {
      userId: user.id,
      role: user.role,
      email: user.email
    };

    return generateAccessToken(tokenPayload);
  }

  /**
   * Blacklist refresh token in Redis on logout
   */
  public async logout(token: string): Promise<void> {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      throw new AppError('Invalid refresh token for logout.', 400);
    }

    const expiryTime = decoded.exp;
    const nowTime = Math.floor(Date.now() / 1000);
    const ttl = expiryTime - nowTime;

    if (ttl > 0) {
      // Store in Redis with TTL so blacklist expires automatically
      await redisClient.setEx(`blacklist:${token}`, ttl, 'true');
    }
  }
}

export const authService = new AuthService();
export default authService;
