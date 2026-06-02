import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = process.env.NODE_ENV === 'development';

  // Known operational errors (thrown by our code intentionally)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  // Prisma known request errors — map to safe HTTP responses without leaking DB details
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({ success: false, message: 'A record with this value already exists.' });
        return;
      case 'P2025':
        res.status(404).json({ success: false, message: 'Record not found.' });
        return;
      case 'P2003':
        res.status(400).json({ success: false, message: 'Related record not found.' });
        return;
      default:
        console.error('Prisma error:', err.code, isDev ? err.message : '');
        res.status(400).json({ success: false, message: 'Database operation failed.' });
        return;
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: 'Invalid data provided.' });
    return;
  }

  // Unexpected / programming errors — log internally, never expose details
  console.error('❌ Unexpected Error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again.',
    ...(isDev && { error: err.message, stack: err.stack }),
  });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${_req.originalUrl} not found`,
  });
};
