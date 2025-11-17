# 🔄 Migration Guide: PostgreSQL → MySQL

Panduan untuk migrate dari PostgreSQL (Railway) ke MySQL (cPanel).

## ⚠️ PENTING: Baca Sebelum Memulai!

Proses migration ini akan:
1. Menghapus migration history lama (PostgreSQL)
2. Membuat migration baru untuk MySQL
3. Reset database schema

**BACKUP DATA ANDA DULU!**

---

## 📋 Langkah-langkah Migration

### Step 1: Backup Data dari PostgreSQL

```bash
cd server

# Export semua data
node -e "
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backup() {
  try {
    const data = {
      users: await prisma.user.findMany(),
      notes: await prisma.note.findMany(),
      schedules: await prisma.schedule.findMany(),
      databases: await prisma.database.findMany(),
      history: await prisma.history.findMany(),
    };

    fs.writeFileSync('backup-postgresql.json', JSON.stringify(data, null, 2));
    console.log('✅ Backup berhasil: backup-postgresql.json');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
}

backup();
"
```

### Step 2: Setup MySQL Database

Di cPanel atau MySQL client:

```sql
CREATE DATABASE mirov_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Update Environment Variables

Edit file `.env`:

```env
# Hapus PostgreSQL connection string lama
# DATABASE_URL="postgresql://..."

# Tambahkan MySQL connection string
DATABASE_URL="mysql://username:password@localhost:3306/mirov_db"
```

### Step 4: Hapus Migration Lama

```bash
# Di folder server
rm -rf prisma/migrations
```

### Step 5: Generate Prisma Client untuk MySQL

```bash
npx prisma generate
```

### Step 6: Create Initial Migration

```bash
npx prisma migrate dev --name init
```

Ini akan:
- Membuat folder `prisma/migrations/`
- Generate migration SQL untuk MySQL
- Apply migration ke database

### Step 7: Verify Database Structure

```bash
npx prisma db pull
```

Atau check di MySQL:

```sql
SHOW TABLES;

DESC users;
DESC notes;
DESC schedules;
DESC databases;
DESC history;
```

### Step 8: Seed Database

```bash
npx prisma db seed
```

Ini akan membuat 8 default users.

### Step 9: Restore Data (Optional)

Jika Anda ingin restore data lama dari backup:

```bash
node restore-data.js
```

Script `restore-data.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restore() {
  try {
    const backup = JSON.parse(fs.readFileSync('backup-postgresql.json', 'utf-8'));

    // Restore users (skip jika sudah ada dari seed)
    console.log('Restoring users...');
    for (const user of backup.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          email: user.email,
          password: user.password,
          name: user.name,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });
    }

    // Restore notes
    console.log('Restoring notes...');
    for (const note of backup.notes) {
      await prisma.note.create({
        data: {
          title: note.title,
          content: note.content,
          color: note.color,
          favorite: note.favorite,
          userId: note.userId,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        },
      });
    }

    // Restore schedules
    console.log('Restoring schedules...');
    for (const schedule of backup.schedules) {
      await prisma.schedule.create({
        data: {
          title: schedule.title,
          description: schedule.description,
          startDate: new Date(schedule.startDate),
          endDate: new Date(schedule.endDate),
          location: schedule.location,
          status: schedule.status,
          createdBy: schedule.createdBy,
          createdAt: new Date(schedule.createdAt),
          updatedAt: new Date(schedule.updatedAt),
        },
      });
    }

    // Restore databases
    console.log('Restoring databases...');
    for (const db of backup.databases) {
      await prisma.database.create({
        data: {
          name: db.name,
          description: db.description,
          icon: db.icon,
          columns: db.columns,
          rows: db.rows,
          createdBy: db.createdBy,
          createdAt: new Date(db.createdAt),
          updatedAt: new Date(db.updatedAt),
        },
      });
    }

    // Restore history
    console.log('Restoring history...');
    for (const hist of backup.history) {
      await prisma.history.create({
        data: {
          userId: hist.userId,
          userName: hist.userName,
          userRole: hist.userRole,
          action: hist.action,
          target: hist.target,
          targetName: hist.targetName,
          description: hist.description,
          createdAt: new Date(hist.createdAt),
        },
      });
    }

    console.log('✅ Restore completed successfully!');
  } catch (error) {
    console.error('❌ Error during restore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
```

---

## ✅ Verification Checklist

Setelah migration, verify:

- [ ] Database `mirov_db` exists di MySQL
- [ ] Semua tables created (users, notes, schedules, databases, history)
- [ ] Default users exists (8 users)
- [ ] Prisma Client generated (`node_modules/.prisma/client`)
- [ ] Application can connect to database
- [ ] Login works dengan default credentials
- [ ] No errors di logs

---

## 🔍 Testing Migration

### Test 1: Check Database Connection

```bash
npx prisma db pull
```

Expected: No errors, schema synced.

### Test 2: Test Queries

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findMany().then(users => {
  console.log(\`Found \${users.length} users\`);
  console.log(users.map(u => u.name));
}).finally(() => prisma.\$disconnect());
"
```

Expected: List of user names.

### Test 3: Start Application

```bash
npm run dev
```

Expected: Server starts without errors.

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Solution**:
- Check DATABASE_URL di `.env`
- Verify MySQL service running
- Test connection: `mysql -u username -p`

### Error: "Unknown column type"

**Solution**:
- Run `npx prisma generate` lagi
- Delete `node_modules/.prisma` folder
- Run `npm install`

### Error: "Migration failed"

**Solution**:
- Drop database: `DROP DATABASE mirov_db;`
- Create database lagi: `CREATE DATABASE mirov_db;`
- Run migration lagi: `npx prisma migrate dev --name init`

### Error: "Enum not found"

**Solution**:

MySQL enums didefinisikan di schema. Verify `schema.prisma`:

```prisma
enum Role {
  SUPERUSER
  ADMIN
  UMUM
}

enum HistoryAction {
  CREATE
  EDIT
  DELETE
}

enum HistoryTarget {
  NOTE
  DATABASE
  SCHEDULE
}
```

---

## 📝 Notes

### Perbedaan PostgreSQL vs MySQL

1. **Auto Increment**:
   - PostgreSQL: `SERIAL`
   - MySQL: `AUTO_INCREMENT`
   - Prisma handles this automatically

2. **JSON Type**:
   - Both support JSON
   - MySQL: `JSON` column type
   - Same Prisma syntax

3. **Enum**:
   - PostgreSQL: Native ENUM type
   - MySQL: ENUM created inline
   - Prisma manages both

4. **String Length**:
   - Added `@db.VarChar(255)` for MySQL optimization
   - `@db.Text` for long text fields

### Migration Files

Migration files akan dibuat di:
```
server/prisma/migrations/
└── YYYYMMDDHHMMSS_init/
    └── migration.sql
```

Format SQL:
```sql
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPERUSER', 'ADMIN', 'UMUM') NOT NULL DEFAULT 'UMUM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ...more tables
```

---

## 🎯 Quick Reference Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (DANGER!)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed

# Pull schema from database
npx prisma db pull

# Push schema to database (without migration)
npx prisma db push
```

---

**Migration completed? Test thoroughly before deploying to production!**

Last Updated: January 15, 2025
