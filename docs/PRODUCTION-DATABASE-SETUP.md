# Production Database Setup - Railway

## Issue yang Dialami

Saat mencoba login di https://mirov.vercel.app/auth dengan credentials:
- Username: `usertaufan`
- Password: `taufan123`

Mendapat error: **"Invalid email or password"**

**Root Cause:** Database di Railway masih menggunakan user lama (`superusermirov`, `adminmirov`, `usermirov`) dan belum di-update dengan credentials baru.

---

## Solusi: Update User Credentials di Production

### Metode 1: Manual SQL Update (Recommended)

#### Step 1: Generate Password Hashes

Jalankan script untuk generate password hash yang benar:

```bash
cd server
node scripts/generate-password-hash.js
```

Script ini akan menghasilkan SQL statements yang siap digunakan.

#### Step 2: Execute SQL di Railway

1. **Login ke Railway Dashboard**
   - Buka https://railway.app/
   - Login dengan akun Anda
   - Pilih project "Mirov"

2. **Buka Postgres Database**
   - Klik service "Postgres" di dashboard
   - Klik tab "Query"

3. **Copy SQL dari Output Script**

   Script sudah generate SQL statements lengkap. Copy mulai dari:
   ```sql
   -- Update SUPERUSER accounts
   UPDATE users SET ...
   ```

4. **Paste dan Execute**
   - Paste SQL statements ke Query editor
   - Klik "Execute" atau tekan Ctrl+Enter

5. **Verify Results**

   Jalankan verification query:
   ```sql
   SELECT id, email, name, role, "createdAt", "updatedAt"
   FROM users
   ORDER BY role, name;
   ```

   **Expected output:**
   ```
   | id | email          | name    | role       |
   |----|----------------|---------|------------|
   | 1  | usertaufan     | Taufan  | SUPERUSER  |
   | 2  | userhans       | Hans    | SUPERUSER  |
   | 3  | userjelly      | Jelly   | SUPERUSER  |
   | 4  | adminagung     | Agung   | ADMIN      |
   | 5  | adminamin      | Amin    | ADMIN      |
   | 6  | adminsyaiful   | Syaiful | ADMIN      |
   | 7  | admindea       | Dea     | ADMIN      |
   | 8  | umumalfi       | Alfi    | UMUM       |
   ```

#### Step 3: Test Login

1. Buka https://mirov.vercel.app/auth
2. Test login dengan credentials:

**SUPERUSER:**
- `usertaufan` / `taufan123`
- `userhans` / `hans123`
- `userjelly` / `jelly123`

**ADMIN:**
- `adminagung` / `agung123`
- `adminamin` / `amin123`
- `adminsyaiful` / `syaiful123`
- `admindea` / `dea123`

**UMUM:**
- `umumalfi` / `alfi123`

---

### Metode 2: Re-seed Database (Nuclear Option)

⚠️ **WARNING:** Ini akan menghapus SEMUA data (schedules, notes, history)!

Hanya gunakan jika:
- Database masih kosong
- Anda OK dengan data loss
- Sedang initial setup

#### Steps:

1. **Connect ke Railway Database via CLI**
   ```bash
   # Install Railway CLI jika belum
   npm install -g @railway/cli

   # Login
   railway login

   # Link ke project
   railway link

   # Connect ke database
   railway run bash
   ```

2. **Run Seed**
   ```bash
   cd server
   npm run prisma:push
   npm run prisma:seed
   ```

3. **Verify**
   ```bash
   psql $DATABASE_URL -c "SELECT email, name, role FROM users;"
   ```

---

### Metode 3: Manual Insert via Railway UI

Jika Metode 1 tidak berhasil, insert manual satu per satu:

1. **Delete Old Users** (Optional)
   ```sql
   DELETE FROM users WHERE email IN ('superusermirov', 'adminmirov', 'usermirov');
   ```

2. **Insert SUPERUSER**
   ```sql
   INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
   VALUES
   ('usertaufan', '$2b$10$b7KMQQqk0mhcDi/TMpDh0eueaio9.m8yP5ZsmQmv8cWzjzFPW56nG', 'Taufan', 'SUPERUSER', NOW(), NOW()),
   ('userhans', '$2b$10$zIUKS15qrSEvEWhOnr0tle4g07svf2yqUzyxDf4OXRBBAXquJGwl6', 'Hans', 'SUPERUSER', NOW(), NOW()),
   ('userjelly', '$2b$10$50E99L5OeYDWsoREO7StoOIG5kTBLhIxHfIIfqXo80LG25D4ZqXl2', 'Jelly', 'SUPERUSER', NOW(), NOW());
   ```

