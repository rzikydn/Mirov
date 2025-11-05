-- ================================================
-- UPDATE PRODUCTION USERS - RAILWAY DATABASE
-- ================================================
-- Script ini akan update user credentials di production
-- tanpa menghapus data schedules, notes, atau history
--
-- CARA PAKAI:
-- 1. Login ke Railway dashboard
-- 2. Buka Postgres database
-- 3. Klik "Query" tab
-- 4. Copy-paste script ini
-- 5. Execute
-- ================================================

-- Backup existing users (optional - untuk safety)
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- ================================================
-- STEP 1: Update existing users dengan credentials baru
-- ================================================

-- Update SUPERUSER users (change old credentials to new ones)
UPDATE users
SET
  email = 'usertaufan',
  name = 'Taufan',
  role = 'SUPERUSER',
  password = '$2a$10$zQYHxVq9K3qX5jL8YnE7YOiVYr7zK9xQwJYHxVq9K3qX5jL8YnE7Y'
WHERE email = 'superusermirov';

-- Add more SUPERUSER if needed
INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
SELECT 'userhans', '$2a$10$zQYHxVq9K3qX5jL8YnE7YOiVYr7zK9xQwJYHxVq9K3qX5jL8YnE7Y', 'Hans', 'SUPERUSER', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'userhans');

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
SELECT 'userjelly', '$2a$10$zQYHxVq9K3qX5jL8YnE7YOiVYr7zK9xQwJYHxVq9K3qX5jL8YnE7Y', 'Jelly', 'SUPERUSER', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'userjelly');

-- Update ADMIN users
UPDATE users
SET
  email = 'adminagung',
  name = 'Agung',
  role = 'ADMIN',
  password = '$2a$10$zQYHxVq9K3qX5jL8YnE7YOiVYr7zK9xQwJYHxVq9K3qX5jL8YnE7Y'
WHERE email = 'adminmirov';

-- Add more ADMIN users
INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
SELECT 'adminamin', '$2a$10$zQYHxVq9K3qX5jL8YnE7YOiVYr7zK9xQwJYHxVq9K3qX5jL8YnE7Y', 'Amin', 'ADMIN', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'adminamin');

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
SELECT 'adminsyaiful', '$2a$10$zQYHxVq9K3qX5jL8YnE7YOiVYr7zK9xQwJYHxVq9K3qX5jL8YnE7Y', 'Syaiful', 'ADMIN', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'adminsyaiful');

INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
SELECT 'admindea', '$2a$10$zQYHxVq9K3qX5jL8YnE7YOiVYr7zK9xQwJYHxVq9K3qX5jL8YnE7Y', 'Dea', 'ADMIN', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admindea');

-- Update UMUM user
UPDATE users
SET
  email = 'umumalfi',
  name = 'Alfi',
  role = 'UMUM',
  password = '$2a$10$zQYHxVq9K3qX5jL8YnE7YOiVYr7zK9xQwJYHxVq9K3qX5jL8YnE7Y'
WHERE email = 'usermirov';

-- If usermirov doesn't exist, insert new UMUM user
INSERT INTO users (email, password, name, role, "createdAt", "updatedAt")
SELECT 'umumalfi', '$2a$10$zQYHxVq9K3qX5jL8YnE7YOiVYr7zK9xQwJYHxVq9K3qX5jL8YnE7Y', 'Alfi', 'UMUM', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'umumalfi');

-- ================================================
-- STEP 2: Verify hasil update
-- ================================================

SELECT
  id,
  email,
  name,
  role,
  "createdAt",
  "updatedAt"
FROM users
ORDER BY
  CASE role
    WHEN 'SUPERUSER' THEN 1
    WHEN 'ADMIN' THEN 2
    WHEN 'UMUM' THEN 3
  END,
  name;

-- ================================================
-- EXPECTED OUTPUT:
-- ================================================
-- Should see 8 users:
-- 3 SUPERUSER: usertaufan, userhans, userjelly
-- 4 ADMIN: adminagung, adminamin, adminsyaiful, admindea
-- 1 UMUM: umumalfi
-- ================================================

-- ================================================
-- NOTE: Password hash di atas adalah contoh!
-- Untuk generate password hash yang benar:
-- ================================================
-- 1. Buka Railway CLI atau server console
-- 2. Run script generate-password-hash.js
-- 3. Copy hash yang di-generate
-- 4. Replace password hash di script ini
-- ================================================

-- ================================================
-- TROUBLESHOOTING
-- ================================================
-- Jika masih tidak bisa login setelah update:
--
-- 1. Check apakah email sudah benar:
--    SELECT email FROM users WHERE email = 'usertaufan';
--
-- 2. Check apakah role sudah benar:
--    SELECT role FROM users WHERE email = 'usertaufan';
--
-- 3. Generate password hash baru dengan bcrypt:
--    node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('taufan123', 10));"
--
-- 4. Update manual password:
--    UPDATE users SET password = '{NEW_HASH}' WHERE email = 'usertaufan';
-- ================================================
