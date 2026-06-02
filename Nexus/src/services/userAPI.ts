import { api } from './api';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
  bio?: string;
  createdAt: string;
  entrepreneurProfile?: {
    companyName?: string;
    tagline?: string;
    industry?: string;
    location?: string;
    foundedYear?: number;
    fundingStage?: string;
    fundingAmount?: string;
    fundingTarget?: string;
    teamSize?: number;
    teamDescription?: string;
    pitchDeck?: string;
    businessPlan?: string;
  } | null;
  investorProfile?: {
    investmentFocus: string[];
    investmentStage: string[];
    ticketSize?: string;
    portfolioCompanies: number;
    location?: string;
  } | null;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  } | null;
}

export interface UserDetail extends UserSummary {
  verified: boolean;
  startupHistories: Array<{
    id: string;
    companyName: string;
    position?: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  investmentHistories: Array<{
    id: string;
    companyName: string;
    amount: number;
    currency: string;
    investmentDate: string;
    description?: string;
  }>;
}

export const userAPI = {
  getAllUsers: async (role?: string) => {
    const params = role ? { role } : {};
    const response = await api.get<{ success: boolean; data: UserSummary[] }>('/users', { params });
    return response.data;
  },

  getUserById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: UserDetail }>(`/users/${id}`);
    return response.data;
  },
};
