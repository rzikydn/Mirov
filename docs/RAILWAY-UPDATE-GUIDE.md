# Railway Database Update Guide - SIMPLE METHOD

## 🎯 PILIHAN TERBAIK: Railway CLI

Karena Railway tidak ada tab "Query" di UI, gunakan **Railway CLI** untuk execute SQL.

---

## ✅ METODE TERMUDAH: Automatic Script

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login & Link Project
```bash
# Login ke Railway
railway login

# Link ke project Mirov
railway link
```
Pilih project "Mirov" dari list yang muncul.

### Step 3: Update Users (Automatic)
```bash
# Navigate ke server folder
cd server

# Run update script
railway run npm run update-users
```

**Script ini akan:**
- ✅ Hash semua passwords dengan bcrypt
- ✅ Update/create 8 users otomatis
- ✅ Verify dan tampilkan hasil
- ✅ Tidak menghapus data lain (schedules, notes, history)

### Step 4: Verify
Output akan menampilkan tabel users. Pastikan ada 8 users:
```
┌─────┬────────────────┬──────────┬────────────┐
│ id  │ email          │ name     │ role       │
├─────┼────────────────┼──────────┼────────────┤
│ ... │ usertaufan     │ Taufan   │ SUPERUSER  │
│ ... │ userhans       │ Hans     │ SUPERUSER  │
│ ... │ userjelly      │ Jelly    │ SUPERUSER  │
│ ... │ adminagung     │ Agung    │ ADMIN      │
│ ... │ adminamin      │ Amin     │ ADMIN      │
│ ... │ adminsyaiful   │ Syaiful  │ ADMIN      │
│ ... │ admindea       │ Dea      │ ADMIN      │
│ ... │ umumalfi       │ Alfi     │ UMUM       │
└─────┴────────────────┴──────────┴────────────┘
```

### Step 5: Test Login
1. Buka: https://mirov.vercel.app/auth
2. Login: `usertaufan` / `taufan123`
3. ✅ Berhasil masuk dashboard!

---

## 📋 METODE ALTERNATIF: Manual SQL via psql

Jika prefer manual SQL execution:

### Step 1: Connect via Railway CLI
```bash
railway link
railway run psql
```

### Step 2: Check Current Users
```sql
SELECT email, role FROM users;
```

### Step 3: Update Users Manually

**Update SUPERUSER:**
```sql
-- Update first SUPERUSER
UPDATE users SET
  email = 'usertaufan',
  password = '$2b$10$b7KMQQqk0mhcDi/TMpDh0eueaio9.m8yP5ZsmQmv8cWzjzFPW56nG',
  name = 'Taufan',
  role = 'SUPERUSER'
WHERE email = 'superusermirov';

-- Add other SUPERUSER
INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES
('userhans', '$2b$10$zIUKS15qrSEvEWhOnr0tle4g07svf2yqUzyxDf4OXRBBAXquJGwl6', 'Hans', 'SUPERUSER', NOW(), NOW()),
('userjelly', '$2b$10$50E99L5OeYDWsoREO7StoOIG5kTBLhIxHfIIfqXo80LG25D4ZqXl2', 'Jelly', 'SUPERUSER', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
```

**Update ADMIN:**
```sql
-- Update first ADMIN
UPDATE users SET
  email = 'adminagung',
  password = '$2b$10$MqxY.rUkKFeeMzDBjttgVObnxTp4HZzejzK8HgFOy40MPUPu.Ab9y',
  name = 'Agung',
  role = 'ADMIN'
WHERE email = 'adminmirov';

-- Add other ADMIN
INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES
('adminamin', '$2b$10$0nlpbYeqe7E2h8h59Ch15eYj3ZImLL4qac2W5cVpZoE60E4rsvkpa', 'Amin', 'ADMIN', NOW(), NOW()),
('adminsyaiful', '$2b$10$kklFS2jyOs53K4WvVVB//u7CdwM6C6CKRUfoer2D9XMneb6B0frlG', 'Syaiful', 'ADMIN', NOW(), NOW()),
('admindea', '$2b$10$TjaWfw6vszK7Bey78xNwAuAiwVi.lfBfzYJJLLdh2/qmOj2j0zNxu', 'Dea', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
```

