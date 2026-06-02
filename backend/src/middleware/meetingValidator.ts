import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { AppError } from './errorHandler';

export const validateCreateMeeting = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid date'),
  body('participantId')
    .notEmpty()
    .withMessage('Participant ID is required')
    .isUUID()
    .withMessage('Participant ID must be a valid UUID'),
  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((e) => e.msg).join(', ');
      return next(new AppError(errorMessages, 400));
    }
    next();
  },
];

export const validateMeetingId = [
  param('id')
    .isUUID()
    .withMessage('Meeting ID must be a valid UUID'),
  (req: Request, _res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((e) => e.msg).join(', ');
      return next(new AppError(errorMessages, 400));
    }
    next();
  },
];
