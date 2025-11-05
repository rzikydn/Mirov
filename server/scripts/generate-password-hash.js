/**
 * Generate Password Hash for Production Database
 *
 * This script generates bcrypt hashes for all user passwords
 * to be used in production database update.
 *
 * Usage:
 *   node scripts/generate-password-hash.js
 */

const bcrypt = require('bcryptjs');

// User credentials
const users = [
  // SUPERUSER (3 users)
  { name: 'Taufan', email: 'usertaufan', password: 'taufan123', role: 'SUPERUSER' },
  { name: 'Hans', email: 'userhans', password: 'hans123', role: 'SUPERUSER' },
  { name: 'Jelly', email: 'userjelly', password: 'jelly123', role: 'SUPERUSER' },

  // ADMIN (4 users)
  { name: 'Agung', email: 'adminagung', password: 'agung123', role: 'ADMIN' },
  { name: 'Amin', email: 'adminamin', password: 'amin123', role: 'ADMIN' },
  { name: 'Syaiful', email: 'adminsyaiful', password: 'syaiful123', role: 'ADMIN' },
  { name: 'Dea', email: 'admindea', password: 'dea123', role: 'ADMIN' },

  // UMUM (1 user)
  { name: 'Alfi', email: 'umumalfi', password: 'alfi123', role: 'UMUM' },
];

async function generateHashes() {
  console.log('🔐 Generating password hashes...\n');
  console.log('═'.repeat(80));

  const hashedUsers = [];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);
    hashedUsers.push({ ...user, hash });

    console.log(`\n${user.role} - ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Hash: ${hash}`);
    console.log('-'.repeat(80));
  }

  console.log('\n\n📋 SQL UPDATE STATEMENTS');
  console.log('═'.repeat(80));
  console.log('-- Copy paste these SQL statements to Railway Postgres Query tab:\n');

  // Generate SQL for SUPERUSER updates
  console.log('\n-- Update SUPERUSER accounts');
  const superusers = hashedUsers.filter(u => u.role === 'SUPERUSER');

  // First SUPERUSER (update from superusermirov)
  console.log(`\nUPDATE users SET`);
  console.log(`  email = '${superusers[0].email}',`);
  console.log(`  name = '${superusers[0].name}',`);
  console.log(`  role = 'SUPERUSER',`);
  console.log(`  password = '${superusers[0].hash}',`);
  console.log(`  "updatedAt" = NOW()`);
  console.log(`WHERE email = 'superusermirov' OR id = (SELECT MIN(id) FROM users WHERE role = 'SUPERUSER');`);

  // Additional SUPERUSER accounts
  for (let i = 1; i < superusers.length; i++) {
    console.log(`\nINSERT INTO users (email, password, name, role, "createdAt", "updatedAt")`);
    console.log(`VALUES ('${superusers[i].email}', '${superusers[i].hash}', '${superusers[i].name}', 'SUPERUSER', NOW(), NOW())`);
    console.log(`ON CONFLICT (email) DO UPDATE SET`);
    console.log(`  password = EXCLUDED.password,`);
    console.log(`  name = EXCLUDED.name,`);
    console.log(`  role = EXCLUDED.role,`);
    console.log(`  "updatedAt" = NOW();`);
  }

  // Generate SQL for ADMIN updates
  console.log('\n\n-- Update ADMIN accounts');
  const admins = hashedUsers.filter(u => u.role === 'ADMIN');

  // First ADMIN (update from adminmirov)
  console.log(`\nUPDATE users SET`);
  console.log(`  email = '${admins[0].email}',`);
  console.log(`  name = '${admins[0].name}',`);
  console.log(`  role = 'ADMIN',`);
  console.log(`  password = '${admins[0].hash}',`);
  console.log(`  "updatedAt" = NOW()`);
  console.log(`WHERE email = 'adminmirov' OR id = (SELECT MIN(id) FROM users WHERE role = 'ADMIN');`);

  // Additional ADMIN accounts
  for (let i = 1; i < admins.length; i++) {
    console.log(`\nINSERT INTO users (email, password, name, role, "createdAt", "updatedAt")`);
    console.log(`VALUES ('${admins[i].email}', '${admins[i].hash}', '${admins[i].name}', 'ADMIN', NOW(), NOW())`);
    console.log(`ON CONFLICT (email) DO UPDATE SET`);
    console.log(`  password = EXCLUDED.password,`);
    console.log(`  name = EXCLUDED.name,`);
    console.log(`  role = EXCLUDED.role,`);
    console.log(`  "updatedAt" = NOW();`);
  }

  // Generate SQL for UMUM update
  console.log('\n\n-- Update UMUM account');
  const umum = hashedUsers.find(u => u.role === 'UMUM');
  console.log(`\nUPDATE users SET`);
  console.log(`  email = '${umum.email}',`);
  console.log(`  name = '${umum.name}',`);
  console.log(`  role = 'UMUM',`);
  console.log(`  password = '${umum.hash}',`);
  console.log(`  "updatedAt" = NOW()`);
  console.log(`WHERE email = 'usermirov' OR id = (SELECT MIN(id) FROM users WHERE role = 'UMUM');`);

  console.log(`\nINSERT INTO users (email, password, name, role, "createdAt", "updatedAt")`);
  console.log(`VALUES ('${umum.email}', '${umum.hash}', '${umum.name}', 'UMUM', NOW(), NOW())`);
  console.log(`ON CONFLICT (email) DO UPDATE SET`);
  console.log(`  password = EXCLUDED.password,`);
  console.log(`  name = EXCLUDED.name,`);
  console.log(`  role = EXCLUDED.role,`);
  console.log(`  "updatedAt" = NOW();`);

  // Verification query
  console.log('\n\n-- Verify the update');
  console.log(`SELECT id, email, name, role, "createdAt", "updatedAt" FROM users ORDER BY role, name;`);

  console.log('\n\n═'.repeat(80));
  console.log('✅ Password hashes generated successfully!');
  console.log('\n📝 NEXT STEPS:');
  console.log('1. Copy the SQL statements above');
  console.log('2. Go to Railway Dashboard → Your Postgres Database');
  console.log('3. Click "Query" tab');
  console.log('4. Paste and execute the SQL statements');
  console.log('5. Verify dengan SELECT query terakhir');
  console.log('6. Test login di https://mirov.vercel.app/auth');
  console.log('═'.repeat(80));
}

// Run the script
generateHashes().catch(console.error);
