import { api } from './api';

export interface PaymentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  description: string | null;
  stripePaymentIntentId: string | null;
  senderId: string | null;
  receiverId: string | null;
  sender: PaymentUser | null;
  receiver: PaymentUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface DepositIntentResponse {
  clientSecret: string;
  transaction: Transaction;
}

export interface TransactionResult {
  transaction: Transaction;
  balance: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const paymentAPI = {
  getBalance: () =>
    api.get<{ success: boolean; data: { balance: number } }>('/payments/balance'),

  createDepositIntent: (amount: number, currency = 'USD') =>
    api.post<{ success: boolean; data: DepositIntentResponse }>('/payments/deposit/intent', {
      amount,
      currency,
    }),

  confirmDeposit: (stripePaymentIntentId: string) =>
    api.post<{ success: boolean; data: TransactionResult }>('/payments/deposit/confirm', {
      stripePaymentIntentId,
    }),

  withdraw: (amount: number, description?: string) =>
    api.post<{ success: boolean; data: TransactionResult }>('/payments/withdraw', {
      amount,
      description,
    }),

  transfer: (amount: number, receiverId: string, description?: string) =>
    api.post<{ success: boolean; data: TransactionResult }>('/payments/transfer', {
      amount,
      receiverId,
      description,
    }),

  getTransactions: (params?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get<{ success: boolean; data: PaginatedTransactions }>('/payments/transactions', {
      params,
    }),

  getTransactionById: (id: string) =>
    api.get<{ success: boolean; data: Transaction }>(`/payments/transactions/${id}`),
};
