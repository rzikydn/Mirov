/**
 * Check Users in Database
 * Quick script to verify which users are in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('🔍 Checking users in database...\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    console.log(`Found ${users.length} users:\n`);
    console.table(users);

    console.log('\n✅ Check complete!');
  } catch (error) {
    console.error('❌ Error checking users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
