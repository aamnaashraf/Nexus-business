import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Alice Founder - Entrepreneur
  const alice = await prisma.user.findUnique({ where: { email: 'entrepreneur.v@nexus.dev' } });
  if (alice) {
    await prisma.user.update({
      where: { id: alice.id },
      data: { bio: 'AgriTech entrepreneur on a mission to modernize farming across Africa using IoT and data analytics. Former agricultural engineer turned tech founder. Built GreenGrow from a university project to a platform serving 3,000+ farmers.' },
    });
    await prisma.entrepreneurProfile.upsert({
      where: { userId: alice.id },
      update: {
        companyName: 'GreenGrow AgriTech', tagline: 'Feeding the future with smart farming',
        industry: 'AgriTech', location: 'Nairobi, Kenya', foundedYear: 2021,
        fundingStage: 'Seed', fundingAmount: '$600K', fundingTarget: '$3M',
        teamSize: 9,
        teamDescription: 'A passionate team of 9 — agricultural scientists, IoT engineers, and rural development experts. Collectively, our team has worked with 50,000+ smallholder farmers across Kenya, Uganda, and Tanzania.',
      },
      create: {
        userId: alice.id,
        companyName: 'GreenGrow AgriTech', tagline: 'Feeding the future with smart farming',
        industry: 'AgriTech', location: 'Nairobi, Kenya', foundedYear: 2021,
        fundingStage: 'Seed', fundingAmount: '$600K', fundingTarget: '$3M',
        teamSize: 9,
        teamDescription: 'A passionate team of 9 — agricultural scientists, IoT engineers, and rural development experts.',
      },
    });
    console.log('✅ Alice updated');
  }

  // Khalid Al-Mansoori - Investor
  const khalid = await prisma.user.findUnique({ where: { email: 'investor.v@nexus.dev' } });
  if (khalid) {
    await prisma.user.update({
      where: { id: khalid.id },
      data: { bio: 'Growth-stage investor and former operator with successful exits at two SaaS companies. Partner at Gulf Ventures, focusing on B2B software and marketplace businesses across MENA. 18 portfolio companies, 3 successful exits.' },
    });
    await prisma.investorProfile.upsert({
      where: { userId: khalid.id },
      update: {
        investmentFocus: ['SaaS', 'B2B Software', 'Marketplaces', 'E-Commerce'],
        investmentStage: ['Series A', 'Series B'],
        ticketSize: '$200K - $2M', portfolioCompanies: 18, location: 'Abu Dhabi, UAE',
      },
      create: {
        userId: khalid.id,
        investmentFocus: ['SaaS', 'B2B Software', 'Marketplaces', 'E-Commerce'],
        investmentStage: ['Series A', 'Series B'],
        ticketSize: '$200K - $2M', portfolioCompanies: 18, location: 'Abu Dhabi, UAE',
      },
    });
    console.log('✅ Khalid updated');
  }

  // Nadia Okonkwo - Investor
  const nadia = await prisma.user.findUnique({ where: { email: 'receiver2@nexus.dev' } });
  if (nadia) {
    await prisma.user.update({
      where: { id: nadia.id },
      data: { bio: 'Impact investor and climate tech advocate. Managing Partner at AfricaGreen Capital, a $50M fund focused on sustainable technology across Sub-Saharan Africa. Board member at 4 portfolio companies. Former sustainability director at Unilever Africa.' },
    });
    await prisma.investorProfile.upsert({
      where: { userId: nadia.id },
      update: {
        investmentFocus: ['CleanTech', 'AgriTech', 'Sustainability', 'HealthTech'],
        investmentStage: ['Pre-Seed', 'Seed', 'Series A'],
        ticketSize: '$100K - $1M', portfolioCompanies: 9, location: 'Lagos, Nigeria',
      },
      create: {
        userId: nadia.id,
        investmentFocus: ['CleanTech', 'AgriTech', 'Sustainability', 'HealthTech'],
        investmentStage: ['Pre-Seed', 'Seed', 'Series A'],
        ticketSize: '$100K - $1M', portfolioCompanies: 9, location: 'Lagos, Nigeria',
      },
    });
    console.log('✅ Nadia updated');
  }

  // Ahmed Khan - add investment history for Haya's deals page
  const ahmed = await prisma.user.findUnique({ where: { email: 'ahmed@test.com' } });
  if (ahmed) {
    await prisma.startupHistory.deleteMany({ where: { userId: ahmed.id } });
    await prisma.startupHistory.createMany({
      data: [
        { userId: ahmed.id, companyName: 'PayFast MENA', position: 'Co-Founder & CTO', startDate: new Date('2019-01-01'), endDate: new Date('2022-06-01'), description: 'B2B payment gateway serving 200+ merchants. Acquired by FinBridge Group in 2022.' },
        { userId: ahmed.id, companyName: 'DataSync Labs', position: 'Founder', startDate: new Date('2016-06-01'), endDate: new Date('2018-12-01'), description: 'Real-time data synchronisation tool for enterprise CRM systems. Bootstrapped to $80K ARR.' },
      ],
    });
    console.log('✅ Ahmed startup history added');
  }

  // Ali Hassan - add startup history
  const ali = await prisma.user.findUnique({ where: { email: 'ali@test.com' } });
  if (ali) {
    await prisma.startupHistory.deleteMany({ where: { userId: ali.id } });
    await prisma.startupHistory.createMany({
      data: [
        { userId: ali.id, companyName: 'ShipEasy Logistics', position: 'Founder & CEO', startDate: new Date('2020-03-01'), endDate: new Date('2023-01-01'), description: 'Last-mile delivery SaaS for e-commerce businesses in Pakistan. Scaled to 150 merchant clients before acquisition.' },
      ],
    });
    console.log('✅ Ali startup history added');
  }

  // Haya - add investment history
  const haya = await prisma.user.findUnique({ where: { email: 'haya@zahra.com' } });
  if (haya) {
    await prisma.investmentHistory.deleteMany({ where: { userId: haya.id } });
    await prisma.investmentHistory.createMany({
      data: [
        { userId: haya.id, companyName: 'TechNova AI', amount: 250000, currency: 'USD', investmentDate: new Date('2023-08-01'), description: 'Lead investor in Seed round. AI-powered financial analytics platform.' },
        { userId: haya.id, companyName: 'EduBridge', amount: 150000, currency: 'USD', investmentDate: new Date('2022-11-01'), description: 'Ed-tech startup enabling remote vocational training across MENA.' },
        { userId: haya.id, companyName: 'MedChain', amount: 300000, currency: 'USD', investmentDate: new Date('2021-05-01'), description: 'Blockchain-based medical records platform. Now Series A.' },
      ],
    });
    console.log('✅ Haya investment history added');
  }

  // Zara - add investment history
  const zara = await prisma.user.findUnique({ where: { email: 'zara@test.com' } });
  if (zara) {
    await prisma.investmentHistory.deleteMany({ where: { userId: zara.id } });
    await prisma.investmentHistory.createMany({
      data: [
        { userId: zara.id, companyName: 'SwiftPay', amount: 100000, currency: 'USD', investmentDate: new Date('2024-01-01'), description: 'Angel investment in payment infrastructure for South Asian SMEs.' },
        { userId: zara.id, companyName: 'HealthFirst AI', amount: 75000, currency: 'USD', investmentDate: new Date('2023-03-01'), description: 'AI-assisted diagnostics for rural health clinics in Pakistan.' },
        { userId: zara.id, companyName: 'LearnPath', amount: 50000, currency: 'USD', investmentDate: new Date('2022-07-01'), description: 'Adaptive online learning platform focused on professional upskilling.' },
      ],
    });
    console.log('✅ Zara investment history added');
  }

  console.log('\n🎉 All profiles updated!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
