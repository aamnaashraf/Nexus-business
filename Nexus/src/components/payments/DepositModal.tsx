import React, { useState } from 'react';
import { X, CreditCard, Loader } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { paymentAPI } from '../../services/paymentAPI';
import toast from 'react-hot-toast';

const VITE_STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

const DepositForm: React.FC<{ onClose: () => void; onSuccess: (b: number) => void }> = ({
  onClose,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 0.5) {
      toast.error('Minimum deposit is $0.50');
      return;
    }

    setIsLoading(true);
    try {
      const intentRes = await paymentAPI.createDepositIntent(parsedAmount);
      const { clientSecret, transaction } = intentRes.data.data;

      if (!stripe || !elements) {
        toast.error('Stripe not loaded. Add your publishable key to .env');
        setIsLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        setIsLoading(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        const confirmRes = await paymentAPI.confirmDeposit(transaction.stripePaymentIntentId!);
        onSuccess(confirmRes.data.data.balance);
        toast.success(`$${parsedAmount.toFixed(2)} deposited successfully!`);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
          <input
            type="number"
            min="0.50"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Card Details</label>
        <div className="p-3 border border-gray-300 rounded-lg">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Test card: 4242 4242 4242 4242 · Any future date · Any CVC
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          leftIcon={isLoading ? <Loader size={16} className="animate-spin" /> : <CreditCard size={16} />}
          disabled={isLoading}
        >
          {isLoading ? 'Processing…' : 'Deposit Funds'}
        </Button>
      </div>
    </form>
  );
};

const MockDepositForm: React.FC<{ onClose: () => void; onSuccess: (b: number) => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount < 0.5) {
      toast.error('Minimum deposit is $0.50');
      return;
    }
    setIsLoading(true);
    try {
      const intentRes = await paymentAPI.createDepositIntent(parsedAmount);
      const { transaction } = intentRes.data.data;
      const confirmRes = await paymentAPI.confirmDeposit(transaction.stripePaymentIntentId!);
      onSuccess(confirmRes.data.data.balance);
      toast.success(`$${parsedAmount.toFixed(2)} deposited successfully! (sandbox mode)`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
        <strong>Sandbox Mode:</strong> Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to your frontend
        <code>.env</code> to enable real card input.
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
          <input
            type="number"
            min="0.50"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          leftIcon={isLoading ? <Loader size={16} className="animate-spin" /> : <CreditCard size={16} />}
          disabled={isLoading}
        >
          {isLoading ? 'Processing…' : 'Deposit (Sandbox)'}
        </Button>
      </div>
    </form>
  );
};

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Deposit Funds</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X size={24} />
            </button>
          </div>

          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <DepositForm onClose={onClose} onSuccess={onSuccess} />
            </Elements>
          ) : (
            <MockDepositForm onClose={onClose} onSuccess={onSuccess} />
          )}
        </div>
      </div>
    </div>
  );
};
