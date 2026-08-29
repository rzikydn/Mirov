# 📦 Database Setup Guide - MySQL

Panduan lengkap untuk setup database MySQL menggunakan file SQL schema.

---

## 🎯 Cara 1: Import via phpMyAdmin (Recommended untuk cPanel)

### Langkah-langkah:

1. **Login ke cPanel** dan buka **phpMyAdmin**

2. **Buat Database Baru**:
   - Klik tab "Databases" di cPanel (bukan di phpMyAdmin)
   - Buat database baru dengan nama: `mirov_db`
   - Atau gunakan SQL di phpMyAdmin:
     ```sql
     CREATE DATABASE mirov_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```

3. **Import Schema**:
   - Di phpMyAdmin, pilih database `mirov_db`
   - Klik tab **"Import"**
   - Klik **"Choose File"** dan pilih file: `database-schema.sql`
   - Scroll ke bawah dan klik **"Go"**
   - Tunggu hingga muncul pesan: **"Import has been successfully finished"**

4. **Verifikasi**:
   ```sql
   -- Cek jumlah tables
   SHOW TABLES;

   -- Cek jumlah users (harus ada 8 users)
   SELECT COUNT(*) as total_users FROM users;

   -- Cek semua users
   SELECT id, email, name, role FROM users;
   ```

---

## 🎯 Cara 2: Import via Command Line MySQL

### Langkah-langkah:

1. **Buat Database**:
   ```bash
   mysql -u root -p -e "CREATE DATABASE mirov_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

2. **Import Schema**:
   ```bash
   mysql -u root -p mirov_db < database-schema.sql
   ```

3. **Verifikasi**:
   ```bash
   mysql -u root -p mirov_db -e "SHOW TABLES;"
   mysql -u root -p mirov_db -e "SELECT COUNT(*) as total_users FROM users;"
   ```

---

## 🎯 Cara 3: Import via XAMPP MySQL

### Langkah-langkah:

1. **Start XAMPP**:
   - Buka XAMPP Control Panel
   - Start **MySQL**

2. **Buka phpMyAdmin**:
   - Klik **"Admin"** pada MySQL di XAMPP
   - Atau buka browser: `http://localhost/phpmyadmin`

3. **Ikuti langkah yang sama seperti Cara 1**

---

## 📊 Isi Database Setelah Import

### Tables yang Dibuat (5 tables):
1. ✅ **users** - User accounts dengan role (SUPERUSER, ADMIN, UMUM)
2. ✅ **schedules** - Jadwal/schedule management
3. ✅ **notes** - Catatan/notes pribadi
4. ✅ **databases** - Custom database tables
5. ✅ **history** - Activity history log

### Default Users (8 users):

| Username | Password | Name | Role |
|----------|----------|------|------|
| usertaufan | taufan123 | Taufan | SUPERUSER |
| userhans | hans123 | Hans | SUPERUSER |
| userjelly | jelly123 | Jelly | SUPERUSER |
| adminagung | agung123 | Agung | ADMIN |
| adminamin | amin123 | Amin | ADMIN |
| adminsyaiful | syaiful123 | Syaiful | ADMIN |
| admindea | dea123 | Dea | ADMIN |
| umumalfi | alfi123 | Alfi | UMUM |

### Sample Data:
- ✅ 3 sample schedules
- ✅ 3 sample notes

---

## 🔧 Konfigurasi Connection String

### Format Connection String MySQL:

```env
DATABASE_URL="mysql://username:password@host:port/database_name"
```

### Contoh untuk berbagai environment:

**Local (XAMPP):**
```env
DATABASE_URL="mysql://root:@localhost:3306/mirov_db"
```

**cPanel (Production):**
```env
DATABASE_URL="mysql://cpanel_username:your_password@localhost:3306/cpanel_dbname"
```

**Remote Server:**
```env
DATABASE_URL="mysql://username:password@your-server.com:3306/mirov_db"
```

---

## ✅ Verifikasi Database

Jalankan query berikut untuk memastikan database sudah setup dengan benar:

```sql
-- 1. Cek semua tables
SHOW TABLES;
-- Expected: 5 tables (users, schedules, notes, databases, history)

-- 2. Cek struktur table users
DESCRIBE users;

-- 3. Cek jumlah users
SELECT COUNT(*) as total_users FROM users;
-- Expected: 8 users

-- 4. Cek semua users dengan role
SELECT id, email, name, role FROM users ORDER BY role, id;

-- 5. Cek sample schedules
SELECT COUNT(*) as total_schedules FROM schedules;
-- Expected: 3 schedules

-- 6. Cek sample notes
SELECT COUNT(*) as total_notes FROM notes;
-- Expected: 3 notes

-- 7. Test login credentials (cek password hash exists)
SELECT email, name, role,
       SUBSTRING(password, 1, 10) as password_hash_preview
FROM users;
```

---

## 🔐 Security Notes

### Password Hashes:
- Semua password di-hash menggunakan **bcrypt** dengan cost factor 10
- Password hash format: `$2b$10$...` (60 characters)
- Password tidak disimpan dalam plain text

### Database Security:
- Gunakan strong password untuk MySQL user
- Jangan gunakan `root` user untuk production
- Buat MySQL user khusus dengan privileges terbatas:

```sql
-- Create dedicated user for production
CREATE USER 'mirov_user'@'localhost' IDENTIFIED BY 'strong_password_here';

-- Grant privileges only to mirov_db
GRANT SELECT, INSERT, UPDATE, DELETE ON mirov_db.* TO 'mirov_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

---

## 🐛 Troubleshooting

### Error: "Table already exists"
**Solusi**:
```sql
-- Drop semua tables lama (HATI-HATI: Data akan hilang!)
DROP TABLE IF EXISTS history;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS databases;
DROP TABLE IF EXISTS users;

-- Kemudian import ulang database-schema.sql
```

### Error: "Access denied for user"
**Solusi**:
- Pastikan username dan password MySQL benar
- Pastikan user memiliki privileges untuk database tersebut
- Cek dengan: `SHOW GRANTS FOR 'username'@'localhost';`

### Error: "Unknown database 'mirov_db'"
**Solusi**:
```sql
-- Buat database dulu
CREATE DATABASE mirov_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Error: "Cannot add foreign key constraint"
**Solusi**:
- Drop tables dalam urutan yang benar (file SQL sudah handle ini)
- Pastikan engine database adalah InnoDB (default di MySQL 5.5+)

---

## 📝 Next Steps

Setelah database berhasil di-import:

1. ✅ Update file `.env` dengan connection string yang benar
2. ✅ Test koneksi dengan aplikasi
3. ✅ Login dengan salah satu user default
4. ✅ Ubah password default untuk production
5. ✅ Backup database secara berkala

---

## 🆘 Need Help?

Jika mengalami masalah:
1. Cek logs MySQL error
2. Pastikan MySQL service running
3. Verifikasi connection string di `.env`
4. Test koneksi manual dengan MySQL client

---

**File ini dibuat untuk**: Mirov Application
**Database**: MySQL 5.7+ / MariaDB 10.2+
**Last Updated**: December 1, 2025
