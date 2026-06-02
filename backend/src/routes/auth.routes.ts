import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getCurrentUser,
  changePassword,
  uploadAvatar,
} from '../controllers/auth.controller';
import { requestOtp, verifyOtp, resetPassword } from '../controllers/otp.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
} from '../middleware/validator';
import { authRateLimiter, otpRateLimiter } from '../middleware/rateLimit';
import { AppError } from '../middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPG, PNG, WEBP images are allowed for avatars', 400) as any, false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');

const uploadAvatarToCloudinary = async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.file) return next();
  try {
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'nexus/avatars', resource_type: 'image', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
        (err, res) => { if (err) reject(err); else resolve(res); }
      );
      stream.end(req.file!.buffer);
    });
    (req.file as any).path = result.secure_url;
    next();
  } catch (err) {
    next(new AppError('Failed to upload avatar', 500));
  }
};

const router = Router();

// ── Auth endpoints (strict rate limiting) ─────────────────────────────────────
router.post('/register', authRateLimiter, validateRegister, register);
router.post('/login', authRateLimiter, validateLogin, login);

// ── Profile endpoints ─────────────────────────────────────────────────────────
router.get('/me', authenticate, getCurrentUser);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validateProfileUpdate, updateProfile);
router.post('/profile/avatar', authenticate, avatarUpload, uploadAvatarToCloudinary, uploadAvatar);
router.put(
  '/password',
  authenticate,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number.'),
  ]),
  changePassword
);

// ── OTP / Password-reset flow ─────────────────────────────────────────────────
// Step 1 — request OTP (rate-limited to prevent flooding)
router.post(
  '/otp/request',
  otpRateLimiter,
  validate([
    body('email')
      .isEmail().withMessage('A valid email is required.')
      .normalizeEmail(),
  ]),
  requestOtp
);

// Step 2 — verify OTP, receive short-lived reset token
router.post(
  '/otp/verify',
  otpRateLimiter,
  validate([
    body('email')
      .isEmail().withMessage('A valid email is required.')
      .normalizeEmail(),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
      .isNumeric().withMessage('OTP must contain digits only.'),
  ]),
  verifyOtp
);

// Step 3 — reset password using the token from step 2
router.post(
  '/password/reset',
  validate([
    body('resetToken').trim().notEmpty().withMessage('Reset token is required.'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number.'),
  ]),
  resetPassword
);

export default router;
