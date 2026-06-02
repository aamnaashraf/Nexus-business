import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { paymentRateLimiter } from '../middleware/rateLimit';
import {
  depositIntentValidator,
  confirmDepositValidator,
  withdrawValidator,
  transferValidator,
  transactionIdValidator,
} from '../middleware/paymentValidator';
import {
  createDepositIntent,
  confirmDeposit,
  withdraw,
  transfer,
  getBalance,
  getTransactions,
  getTransactionById,
} from '../controllers/payment.controller';

const router = Router();

router.use(authenticate);
router.use(paymentRateLimiter);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.get('/transactions/:id', validate(transactionIdValidator), getTransactionById);

router.post('/deposit/intent', validate(depositIntentValidator), createDepositIntent);
router.post('/deposit/confirm', validate(confirmDepositValidator), confirmDeposit);
router.post('/withdraw', validate(withdrawValidator), withdraw);
router.post('/transfer', validate(transferValidator), transfer);

export default router;
