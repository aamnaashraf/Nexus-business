import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import { authAPI, mapBackendUserToUser } from '../services/authAPI';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'nexus_user';
const TOKEN_STORAGE_KEY = 'nexus_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On startup: validate the stored token against the backend.
  // If the token is expired or invalid the API returns 401, the response
  // interceptor in services/api.ts clears storage; we just clear local state here.
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedToken || !storedUser) {
      setIsLoading(false);
      return;
    }

    authAPI
      .getCurrentUser()
      .then((res) => {
        // Refresh user data from server (profile may have changed)
        const freshUser = mapBackendUserToUser(res.data);
        setUser(freshUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
      })
      .catch(() => {
        // Token invalid / expired — clear everything
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });

      if (response.data.user.role.toLowerCase() !== role) {
        throw new Error(`This account is not registered as ${role}. Please select the correct role.`);
      }

      const mappedUser = mapBackendUserToUser(response.data.user);
      setUser(mappedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Login failed.';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const [firstName, ...rest] = name.trim().split(' ');
      const lastName = rest.join(' ') || 'User';

      const response = await authAPI.register({
        email,
        password,
        firstName,
        lastName,
        role: role.toUpperCase() as 'ENTREPRENEUR' | 'INVESTOR',
      });

      const mappedUser = mapBackendUserToUser(response.data.user);
      setUser(mappedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, response.data.token);
      toast.success('Account created successfully!');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Registration failed.';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1 of the OTP password-reset flow.
  // In dev mode the backend returns the OTP directly; toast shows it.
  const forgotPassword = async (email: string): Promise<void> => {
    const response = await authAPI.requestOtp(email);
    if (response.otp) {
      // Dev-mode convenience: show the OTP so testers don't need a real inbox
      toast.success(`OTP sent! (dev mode) Your code is: ${response.otp}`, { duration: 15000 });
    } else {
      toast.success('If that email is registered, an OTP has been sent.');
    }
  };

  // Step 2 — verify OTP and return a reset token.
  const verifyOtp = async (email: string, otp: string): Promise<string> => {
    const response = await authAPI.verifyOtp(email, otp);
    return response.data.resetToken;
  };

  // Step 3 — set a new password using the reset token from step 2.
  const resetPassword = async (resetToken: string, newPassword: string): Promise<void> => {
    await authAPI.resetPassword(resetToken, newPassword);
    toast.success('Password reset successfully. Please log in with your new password.');
  };

  const logout = (): void => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const [firstName, ...rest] = (updates.name || '').trim().split(' ');
      await authAPI.updateProfile({
        firstName: firstName || undefined,
        lastName: rest.join(' ') || undefined,
        bio: updates.bio,
        profileImage: updates.avatarUrl,
      });

      if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Update failed.';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
