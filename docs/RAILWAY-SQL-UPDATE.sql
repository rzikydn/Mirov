-- ================================================================
-- RAILWAY PRODUCTION DATABASE - USER UPDATE SQL
-- ================================================================
-- Generated: 2025-01-06
-- Purpose: Update user credentials untuk production database
--
-- CARA PAKAI:
-- 1. Login ke Railway Dashboard (https://railway.app)
-- 2. Pilih project "Mirov"
-- 3. Klik database "Postgres"
-- 4. Klik tab "Query"
-- 5. Copy-paste SEMUA SQL di bawah ini
-- 6. Klik "Execute" atau tekan Ctrl+Enter
-- 7. Verify dengan SELECT query di bagian bawah
-- ================================================================

-- Update SUPERUSER accounts

UPDATE users SET
  email = 'usertaufan',
  name = 'Taufan',
  role = 'SUPERUSER',
  password = '$2b$10$0Z3FFQs/pXoDyYJOW06uv.4tDLVbKMtvUXLDGoqgtdRUaDOMGSd16',
  "updatedAt" = NOW()
WHERE email = 'superusermirov' OR id = (SELECT MIN(id) FROM users WHERE role = 'SUPERUSER');

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES ('userhans', '$2b$10$cFQF5.2cwz9ZL5Ayd4sE5e6xBJ5V3cffQBWlI5ID72LeNvISrve3S', 'Hans', 'SUPERUSER', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES ('userjelly', '$2b$10$1yuDAm61Tt1eqrs38yC4F.SZNVJmE726O3m7iMyiCWxrk6C9HkP8i', 'Jelly', 'SUPERUSER', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();


-- Update ADMIN accounts

UPDATE users SET
  email = 'adminagung',
  name = 'Agung',
  role = 'ADMIN',
  password = '$2b$10$UlizazdSnzmneVQQrSVk.e9PbZUbaf5Prmc7p1zW93kTQyZkZctSe',
  "updatedAt" = NOW()
WHERE email = 'adminmirov' OR id = (SELECT MIN(id) FROM users WHERE role = 'ADMIN');

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES ('adminamin', '$2b$10$ccF4b5HLDsi1t0HAmPA13uju0ehz7fOpMd9GDdTQt.AwKlxMG6leK', 'Amin', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES ('adminsyaiful', '$2b$10$342BOzaNghfsryrbtQHYuexzWheHaz7ImKcjA/6oFg0pFkEuMMGdy', 'Syaiful', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES ('admindea', '$2b$10$IFyLLUxpgHwZHOwYB0vUw.BajPw7dRzu0ETehWHuy.TiG.pjOc7vO', 'Dea', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();


-- Update UMUM account

UPDATE users SET
  email = 'umumalfi',
  name = 'Alfi',
  role = 'UMUM',
  password = '$2b$10$8BF0r9daObgOG4fyOslpOumCY51o2O3yMjuoLXFIoxyItLqaumgSW',
  "updatedAt" = NOW()
WHERE email = 'usermirov' OR id = (SELECT MIN(id) FROM users WHERE role = 'UMUM');

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
VALUES ('umumalfi', '$2b$10$8BF0r9daObgOG4fyOslpOumCY51o2O3yMjuoLXFIoxyItLqaumgSW', 'Alfi', 'UMUM', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  "updatedAt" = NOW();


-- ================================================================
-- VERIFICATION QUERY - Jalankan setelah update di atas
-- ================================================================

SELECT id, email, name, role, "createdAt", "updatedAt"
FROM users
ORDER BY role, name;

-- ================================================================
-- EXPECTED RESULTS:
-- ================================================================
-- Seharusnya menampilkan 8 users:
--
-- | id | email          | name    | role       |
-- |----|----------------|---------|------------|
-- | 1  | adminagung     | Agung   | ADMIN      |
-- | 2  | adminamin      | Amin    | ADMIN      |
-- | 3  | admindea       | Dea     | ADMIN      |
-- | 4  | adminsyaiful   | Syaiful | ADMIN      |
-- | 5  | userhans       | Hans    | SUPERUSER  |
-- | 6  | userjelly      | Jelly   | SUPERUSER  |
-- | 7  | usertaufan     | Taufan  | SUPERUSER  |
-- | 8  | umumalfi       | Alfi    | UMUM       |
-- ================================================================

-- ================================================================
-- CREDENTIALS UNTUK TESTING LOGIN
-- ================================================================
--
-- SUPERUSER (3 users):
-- • usertaufan  / taufan123
-- • userhans    / hans123
-- • userjelly   / jelly123
--
-- ADMIN (4 users):
-- • adminagung    / agung123
-- • adminamin     / amin123
-- • adminsyaiful  / syaiful123
-- • admindea      / dea123
--
-- UMUM (1 user):
-- • umumalfi / alfi123
--
-- ================================================================
-- NEXT STEPS SETELAH EXECUTE:
-- ================================================================
-- 1. Check hasil SELECT query - pastikan 8 users ada
-- 2. Buka https://mirov.vercel.app/auth
-- 3. Test login dengan: usertaufan / taufan123
-- 4. Pastikan redirect ke dashboard
-- 5. Test fitur-fitur (schedules, notes, history)
-- ================================================================