**Update UMUM:**
```sql
-- Update UMUM user
UPDATE users SET
  email = 'umumalfi',
  password = '$2b$10$.n49FnNS3xdnC1ZQhlpOZOtt6K32Pghkvv/jZNvj2QSQGEDmAK1/O',
  name = 'Alfi',
  role = 'UMUM'
WHERE email = 'usermirov';

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES ('umumalfi', '$2b$10$.n49FnNS3xdnC1ZQhlpOZOtt6K32Pghkvv/jZNvj2QSQGEDmAK1/O', 'Alfi', 'UMUM', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
```

### Step 4: Verify
```sql
SELECT id, email, name, role FROM users ORDER BY role, name;
```

### Step 5: Exit psql
```
\q
```

---

## 🖥️ METODE 3: GUI Database Client (TablePlus)

Jika prefer GUI tool:

### Step 1: Get DATABASE_URL
```bash
railway variables
```
Copy value dari `DATABASE_URL`

### Step 2: Install TablePlus
Download dari: https://tableplus.com/

### Step 3: Create Connection
1. Buka TablePlus
2. Create new connection (Ctrl/Cmd + N)
3. Select "PostgreSQL"
4. Paste DATABASE_URL atau fill manually:
   - Name: Mirov Production
   - Host: (from DATABASE_URL)
   - Port: (from DATABASE_URL)
   - User: (from DATABASE_URL)
   - Password: (from DATABASE_URL)
   - Database: (from DATABASE_URL)

### Step 4: Execute SQL
1. Click "SQL" button (Ctrl/Cmd + E)
2. Open file: `docs/RAILWAY-SQL-UPDATE.sql`
3. Copy all content
4. Paste to SQL editor
5. Execute (F5 or Run button)

### Step 5: Verify Results
Check "users" table, should have 8 rows.

---

## 🔧 Troubleshooting

### Error: "railway: command not found"
```bash
npm install -g @railway/cli
```

### Error: "Not linked to a project"
```bash
railway link
```
Pilih project dari list.

### Error: "psql: command not found"
Install PostgreSQL client:
- **Windows:** Download from postgresql.org
- **Mac:** `brew install postgresql`
- **Linux:** `sudo apt-get install postgresql-client`

### Error: "Connection refused"
Check Railway service status:
```bash
railway status
```

### Still can't login after update?
1. Check if update actually ran:
   ```bash
   railway run psql -c "SELECT email FROM users;"
   ```

2. Regenerate password hash:
   ```bash
   cd server
   node scripts/generate-password-hash.js
   ```

3. Check backend logs:
   ```bash
   railway logs
   ```

---

## ✅ CHECKLIST

Setelah update, verify:

- [ ] Railway CLI installed
- [ ] Project linked with `railway link`
- [ ] Script executed: `railway run npm run update-users`
- [ ] 8 users muncul di output
- [ ] Login berhasil dengan `usertaufan` / `taufan123`
- [ ] Dashboard muncul setelah login
- [ ] Test create note / schedule
- [ ] Test history feature

---

## 📞 Need Help?

Jika masih ada masalah:

1. **Check Railway logs:**
   ```bash
   railway logs --follow
   ```

2. **Verify DATABASE_URL:**
   ```bash
   railway variables | grep DATABASE_URL
   ```

3. **Test connection:**
   ```bash
   railway run psql -c "SELECT version();"
   ```

4. **Contact support** dengan info:
   - Error message lengkap
   - Output dari `railway logs`
   - Screenshot (if applicable)

---

**Last Updated:** 2025-01-04
**Recommended Method:** Railway CLI with automatic script
**Estimated Time:** 5 minutes
