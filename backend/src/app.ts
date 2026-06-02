import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimit';

const app: Application = express();

const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(
  helmet({
    // Allow embedding Jitsi / Cloudinary iframes in the frontend
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body size limits (prevent large-payload DoS) ──────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use('/api/v1', globalRateLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
