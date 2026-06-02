import { body, param } from 'express-validator';

export const depositIntentValidator = [
  body('amount')
    .isFloat({ min: 0.5 })
    .withMessage('Amount must be at least $0.50'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP'])
    .withMessage('Currency must be USD, EUR, or GBP'),
];

export const confirmDepositValidator = [
  body('stripePaymentIntentId')
    .trim()
    .notEmpty()
    .withMessage('Stripe payment intent ID is required')
    .matches(/^pi_/)
    .withMessage('Invalid Stripe payment intent ID'),
];

export const withdrawValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

export const transferValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('receiverId')
    .trim()
    .notEmpty()
    .withMessage('Receiver ID is required')
    .isUUID()
    .withMessage('Invalid receiver ID'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
];

export const transactionIdValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isUUID()
    .withMessage('Invalid transaction ID format'),
];
