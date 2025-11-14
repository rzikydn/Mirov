/**
 * Force Update Railway Production Users
 * This script MUST run with Railway DATABASE_URL
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Force check DATABASE_URL
console.log('\n🔍 Checking DATABASE_URL...');
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

console.log('📍 Database Host:', dbUrl.includes('ballast.proxy.rlwy.net') || dbUrl.includes('railway')
  ? '✅ Railway Production'
  : '⚠️  Unknown - might not be Railway!');
console.log('🔗 Connection:', dbUrl.substring(0, 50) + '...\n');

const prisma = new PrismaClient();

interface UserData {
  email: string;
  password: string;
  name: string;
  role: 'SUPERUSER' | 'ADMIN' | 'UMUM';
}

const newUsers: UserData[] = [
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

async function forceUpdateUsers() {
  console.log('🔄 FORCE UPDATE - Railway Production Users\n');
  console.log('⚠️  This will DELETE old users and CREATE new ones!\n');

  try {
    // Step 1: Delete old users
    console.log('🗑️  Step 1: Deleting old users...');
    const deleteResult = await prisma.user.deleteMany({
      where: {
        email: {
          in: ['superusermirov', 'adminmirov', 'usermirov']
        }
      }
    });
    console.log(`✅ Deleted ${deleteResult.count} old users\n`);

    // Step 2: Create new users
    console.log('✨ Step 2: Creating new users...');
    let created = 0;

    for (const userData of newUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      try {
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
          },
        });

        console.log(`✅ Created: ${user.email} (${user.role})`);
        created++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          // User exists, update instead
          const user = await prisma.user.update({
            where: { email: userData.email },
            data: {
              password: hashedPassword,
              name: userData.name,
              role: userData.role,
            },
          });
          console.log(`🔄 Updated: ${user.email} (${user.role})`);
          created++;
        } else {
          throw error;
        }
      }
    }

    console.log(`\n✅ Created/Updated ${created} users\n`);

    // Step 3: Verify
    console.log('📊 Step 3: Verifying results...\n');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    console.log('Current users in database:');
    console.log('━'.repeat(80));
    console.table(allUsers);

    console.log('\n✅ Force update completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   SUPERUSER: usertaufan / taufan123');
    console.log('   ADMIN: adminagung / agung123');
    console.log('   UMUM: umumalfi / alfi123\n');

    return allUsers.length;

  } catch (error) {
    console.error('❌ Error during force update:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the force update
forceUpdateUsers()
  .then((count) => {
    console.log(`\n🎉 Done! Total users in database: ${count}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
