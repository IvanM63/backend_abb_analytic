import { PrismaClient } from '@prisma/client';
import { seedTypeAnalytics } from './seeds/type-analytic.seed';
import { seedServers } from './seeds/servers.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database seeding...');

  try {
    // Seed servers first (they are referenced by primary analytics)
    //await seedServers();

    // Seed type analytics
    await seedTypeAnalytics();

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('📊 Database connection closed.');
  });
