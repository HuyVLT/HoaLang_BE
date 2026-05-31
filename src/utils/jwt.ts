import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hoalang_access_secret_key_12345';
const JWT_REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_REFRESH_SECRET || 'hoalang_refresh_secret_key_67890';
const JWT_EXPIRES_IN = '1d'; // AccessToken: hạn 1 ngày
const JWT_REFRESH_EXPIRES_IN = '7d'; // RefreshToken: hạn 7 ngày

export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

export interface VerifyTokenPayload {
  email: string;
  type: 'verification';
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
};

export const generateVerifyToken = (payload: VerifyTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' }); // VerifyToken: hạn 15 phút
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};

export const verifyVerifyToken = (token: string): VerifyTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as VerifyTokenPayload;
};

