import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  await prisma.schedule.deleteMany();
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();

  console.log('✨ Creating users...');

  // Create SUPERUSER (3 users)
  const superuser1 = await prisma.user.create({
    data: {
      email: 'usertaufan',
      password: await bcrypt.hash('taufan123', 10),
      name: 'Taufan',
      role: 'SUPERUSER'
    }
  });
  console.log('✅ Superuser created:', superuser1.email);

  const superuser2 = await prisma.user.create({
    data: {
      email: 'userhans',
      password: await bcrypt.hash('hans123', 10),
      name: 'Hans',
      role: 'SUPERUSER'
    }
  });
  console.log('✅ Superuser created:', superuser2.email);

  const superuser3 = await prisma.user.create({
    data: {
      email: 'userjelly',
      password: await bcrypt.hash('jelly123', 10),
      name: 'Jelly',
      role: 'SUPERUSER'
    }
  });
  console.log('✅ Superuser created:', superuser3.email);

  // Create ADMIN (4 users)
  const admin1 = await prisma.user.create({
    data: {
      email: 'adminagung',
      password: await bcrypt.hash('agung123', 10),
      name: 'Agung',
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin created:', admin1.email);

  const admin2 = await prisma.user.create({
    data: {
      email: 'adminamin',
      password: await bcrypt.hash('amin123', 10),
      name: 'Amin',
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin created:', admin2.email);

  const admin3 = await prisma.user.create({
    data: {
      email: 'adminsyaiful',
      password: await bcrypt.hash('syaiful123', 10),
      name: 'Syaiful',
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin created:', admin3.email);

  const admin4 = await prisma.user.create({
    data: {
      email: 'admindea',
      password: await bcrypt.hash('dea123', 10),
      name: 'Dea',
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin created:', admin4.email);

  // Create UMUM (1 user)
  const umum = await prisma.user.create({
    data: {
      email: 'umumalfi',
      password: await bcrypt.hash('alfi123', 10),
      name: 'Alfi',
      role: 'UMUM'
    }
  });
  console.log('✅ Regular user created:', umum.email);

  console.log('✨ Creating sample schedules...');

  // Create sample schedules
  await prisma.schedule.create({
    data: {
      title: 'Team Meeting',
      description: 'Weekly team sync meeting to discuss project progress',
      startDate: new Date('2025-01-15T10:00:00'),
      endDate: new Date('2025-01-15T11:00:00'),
      location: 'Meeting Room A',
      status: 'planned',
      createdBy: admin1.id
    }
  });

  await prisma.schedule.create({
    data: {
      title: 'Product Launch',
      description: 'Launch event for new product release',
      startDate: new Date('2025-02-01T14:00:00'),
      endDate: new Date('2025-02-01T17:00:00'),
      location: 'Main Hall',
      status: 'planned',
      createdBy: superuser1.id
    }
  });

  await prisma.schedule.create({
    data: {
      title: 'Training Session',
      description: 'Technical training for new team members',
      startDate: new Date('2025-01-20T09:00:00'),
      endDate: new Date('2025-01-20T12:00:00'),
      location: 'Training Room',
      status: 'planned',
      createdBy: admin2.id
    }
  });

  console.log('✅ Sample schedules created (3 schedules)');

  console.log('✨ Creating sample notes...');

  // Create sample notes
  await prisma.note.create({
    data: {
      title: 'Project Ideas',
      content: 'Brainstorming ideas for upcoming projects and features',
      color: '#FEF08A',
      userId: superuser1.id
    }
  });

  await prisma.note.create({
    data: {
      title: 'Meeting Notes',
      content: 'Important points discussed in the last team meeting',
      color: '#FBCFE8',
      userId: admin1.id
    }
  });

  await prisma.note.create({
    data: {
      title: 'To-Do List',
      content: 'Tasks to complete this week',
      color: '#BFDBFE',
      userId: umum.id
    }
  });

  console.log('✅ Sample notes created');

  console.log('\n📋 SEED DATA SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👥 Users Created (8 total):');
  console.log('\n🔹 SUPERUSER (3 users):');
  console.log(`   • ${superuser1.name}: ${superuser1.email} / taufan123`);
  console.log(`   • ${superuser2.name}: ${superuser2.email} / hans123`);
  console.log(`   • ${superuser3.name}: ${superuser3.email} / jelly123`);
  console.log('\n🔹 ADMIN (4 users):');
  console.log(`   • ${admin1.name}: ${admin1.email} / agung123`);
  console.log(`   • ${admin2.name}: ${admin2.email} / amin123`);
  console.log(`   • ${admin3.name}: ${admin3.email} / syaiful123`);
  console.log(`   • ${admin4.name}: ${admin4.email} / dea123`);
  console.log('\n🔹 UMUM (1 user):');
  console.log(`   • ${umum.name}: ${umum.email} / alfi123`);
  console.log('\n📅 Schedules Created: 3');
  console.log('📝 Notes Created: 3');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
