import bcrypt from 'bcryptjs';
import { db } from './index';
import { users, schedules, notes, chatbotSettings, chatbotFaqs } from './schema';

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  await db.delete(schedules);
  await db.delete(notes);
  await db.delete(users);

  console.log('✨ Creating users...');

  // Create SUPERUSER (3 users)
  const [superuser1] = await db.insert(users).values({
    email: 'usertaufan',
    password: await bcrypt.hash('taufan123', 10),
    name: 'Taufan',
    role: 'SUPERUSER'
  }).$returningId();
  console.log('✅ Superuser created: usertaufan');

  await db.insert(users).values({
    email: 'userhans',
    password: await bcrypt.hash('hans123', 10),
    name: 'Hans',
    role: 'SUPERUSER'
  }).$returningId();
  console.log('✅ Superuser created: userhans');

  await db.insert(users).values({
    email: 'userjelly',
    password: await bcrypt.hash('jelly123', 10),
    name: 'Jelly',
    role: 'SUPERUSER'
  }).$returningId();
  console.log('✅ Superuser created: userjelly');

  // Create ADMIN (4 users)
  const [admin1] = await db.insert(users).values({
    email: 'adminagung',
    password: await bcrypt.hash('agung123', 10),
    name: 'Agung',
    role: 'ADMIN'
  }).$returningId();
  console.log('✅ Admin created: adminagung');

  const [admin2] = await db.insert(users).values({
    email: 'adminamin',
    password: await bcrypt.hash('amin123', 10),
    name: 'Amin',
    role: 'ADMIN'
  }).$returningId();
  console.log('✅ Admin created: adminamin');

  await db.insert(users).values({
    email: 'adminsyaiful',
    password: await bcrypt.hash('syaiful123', 10),
    name: 'Syaiful',
    role: 'ADMIN'
  }).$returningId();
  console.log('✅ Admin created: adminsyaiful');

  await db.insert(users).values({
    email: 'admindea',
    password: await bcrypt.hash('dea123', 10),
    name: 'Dea',
    role: 'ADMIN'
  }).$returningId();
  console.log('✅ Admin created: admindea');

  // Create UMUM (1 user)
  const [umum] = await db.insert(users).values({
    email: 'umumalfi',
    password: await bcrypt.hash('alfi123', 10),
    name: 'Alfi',
    role: 'UMUM'
  }).$returningId();
  console.log('✅ Regular user created: umumalfi');

  console.log('✨ Creating sample schedules...');

  // Create sample schedules
  await db.insert(schedules).values({
    title: 'Team Meeting',
    description: 'Weekly team sync meeting to discuss project progress',
    startDate: new Date('2025-01-15T10:00:00'),
    endDate: new Date('2025-01-15T11:00:00'),
    location: 'Meeting Room A',
    status: 'planned',
    createdBy: admin1.id
  });

  await db.insert(schedules).values({
    title: 'Product Launch',
    description: 'Launch event for new product release',
    startDate: new Date('2025-02-01T14:00:00'),
    endDate: new Date('2025-02-01T17:00:00'),
    location: 'Main Hall',
    status: 'planned',
    createdBy: superuser1.id
  });

  await db.insert(schedules).values({
    title: 'Training Session',
    description: 'Technical training for new team members',
    startDate: new Date('2025-01-20T09:00:00'),
    endDate: new Date('2025-01-20T12:00:00'),
    location: 'Training Room',
    status: 'planned',
    createdBy: admin2.id
  });

  console.log('✅ Sample schedules created (3 schedules)');

  console.log('✨ Creating sample notes...');

  // Create sample notes
  await db.insert(notes).values({
    title: 'Project Ideas',
    content: 'Brainstorming ideas for upcoming projects and features',
    color: '#FEF08A',
    userId: superuser1.id
  });

  await db.insert(notes).values({
    title: 'Meeting Notes',
    content: 'Important points discussed in the last team meeting',
    color: '#FBCFE8',
    userId: admin1.id
  });

  await db.insert(notes).values({
    title: 'To-Do List',
    content: 'Tasks to complete this week',
    color: '#BFDBFE',
    userId: umum.id
  });

  console.log('✅ Sample notes created');

  console.log('✨ Creating default AI Chatbot Settings...');
  await db.insert(chatbotSettings).values({
    botName: 'BSMR AI Assistant',
    welcomeMessage: 'Halo! Selamat datang di Website Resmi BSMR. Ada yang bisa kami bantu terkait Sertifikasi Manajemen Risiko Perbankan?',
    waNumber: '6281299008899',
    systemPrompt: 'Anda adalah AI Assistant Resmi BSMR (Badan Sertifikasi Manajemen Risiko). Berikan jawaban yang ramah, profesional, akurat sesuai dengan dokumen Knowledge Base BSMR.',
    temperature: '0.7',
    modelName: 'gemini-1.5-flash',
    autoEscalation: true,
  });

  console.log('✨ Creating default Chatbot FAQs...');
  await db.insert(chatbotFaqs).values([
    {
      question: 'Jadwal Asesmen Level 2',
      answer: 'Asesmen Level 2 BSMR dilaksanakan setiap bulan pada minggu ke-2 dan ke-4. Silakan cek menu Jadwal Asesmen di portal resmi.',
      category: 'Sertifikasi',
      hits: 420,
      status: 'ACTIVE',
    },
    {
      question: 'Mekanisme Perpanjangan',
      answer: 'Perpanjangan sertifikasi dilakukan dengan memenuhi kecukupan poin SKP Maintenance minimal 50 poin per periode 3 tahun.',
      category: 'Perpanjangan',
      hits: 310,
      status: 'ACTIVE',
    },
    {
      question: 'Rincian Biaya Sertifikasi',
      answer: 'Biaya Ujian Sertifikasi Level 1 s.d. Level 5 bervariasi sesuai regulasi BSMR. Silakan hubungi Sekretariat BSMR untuk rincian penawaran.',
      category: 'Biaya',
      hits: 240,
      status: 'ACTIVE',
    },
    {
      question: 'Syarat Poin SKP Maintenance',
      answer: 'SKP Maintenance dikumpulkan melalui partisipasi dalam seminar, workshop, pelatihan, atau mengajar materi Manajemen Risiko.',
      category: 'SKP',
      hits: 180,
      status: 'ACTIVE',
    },
    {
      question: 'Persyaratan Asesi Umum',
      answer: 'Persyaratan dasar meliputi KTP, Pasfoto 3x4, Ijazah Terakhir/Surat Keterangan Kerja di Industri Perbankan/Jasa Keuangan.',
      category: 'Persyaratan',
      hits: 120,
      status: 'ACTIVE',
    },
  ]);
  console.log('✅ Default AI Chatbot Settings & FAQs created');

  console.log('\n📋 SEED DATA SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👥 Users Created (8 total):');
  console.log('\n🔹 SUPERUSER (3 users):');
  console.log('   • Taufan: usertaufan / taufan123');
  console.log('   • Hans: userhans / hans123');
  console.log('   • Jelly: userjelly / jelly123');
  console.log('\n🔹 ADMIN (4 users):');
  console.log('   • Agung: adminagung / agung123');
  console.log('   • Amin: adminamin / amin123');
  console.log('   • Syaiful: adminsyaiful / syaiful123');
  console.log('   • Dea: admindea / dea123');
  console.log('\n🔹 UMUM (1 user):');
  console.log('   • Alfi: umumalfi / alfi123');
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
    process.exit(0);
  });
