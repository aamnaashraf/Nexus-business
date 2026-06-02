import { prisma } from '../src/config/database';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Starting database seed...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const investor = await prisma.user.upsert({
    where: { email: 'investor@example.com' },
    update: {},
    create: {
      email: 'investor@example.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Investor',
      role: 'INVESTOR',
      bio: 'Experienced angel investor focused on tech startups',
      investorProfile: {
        create: {
          investmentFocus: ['TECH', 'FINTECH'],
          ticketSize: '$50K - $500K',
          portfolioCompanies: 15,
        },
      },
    },
  });

  const entrepreneur = await prisma.user.upsert({
    where: { email: 'entrepreneur@example.com' },
    update: {},
    create: {
      email: 'entrepreneur@example.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Entrepreneur',
      role: 'ENTREPRENEUR',
      bio: 'Founder of innovative startup solutions',
      entrepreneurProfile: {
        create: {
          companyName: 'TechInnovate',
          industry: 'SaaS',
          fundingStage: 'Seed',
        },
      },
    },
  });

  console.log('✅ Database seeded successfully');
  console.log('📧 Investor: investor@example.com');
  console.log('📧 Entrepreneur: entrepreneur@example.com');
  console.log('🔑 Password: password123');
  
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});