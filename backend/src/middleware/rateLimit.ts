import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

// Global rate limiter — 100 req / 15 min in prod, relaxed in dev
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Strict limiter for auth endpoints (login / register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 50 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

// OTP request limiter — prevent OTP flooding
export const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 20 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait 5 minutes before requesting another.',
  },
});

// Payment endpoint limiter
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 100 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.',
  },
});
