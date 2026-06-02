import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { generateToken } from '../utils/token';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ENTREPRENEUR' | 'INVESTOR';
}

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
  startupHistories?: Array<{
    companyName: string;
    position?: string;
    startDate: Date;
    endDate?: Date;
    description?: string;
  }>;
  investmentHistories?: Array<{
    companyName: string;
    amount: number;
    currency?: string;
    description?: string;
  }>;
  preferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    theme?: string;
    language?: string;
  };
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
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
  };
  investorProfile?: {
    investmentFocus?: string[];
    investmentStage?: string[];
    ticketSize?: string;
    portfolioCompanies?: number;
    location?: string;
  };
}

export class AuthService {
  async register(data: RegisterData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (data.role === 'ENTREPRENEUR') {
      await prisma.entrepreneurProfile.create({
        data: { userId: user.id },
      });
    } else if (data.role === 'INVESTOR') {
      await prisma.investorProfile.create({
        data: { userId: user.id },
      });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return {
      user,
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        profileImage: true,
        bio: true,
        verified: true,
        createdAt: true,
        startupHistories: {
          orderBy: { startDate: 'desc' },
        },
        investmentHistories: {
          orderBy: { investmentDate: 'desc' },
        },
        preferences: true,
        socialLinks: true,
        entrepreneurProfile: true,
        investorProfile: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileData) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const {
      startupHistories,
      investmentHistories,
      preferences,
      socialLinks,
      entrepreneurProfile,
      investorProfile,
      ...userData
    } = data;

    await prisma.user.update({
      where: { id: userId },
      data: userData,
    });

    if (startupHistories) {
      await prisma.startupHistory.deleteMany({ where: { userId } });
      await prisma.startupHistory.createMany({
        data: startupHistories.map((h) => ({ ...h, userId })),
      });
    }

    if (investmentHistories) {
      await prisma.investmentHistory.deleteMany({ where: { userId } });
      await prisma.investmentHistory.createMany({
        data: investmentHistories.map((h) => ({
          ...h,
          userId,
          currency: h.currency || 'USD',
        })),
      });
    }

    if (preferences) {
      await prisma.userPreferences.upsert({
        where: { userId },
        update: preferences,
        create: { ...preferences, userId },
      });
    }

    if (socialLinks) {
      await prisma.socialLinks.upsert({
        where: { userId },
        update: socialLinks,
        create: { ...socialLinks, userId },
      });
    }

    if (entrepreneurProfile) {
      await prisma.entrepreneurProfile.upsert({
        where: { userId },
        update: entrepreneurProfile,
        create: { ...entrepreneurProfile, userId },
      });
    }

    if (investorProfile) {
      await prisma.investorProfile.upsert({
        where: { userId },
        update: investorProfile,
        create: {
          userId,
          investmentFocus: investorProfile.investmentFocus ?? [],
          investmentStage: investorProfile.investmentStage ?? [],
          ticketSize: investorProfile.ticketSize,
          portfolioCompanies: investorProfile.portfolioCompanies ?? 0,
          location: investorProfile.location,
        },
      });
    }

    return this.getProfile(userId);
  }

  async getCurrentUser(userId: string) {
    return this.getProfile(userId);
  }
}