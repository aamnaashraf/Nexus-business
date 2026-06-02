import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { TokenPayload } from '../middleware/auth';

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const formatUserResponse = (user: any) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};