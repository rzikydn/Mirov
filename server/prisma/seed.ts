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

  // Create SUPERUSER
  const superuser = await prisma.user.create({
    data: {
      email: 'superusermirov',
      password: await bcrypt.hash('superuser123', 10),
      name: 'Super Admin',
      role: 'SUPERUSER'
    }
  });
  console.log('✅ Superuser created:', superuser.email);

  // Create ADMIN
  const admin = await prisma.user.create({
    data: {
      email: 'adminmirov',
      password: await bcrypt.hash('admin123', 10),
      name: 'Admin User',
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin created:', admin.email);

  // Create UMUM (regular user)
  const umum = await prisma.user.create({
    data: {
      email: 'usermirov',
      password: await bcrypt.hash('user123', 10),
      name: 'Regular User',
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
      createdBy: admin.id
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
      createdBy: superuser.id
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
      createdBy: admin.id
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
      userId: superuser.id
    }
  });

  await prisma.note.create({
    data: {
      title: 'Meeting Notes',
      content: 'Important points discussed in the last team meeting',
      color: '#FBCFE8',
      userId: admin.id
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
  console.log('👥 Users Created:');
  console.log(`   • Superuser: ${superuser.email} / superuser123`);
  console.log(`   • Admin: ${admin.email} / admin123`);
  console.log(`   • User: ${umum.email} / user123`);
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
