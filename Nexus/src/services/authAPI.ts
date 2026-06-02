import { api } from './api';
import { User } from '../types';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      profileImage?: string;
      bio?: string;
    };
    token: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    profileImage?: string;
    bio?: string;
    verified: boolean;
    createdAt: string;
  };
}

export interface OtpRequestResponse {
  success: boolean;
  message: string;
  otp?: string; // returned in dev mode only
  expiresInMinutes?: number;
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  data: { resetToken: string };
}

export const authAPI = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'ENTREPRENEUR' | 'INVESTOR';
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getCurrentUser: async (): Promise<ProfileResponse> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    profileImage?: string;
    preferences?: { emailNotifications?: boolean; theme?: string };
    socialLinks?: { linkedin?: string; twitter?: string; website?: string };
  }): Promise<ProfileResponse> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // OTP / password-reset flow
  requestOtp: async (email: string): Promise<OtpRequestResponse> => {
    const response = await api.post('/auth/otp/request', { email });
    return response.data;
  },

  verifyOtp: async (email: string, otp: string): Promise<OtpVerifyResponse> => {
    const response = await api.post('/auth/otp/verify', { email, otp });
    return response.data;
  },

  resetPassword: async (resetToken: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/password/reset', { resetToken, newPassword });
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ profileImage: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const token = localStorage.getItem('nexus_token');
    const response = await api.post('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return response.data.data;
  },
};

export const mapBackendUserToUser = (backendUser: any): User => ({
  id: backendUser.id,
  name: `${backendUser.firstName} ${backendUser.lastName}`,
  email: backendUser.email,
  role: backendUser.role.toLowerCase() as User['role'],
  avatarUrl:
    backendUser.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${backendUser.firstName} ${backendUser.lastName}`
    )}&background=random`,
  bio: backendUser.bio || '',
  createdAt: backendUser.createdAt,
});
