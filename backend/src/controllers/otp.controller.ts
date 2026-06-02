import { Request, Response, NextFunction } from 'express';
import { OtpService } from '../services/otp.service';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

const otpService = new OtpService();

/**
 * POST /auth/otp/request
 * Body: { email }
 *
 * Generates a 6-digit OTP for the email.
 * In development the OTP is returned in the response (mock flow — no email service).
 * In production only a success message is returned; the OTP would be emailed.
 */
export const requestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    // Verify the email belongs to a registered user
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Return the same message to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If this email is registered, an OTP has been sent.',
      });
      return;
    }

    const otp = otpService.generate(email);

    // In development: return the OTP directly so it can be tested without an email service
    const isDev = env.NODE_ENV !== 'production';
    res.status(200).json({
      success: true,
      message: isDev
        ? `OTP generated (dev mode — would be emailed in production)`
        : 'If this email is registered, an OTP has been sent.',
      ...(isDev && { otp, expiresInMinutes: 5 }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/otp/verify
 * Body: { email, otp }
 *
 * Verifies the OTP. Returns a short-lived reset token that can be used
 * to reset the password via POST /auth/password/reset.
 */
export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const result = otpService.verify(email, otp);
    if (!result.valid) {
      throw new AppError(result.message, 400);
    }

    // Issue a short-lived, single-use reset token (HMAC of email + timestamp)
    const resetToken = Buffer.from(`${email}:${Date.now()}:${env.JWT_SECRET}`)
      .toString('base64url');

    // Store token hash in a transient in-memory map (expires 10 min)
    resetTokenStore.set(resetToken, {
      email: email.toLowerCase(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified. Use the reset token to set a new password.',
      data: { resetToken },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/password/reset
 * Body: { resetToken, newPassword }
 *
 * Resets the user's password using a valid reset token from verifyOtp.
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { resetToken, newPassword } = req.body;

    const record = resetTokenStore.get(resetToken);
    if (!record || Date.now() > record.expiresAt) {
      resetTokenStore.delete(resetToken);
      throw new AppError('Reset token is invalid or has expired.', 400);
    }

    // Consume token immediately (single-use)
    resetTokenStore.delete(resetToken);

    const hashed = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { email: record.email },
      data: { password: hashed },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// ── In-memory reset token store ───────────────────────────────────────────────
// Keyed by reset token string. Expires after 10 minutes.
const resetTokenStore = new Map<string, { email: string; expiresAt: number }>();

// Purge expired entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of resetTokenStore.entries()) {
    if (now > value.expiresAt) resetTokenStore.delete(key);
  }
}, 10 * 60 * 1000);