3. **Insert ADMIN**
   ```sql
   INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
   VALUES
   ('adminagung', '$2b$10$MqxY.rUkKFeeMzDBjttgVObnxTp4HZzejzK8HgFOy40MPUPu.Ab9y', 'Agung', 'ADMIN', NOW(), NOW()),
   ('adminamin', '$2b$10$0nlpbYeqe7E2h8h59Ch15eYj3ZImLL4qac2W5cVpZoE60E4rsvkpa', 'Amin', 'ADMIN', NOW(), NOW()),
   ('adminsyaiful', '$2b$10$kklFS2jyOs53K4WvVVB//u7CdwM6C6CKRUfoer2D9XMneb6B0frlG', 'Syaiful', 'ADMIN', NOW(), NOW()),
   ('admindea', '$2b$10$TjaWfw6vszK7Bey78xNwAuAiwVi.lfBfzYJJLLdh2/qmOj2j0zNxu', 'Dea', 'ADMIN', NOW(), NOW());
   ```

4. **Insert UMUM**
   ```sql
   INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
   VALUES
   ('umumalfi', '$2b$10$.n49FnNS3xdnC1ZQhlpOZOtt6K32Pghkvv/jZNvj2QSQGEDmAK1/O', 'Alfi', 'UMUM', NOW(), NOW());
   ```

---

## Troubleshooting

### Issue: SQL Syntax Error

**Error:**
```
syntax error at or near "..."
```

**Solution:**
- Pastikan tidak ada trailing comma
- Pastikan quotes benar (`'` bukan `'`)
- Copy SQL statement persis dari output script

### Issue: "email already exists"

**Error:**
```
duplicate key value violates unique constraint "users_email_key"
```

**Solution:**
1. Check existing emails:
   ```sql
   SELECT email FROM users;
   ```

2. Update instead of insert:
   ```sql
   UPDATE users
   SET password = '$2b$10$...', name = 'Taufan', role = 'SUPERUSER'
   WHERE email = 'usertaufan';
   ```

### Issue: Still "Invalid email or password"

**Possible causes:**
1. **Email typo** - Check dengan:
   ```sql
   SELECT email FROM users WHERE email LIKE '%taufan%';
   ```

2. **Password hash salah** - Re-generate dengan:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('taufan123', 10));"
   ```

3. **Case sensitivity** - Email harus lowercase

4. **Backend tidak terhubung ke database** - Check Railway logs:
   ```bash
   railway logs
   ```

### Issue: Cannot connect to Railway

**Solution:**
1. Check DATABASE_URL di Railway environment variables
2. Restart Railway service
3. Check database status (should be "Active")

---

## Verification Checklist

Setelah update, verify semua ini:

- [ ] 8 users ada di database
- [ ] 3 SUPERUSER: usertaufan, userhans, userjelly
- [ ] 4 ADMIN: adminagung, adminamin, adminsyaiful, admindea
- [ ] 1 UMUM: umumalfi
- [ ] Login berhasil dengan usertaufan/taufan123
- [ ] Dashboard muncul setelah login
- [ ] Role permissions bekerja dengan benar

---

## Password Hash Reference

Jika perlu generate password hash baru:

```javascript
// In Node.js console or script
const bcrypt = require('bcryptjs');

// Generate single hash
const hash = bcrypt.hashSync('your-password', 10);
console.log(hash);

// Verify hash
const isValid = bcrypt.compareSync('your-password', hash);
console.log(isValid); // true
```

**Important:**
- Salt rounds: 10 (standard)
- Hash length: 60 characters
- Format: `$2b$10$...`

---

## Best Practices for Production

### 1. Backup Before Changes

```sql
-- Create backup table
CREATE TABLE users_backup AS SELECT * FROM users;

-- Verify backup
SELECT COUNT(*) FROM users_backup;

-- Restore if needed
DELETE FROM users;
INSERT INTO users SELECT * FROM users_backup;
```

### 2. Test in Development First

Before executing in production:
```bash
# Test locally first
npm run prisma:push:dev
npm run prisma:seed:dev
```

### 3. Use Transactions

```sql
BEGIN;

-- Your UPDATE/INSERT statements here

-- Check results
SELECT * FROM users;

-- If OK:
COMMIT;

-- If not OK:
ROLLBACK;
```

### 4. Monitor Logs

After update, check Railway logs:
```bash
railway logs --follow
```

Look for:
- ✅ Database connection success
- ✅ JWT authentication working
- ❌ Any error messages

---

## Contact & Support

If you still have issues after following this guide:

1. Check Railway logs for errors
2. Verify DATABASE_URL is correct
3. Test backend health: `https://your-backend.railway.app/api/health`
4. Contact team for assistance

---

**Last Updated:** 2025-01-04
**Author:** Team Mirov
**Status:** Verified Working
