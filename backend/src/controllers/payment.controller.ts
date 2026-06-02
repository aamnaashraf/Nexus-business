import { Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const paymentService = new PaymentService();

export const createDepositIntent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const { amount, currency } = req.body;
    const result = await paymentService.createDepositIntent(req.user.id, parseFloat(amount), currency);

    res.status(201).json({
      success: true,
      message: 'Payment intent created',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmDeposit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const { stripePaymentIntentId } = req.body;
    const result = await paymentService.confirmDeposit(req.user.id, stripePaymentIntentId);

    res.status(200).json({
      success: true,
      message: 'Deposit confirmed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const withdraw = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const { amount, description } = req.body;
    const result = await paymentService.withdraw(req.user.id, parseFloat(amount), description);

    res.status(200).json({
      success: true,
      message: 'Withdrawal successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const transfer = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const { amount, receiverId, description } = req.body;
    const result = await paymentService.transfer(
      req.user.id,
      receiverId,
      parseFloat(amount),
      description
    );

    res.status(200).json({
      success: true,
      message: 'Transfer successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const balance = await paymentService.getBalance(req.user.id);

    res.status(200).json({
      success: true,
      data: { balance },
    });
  } catch (error) {
    next(error);
  }
};

const VALID_PAYMENT_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'];
const VALID_PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const { type, status, page, limit } = req.query;

    const typeStr = typeof type === 'string' ? type.toUpperCase() : undefined;
    const statusStr = typeof status === 'string' ? status.toUpperCase() : undefined;

    if (typeStr && !VALID_PAYMENT_TYPES.includes(typeStr)) {
      throw new AppError(`Invalid type. Must be one of: ${VALID_PAYMENT_TYPES.join(', ')}`, 400);
    }
    if (statusStr && !VALID_PAYMENT_STATUSES.includes(statusStr)) {
      throw new AppError(`Invalid status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`, 400);
    }

    const pageNum = typeof page === 'string' ? parseInt(page, 10) : undefined;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : undefined;

    if (pageNum !== undefined && (isNaN(pageNum) || pageNum < 1)) {
      throw new AppError('Page must be a positive integer.', 400);
    }
    if (limitNum !== undefined && (isNaN(limitNum) || limitNum < 1 || limitNum > 100)) {
      throw new AppError('Limit must be between 1 and 100.', 400);
    }

    const result = await paymentService.getTransactions(req.user.id, {
      type: typeStr,
      status: statusStr,
      page: pageNum,
      limit: limitNum,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('User not authenticated', 401);

    const { id } = req.params;
    const transaction = await paymentService.getTransactionById(id as string, req.user.id);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};
