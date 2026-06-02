import { prisma } from '../config/database';
import stripe from '../config/stripe';
import { AppError } from '../middleware/errorHandler';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
};

const PAYMENT_INCLUDE = {
  sender: { select: USER_SELECT },
  receiver: { select: USER_SELECT },
};

export class PaymentService {
  async createDepositIntent(userId: string, amount: number, currency = 'USD') {
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: { userId, type: 'DEPOSIT' },
    });

    const transaction = await prisma.payment.create({
      data: {
        amount,
        currency,
        type: 'DEPOSIT',
        status: 'PENDING',
        receiverId: userId,
        stripePaymentIntentId: paymentIntent.id,
        description: `Deposit via Stripe`,
      },
      include: PAYMENT_INCLUDE,
    });

    return { clientSecret: paymentIntent.client_secret, transaction };
  }

  async confirmDeposit(userId: string, stripePaymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError(`Payment not completed. Stripe status: ${paymentIntent.status}`, 400);
    }

    const transaction = await prisma.payment.findUnique({
      where: { stripePaymentIntentId },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    if (transaction.receiverId !== userId) {
      throw new AppError('Unauthorized access to this transaction', 403);
    }

    if (transaction.status === 'COMPLETED') {
      throw new AppError('Transaction already confirmed', 400);
    }

    const [updatedTransaction, updatedUser] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: transaction.id },
        data: { status: 'COMPLETED' },
        include: PAYMENT_INCLUDE,
      }),
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: transaction.amount } },
        select: { walletBalance: true },
      }),
    ]);

    return { transaction: updatedTransaction, balance: updatedUser.walletBalance };
  }

  async withdraw(userId: string, amount: number, description?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) throw new AppError('User not found', 404);
    if (user.walletBalance < amount) {
      throw new AppError(`Insufficient balance. Available: $${user.walletBalance.toFixed(2)}`, 400);
    }

    const [transaction, updatedUser] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          amount,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          senderId: userId,
          description: description || 'Withdrawal to bank account',
        },
        include: PAYMENT_INCLUDE,
      }),
      prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
        select: { walletBalance: true },
      }),
    ]);

    return { transaction, balance: updatedUser.walletBalance };
  }

  async transfer(senderId: string, receiverId: string, amount: number, description?: string) {
    if (senderId === receiverId) {
      throw new AppError('Cannot transfer funds to yourself', 400);
    }

    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: senderId }, select: { walletBalance: true } }),
      prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, firstName: true, lastName: true } }),
    ]);

    if (!sender) throw new AppError('Sender not found', 404);
    if (!receiver) throw new AppError('Receiver not found', 404);
    if (sender.walletBalance < amount) {
      throw new AppError(`Insufficient balance. Available: $${sender.walletBalance.toFixed(2)}`, 400);
    }

    const [transaction, updatedSender] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          amount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          senderId,
          receiverId,
          description: description || `Transfer to ${receiver.firstName} ${receiver.lastName}`,
        },
        include: PAYMENT_INCLUDE,
      }),
      prisma.user.update({
        where: { id: senderId },
        data: { walletBalance: { decrement: amount } },
        select: { walletBalance: true },
      }),
      prisma.user.update({
        where: { id: receiverId },
        data: { walletBalance: { increment: amount } },
        select: { walletBalance: true },
      }),
    ]);

    return { transaction, balance: updatedSender.walletBalance };
  }

  async getBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) throw new AppError('User not found', 404);
    return user.walletBalance;
  }

  async getTransactions(
    userId: string,
    filters: { type?: string; status?: string; page?: number; limit?: number }
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ senderId: userId }, { receiverId: userId }],
    };

    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;

    const [transactions, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: PAYMENT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getTransactionById(transactionId: string, userId: string) {
    const transaction = await prisma.payment.findUnique({
      where: { id: transactionId },
      include: PAYMENT_INCLUDE,
    });

    if (!transaction) throw new AppError('Transaction not found', 404);

    if (transaction.senderId !== userId && transaction.receiverId !== userId) {
      throw new AppError('Unauthorized access to this transaction', 403);
    }

    return transaction;
  }
}
