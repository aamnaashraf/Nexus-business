import { body, param } from 'express-validator';

export const createDocumentValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('visibility')
    .optional()
    .isIn(['PRIVATE', 'PUBLIC', 'SHARED'])
    .withMessage('Visibility must be PRIVATE, PUBLIC, or SHARED'),
];

export const updateDocumentStatusValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Document ID is required')
    .isUUID()
    .withMessage('Invalid document ID format'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['PENDING', 'APPROVED', 'REJECTED', 'SIGNED'])
    .withMessage('Status must be PENDING, APPROVED, REJECTED, or SIGNED'),
];

export const documentIdValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Document ID is required')
    .isUUID()
    .withMessage('Invalid document ID format'),
];
