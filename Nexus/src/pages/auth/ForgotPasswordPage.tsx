import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

type Step = 'email' | 'otp' | 'password';

export const ForgotPasswordPage: React.FC = () => {
  const { forgotPassword, verifyOtp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const token = await verifyOtp(email, otp);
      setResetToken(token);
      setStep('password');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitle: Record<Step, string> = {
    email: 'Reset your password',
    otp: 'Enter verification code',
    password: 'Set new password',
  };

  const stepDesc: Record<Step, string> = {
    email: "Enter your email and we'll send a 6-digit OTP.",
    otp: `We sent a 6-digit code to ${email}.`,
    password: 'Choose a strong new password.',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center">
            <KeyRound size={24} className="text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {stepTitle[step]}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">{stepDesc[step]}</p>

        {/* Progress dots */}
        <div className="mt-4 flex justify-center gap-2">
          {(['email', 'otp', 'password'] as Step[]).map((s, i) => {
            const currentIndex = (['email', 'otp', 'password'] as Step[]).indexOf(step);
            return (
              <div
                key={s}
                className={`w-8 h-1.5 rounded-full transition-colors ${
                  step === s ? 'bg-primary-600' : currentIndex > i ? 'bg-primary-300' : 'bg-gray-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                startAdornment={<Mail size={18} />}
                placeholder="you@example.com"
              />
              <Button type="submit" fullWidth isLoading={isLoading}>
                Send verification code
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  6-digit code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  placeholder="000000"
                  className="block w-full text-center text-2xl tracking-widest font-mono px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1.5 text-xs text-gray-500">Code expires in 5 minutes.</p>
              </div>
              <Button type="submit" fullWidth isLoading={isLoading} leftIcon={<CheckCircle size={16} />}>
                Verify code
              </Button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError(null); }}
                className="w-full text-sm text-primary-600 hover:text-primary-500 text-center"
              >
                Resend code or change email
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                fullWidth
                startAdornment={<Lock size={18} />}
              />
              <div className="text-xs text-gray-600 space-y-0.5 -mt-3">
                <p className={newPassword.length >= 8 ? 'text-green-600' : ''}>✓ At least 8 characters</p>
                <p className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>✓ One uppercase letter</p>
                <p className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>✓ One lowercase letter</p>
                <p className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>✓ One number</p>
              </div>
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                fullWidth
                startAdornment={<Lock size={18} />}
              />
              <Button type="submit" fullWidth isLoading={isLoading}>
                Reset password
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
