/**
 * Update Production Users Script
 *
 * This script updates user credentials in production database.
 * Run this on Railway using: railway run npm run update-users
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface UserData {
  email: string;
  password: string;
  name: string;
  role: 'SUPERUSER' | 'ADMIN' | 'UMUM';
}

const users: UserData[] = [
  // SUPERUSER (4 users)
  { email: 'usertaufan', password: 'taufan123', name: 'Taufan', role: 'SUPERUSER' },
  { email: 'userhans', password: 'hans123', name: 'Hans', role: 'SUPERUSER' },
  { email: 'userjelly', password: 'jelly123', name: 'Jelly', role: 'SUPERUSER' },
  { email: 'userdev', password: 'dev123', name: 'Developer', role: 'SUPERUSER' },

  // ADMIN (4 users)
  { email: 'adminagung', password: 'agung123', name: 'Agung', role: 'ADMIN' },
  { email: 'adminamin', password: 'amin123', name: 'Amin', role: 'ADMIN' },
  { email: 'adminsyaiful', password: 'syaiful123', name: 'Syaiful', role: 'ADMIN' },
  { email: 'admindea', password: 'dea123', name: 'Dea', role: 'ADMIN' },

  // UMUM (1 user)
  { email: 'umumalfi', password: 'alfi123', name: 'Alfi', role: 'UMUM' },
];

async function updateUsers() {
  console.log('🔄 Starting user update process...\n');

  try {
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      console.log(`Processing: ${userData.email} (${userData.role})`);

      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
        },
        create: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
        },
      });

      console.log(`✅ ${user.email} - ${user.role} updated/created`);
    }

    console.log('\n📊 Verifying results...\n');

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    console.log('Current users in database:');
    console.log('━'.repeat(80));
    console.table(allUsers);

    console.log('\n✅ User update completed successfully!');
    console.log('\n📝 You can now login with:');
    console.log('   usertaufan / taufan123');
    console.log('   Or any other user from the list above');

  } catch (error) {
    console.error('❌ Error updating users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateUsers()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
