import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { paymentAPI, Transaction } from '../../services/paymentAPI';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DepositModal } from '../../components/payments/DepositModal';
import { WithdrawModal } from '../../components/payments/WithdrawModal';
import { TransferModal } from '../../components/payments/TransferModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TYPE_CONFIG = {
  DEPOSIT: {
    label: 'Deposit',
    icon: <ArrowDownLeft size={16} />,
    badgeVariant: 'success' as const,
    amountClass: 'text-green-600',
    amountPrefix: '+',
  },
  WITHDRAWAL: {
    label: 'Withdrawal',
    icon: <ArrowUpRight size={16} />,
    badgeVariant: 'warning' as const,
    amountClass: 'text-orange-600',
    amountPrefix: '-',
  },
  TRANSFER: {
    label: 'Transfer',
    icon: <Send size={16} />,
    badgeVariant: 'info' as const,
    amountClass: '',
    amountPrefix: '',
  },
};

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'error' | 'gray'; icon: React.ReactNode }> = {
  COMPLETED: { variant: 'success', icon: <CheckCircle size={12} /> },
  PENDING: { variant: 'warning', icon: <Clock size={12} /> },
  FAILED: { variant: 'error', icon: <XCircle size={12} /> },
  REFUNDED: { variant: 'gray', icon: <RefreshCw size={12} /> },
};

const TransactionRow: React.FC<{ tx: Transaction; userId: string }> = ({ tx, userId }) => {
  const type = TYPE_CONFIG[tx.type];
  const statusConf = STATUS_CONFIG[tx.status] || STATUS_CONFIG.PENDING;

  const isIncoming =
    tx.type === 'DEPOSIT' ||
    (tx.type === 'TRANSFER' && tx.receiverId === userId);

  const amountPrefix = tx.type === 'TRANSFER'
    ? (isIncoming ? '+' : '-')
    : type.amountPrefix;

  const amountClass = tx.type === 'TRANSFER'
    ? (isIncoming ? 'text-green-600' : 'text-red-600')
    : type.amountClass;

  const counterparty =
    tx.type === 'TRANSFER'
      ? isIncoming
        ? tx.sender
        : tx.receiver
      : null;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">{type.icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{type.label}</p>
            {tx.description && (
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{tx.description}</p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        {counterparty ? (
          <span className="text-sm text-gray-700">
            {counterparty.firstName} {counterparty.lastName}
          </span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span className={`text-sm font-semibold ${amountClass}`}>
          {amountPrefix}${tx.amount.toFixed(2)} {tx.currency}
        </span>
      </td>
      <td className="py-3 px-4">
        <Badge variant={statusConf.variant}>
          <span className="flex items-center gap-1">
            {statusConf.icon}
            {tx.status}
          </span>
        </Badge>
      </td>
      <td className="py-3 px-4 text-sm text-gray-500">
        {format(new Date(tx.createdAt), 'MMM d, yyyy HH:mm')}
      </td>
    </tr>
  );
};

export const PaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [balanceRes, txRes] = await Promise.all([
        paymentAPI.getBalance(),
        paymentAPI.getTransactions({
          type: filter !== 'all' ? filter : undefined,
          limit: 50,
        }),
      ]);
      setBalance(balanceRes.data.data.balance);
      setTransactions(txRes.data.data.transactions);
    } catch {
      toast.error('Failed to load payment data');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance);
    fetchData();
  };

  const stats = {
    totalDeposited: transactions
      .filter((t) => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawn: transactions
      .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0),
    totalTransferred: transactions
      .filter((t) => t.type === 'TRANSFER' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-600">Manage your wallet, deposits, withdrawals, and transfers</p>
      </div>

      {/* Wallet card + action buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
          <CardBody className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={20} />
              <span className="text-sm font-medium opacity-90">Wallet Balance</span>
            </div>
            <p className="text-3xl font-bold">${balance.toFixed(2)}</p>
            <p className="text-xs opacity-70 mt-1">USD · Sandbox</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <ArrowDownLeft size={18} />
              <span className="text-sm font-medium text-gray-600">Total Deposited</span>
            </div>
            <p className="text-xl font-bold text-gray-900">${stats.totalDeposited.toFixed(2)}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <ArrowUpRight size={18} />
              <span className="text-sm font-medium text-gray-600">Total Withdrawn</span>
            </div>
            <p className="text-xl font-bold text-gray-900">${stats.totalWithdrawn.toFixed(2)}</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <TrendingUp size={18} />
              <span className="text-sm font-medium text-gray-600">Total Transferred</span>
            </div>
            <p className="text-xl font-bold text-gray-900">${stats.totalTransferred.toFixed(2)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button leftIcon={<ArrowDownLeft size={18} />} onClick={() => setDepositOpen(true)}>
          Deposit
        </Button>
        <Button
          variant="outline"
          leftIcon={<ArrowUpRight size={18} />}
          onClick={() => setWithdrawOpen(true)}
          disabled={balance <= 0}
        >
          Withdraw
        </Button>
        <Button
          variant="outline"
          leftIcon={<Send size={18} />}
          onClick={() => setTransferOpen(true)}
          disabled={balance <= 0}
        >
          Transfer
        </Button>
        <Button
          variant="outline"
          leftIcon={<RefreshCw size={16} />}
          onClick={fetchData}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Transaction history */}
      <Card>
        <CardBody className="p-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Transaction History</h2>
            <div className="flex gap-1">
              {['all', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <Wallet size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Make your first deposit to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="py-3 px-4 text-left">Type</th>
                    <th className="py-3 px-4 text-left">Counterparty</th>
                    <th className="py-3 px-4 text-left">Amount</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <TransactionRow key={tx.id} tx={tx} userId={user?.id || ''} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <DepositModal
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={handleBalanceUpdate}
      />
      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        balance={balance}
        onSuccess={handleBalanceUpdate}
      />
      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        balance={balance}
        onSuccess={handleBalanceUpdate}
      />
    </div>
  );
};
