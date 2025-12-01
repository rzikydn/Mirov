# 🚀 Panduan Deployment Step-by-Step - cPanel

Panduan lengkap deployment aplikasi Mirov ke cPanel dari awal hingga selesai.

---

## 📋 Persiapan Awal

### Requirement:
- ✅ Git installed di laptop
- ✅ Node.js v18+ installed di laptop
- ✅ cPanel access dengan Node.js support
- ✅ MySQL database access di cPanel
- ✅ WinRAR/7-Zip untuk ZIP file (Windows)

---

## 🔄 BAGIAN 1: Persiapan di Laptop (Local)

### Step 1: Clone Repository

```bash
# Clone repository dari GitHub
git clone https://github.com/rzikydn/Mirov.git

# Masuk ke folder project
cd Mirov
```

### Step 2: Setup Backend di Laptop

```bash
# Masuk ke folder server (backend)
cd server

# Install dependencies
npm install

# Tunggu hingga selesai (bisa memakan waktu beberapa menit)
```

### Step 3: Buat File `.env` untuk Backend

Buat file `.env` di folder `server/` dengan isi berikut:

**File: `server/.env`**
```env
# Server Configuration
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

# Database Configuration (sesuaikan dengan cPanel MySQL credentials)
DATABASE_URL="mysql://cpanel_username:cpanel_password@localhost:3306/cpanel_database_name"

# Contoh:
# DATABASE_URL="mysql://mirov_user:SecurePass123@localhost:3306/mirov_db"

# JWT Configuration
JWT_SECRET=8c091c76317c2f643847ce0a38422caeb4b130c5c7c4443b32a6372ffce5a19b
JWT_EXPIRES_IN=7d
```

**⚠️ PENTING**: Ganti nilai berikut:
- `cpanel_username` → username MySQL di cPanel
- `cpanel_password` → password MySQL di cPanel
- `cpanel_database_name` → nama database di cPanel
- `yourdomain.com` → domain website Anda

### Step 4: Generate Prisma Client

```bash
# Generate Prisma Client
npx prisma generate

# Output yang diharapkan:
# ✔ Generated Prisma Client to ./node_modules/@prisma/client
```

### Step 5: Build Backend (TypeScript → JavaScript)

```bash
# Build backend (compile TypeScript)
npm run build

# Ini akan membuat folder "dist/" dengan file JavaScript
```

**Verify**: Pastikan folder `dist/` sudah terbuat dan berisi file `index.js`

### Step 6: ZIP Folder Backend

**Windows:**
```bash
# Kembali ke root project
cd ..

# ZIP menggunakan Command Prompt atau PowerShell
# Jika menggunakan PowerShell:
Compress-Archive -Path server/* -DestinationPath backend-deploy.zip

# Atau menggunakan WinRAR/7-Zip GUI:
# - Klik kanan pada folder "server"
# - Pilih "Add to archive..." atau "Compress to ZIP"
# - Nama file: backend-deploy.zip
```

**Linux/Mac:**
```bash
# Kembali ke root project
cd ..

# ZIP menggunakan terminal
zip -r backend-deploy.zip server/

# Atau dengan tar.gz (alternatif):
tar -czf backend-deploy.tar.gz server/
```

**⚠️ PENTING**: Pastikan file ZIP berisi:
- ✅ Folder `dist/` (hasil build)
- ✅ Folder `node_modules/` (termasuk `.prisma/`)
- ✅ Folder `prisma/` (schema.prisma)
- ✅ File `.env` (dengan credentials production)
- ✅ File `package.json`
- ✅ File `package-lock.json`

### Verify ZIP Content:
```bash
# Windows (PowerShell)
Expand-Archive -Path backend-deploy.zip -DestinationPath temp-check
dir temp-check/server

# Linux/Mac
unzip -l backend-deploy.zip | head -20
```

---

## 🗄️ BAGIAN 2: Setup Database di cPanel

### Step 1: Login ke cPanel

1. Buka browser → Login ke cPanel
2. URL biasanya: `https://yourdomain.com/cpanel` atau `https://yourdomain.com:2083`

### Step 2: Buat Database MySQL

1. Di cPanel, cari dan klik **"MySQL Databases"**

2. **Create New Database**:
   - Database Name: `mirov_db`
   - Klik **"Create Database"**
   - Database akan dibuat dengan prefix: `cpanel_username_mirov_db`

3. **Create Database User**:
   - Username: `mirov_user`
   - Password: **Strong password** (simpan password ini!)
   - Klik **"Create User"**
   - User akan dibuat dengan prefix: `cpanel_username_mirov_user`

4. **Add User to Database**:
   - Pilih user yang baru dibuat
   - Pilih database yang baru dibuat
   - Klik **"Add"**
   - Pilih **"ALL PRIVILEGES"**
   - Klik **"Make Changes"**

### Step 3: Import Database Schema

1. Kembali ke cPanel → Klik **"phpMyAdmin"**

2. Di phpMyAdmin:
   - Pilih database: `cpanel_username_mirov_db` (di sidebar kiri)
   - Klik tab **"Import"**
   - Klik **"Choose File"**
   - Pilih file: `server/database-schema.sql` (dari repository)
   - Scroll ke bawah
   - Klik **"Go"**

3. **Tunggu hingga selesai**. Jika berhasil:
   ```
   ✅ Import has been successfully finished
   ```

### Step 4: Verify Database

Jalankan query berikut di phpMyAdmin (tab "SQL"):

```sql
-- Cek tables
SHOW TABLES;
-- Expected: 5 tables (users, notes, schedules, databases, history)

-- Cek jumlah users
SELECT COUNT(*) as total_users FROM users;
-- Expected: 8 users

-- Cek users
SELECT id, email, name, role FROM users;
```

**Expected Output**:
| id | email | name | role |
|----|-------|------|------|
| 1 | usertaufan | Taufan | SUPERUSER |
| 2 | userhans | Hans | SUPERUSER |
| 3 | userjelly | Jelly | SUPERUSER |
| 4 | adminagung | Agung | ADMIN |
| 5 | adminamin | Amin | ADMIN |
| 6 | adminsyaiful | Syaiful | ADMIN |
| 7 | admindea | Dea | ADMIN |
| 8 | umumalfi | Alfi | UMUM |

---

## 🖥️ BAGIAN 3: Setup Backend Node.js di cPanel

### Step 1: Upload ZIP File

1. Di cPanel, klik **"File Manager"**

2. **Navigasi ke home directory**:
   - Biasanya: `/home/cpanel_username/`
   - Buat folder baru (optional): `mirov-backend`

3. **Upload ZIP**:
   - Klik **"Upload"** (di toolbar)
   - Drag & drop atau pilih file: `backend-deploy.zip`
   - Tunggu hingga upload selesai (bisa memakan waktu tergantung ukuran dan koneksi)

### Step 2: Extract ZIP File

1. Kembali ke **File Manager**
2. Cari file `backend-deploy.zip`
3. **Klik kanan** pada file → Pilih **"Extract"**
4. Pilih destination: `/home/cpanel_username/mirov-backend/`
5. Klik **"Extract Files"**
6. Tunggu hingga selesai

### Step 3: Verify Extracted Files

Pastikan struktur folder seperti ini:
```
/home/cpanel_username/mirov-backend/
├── dist/
│   └── index.js           ← Entry point
├── node_modules/
│   └── .prisma/
│       └── client/        ← Prisma Client
├── prisma/
│   └── schema.prisma
├── .env                   ← Environment variables
├── package.json
└── package-lock.json
```

### Step 4: Setup Node.js Application

1. Kembali ke cPanel → Cari **"Setup Node.js App"**

2. **Create Application**:
   - Klik **"Create Application"**

3. **Konfigurasi**:
   ```
   Node.js version: 18.x (atau versi terbaru yang tersedia)
   Application mode: Production
   Application root: mirov-backend
   Application URL: yourdomain.com (atau subdomain)
   Application startup file: dist/index.js
   ```

4. **Environment Variables** (Optional - jika ingin override .env):
   - Klik **"Add Variable"**
   - Tambahkan (optional, karena sudah ada di .env):
     ```
     NODE_ENV = production
     PORT = 5000
     ```

5. Klik **"Create"**

### Step 5: Install Dependencies di Server

**⚠️ PENTING**: Meskipun sudah upload `node_modules/`, tetap jalankan install ulang untuk memastikan:

1. Di halaman **"Setup Node.js App"**
2. Scroll ke bagian **"Detected configuration files"**
3. Cari bagian **"Run NPM Install"**
4. Klik tombol **"Run NPM Install"**
5. Tunggu hingga selesai (bisa 5-10 menit)

**Output yang diharapkan**:
```
npm install completed successfully
```

### Step 6: Start Application

1. Di halaman yang sama, cari tombol **"Restart"** atau **"Start"**
2. Klik **"Restart"** untuk menjalankan server
3. Status akan berubah menjadi: **"Running"** ✅

### Step 7: Check Application Log

1. Klik **"Open logs"** atau scroll ke bagian **"Log"**
2. Verify log output:
   ```
   🚀 Server is running on port 5000
   📡 Environment: production
   🔗 Client URL: https://yourdomain.com
   ```

### Step 8: Test Backend API

**Via Browser:**
```
https://yourdomain.com:5000/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Server is running",
  "timestamp": "2025-12-01T12:00:00.000Z"
}
```

**Via Terminal (optional):**
```bash
curl https://yourdomain.com:5000/health

# Test Login
curl -X POST https://yourdomain.com:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"userhans","password":"hans123"}'
```

---

## 🎨 BAGIAN 4: Setup Frontend React di cPanel

### Step 1: Build Frontend di Laptop

```bash
# Kembali ke root project
cd /path/to/Mirov

# Buat file .env untuk frontend
# File: .env
VITE_API_URL=https://yourdomain.com:5000
```

**⚠️ Ganti** `yourdomain.com` dengan domain Anda!

```bash
# Install dependencies (jika belum)
npm install

# Build frontend
npm run build

# Ini akan generate folder "dist/" dengan production files
```

### Step 2: Verify Build Output

Check folder `dist/`:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [other files]
```

### Step 3: Upload Frontend ke cPanel

**Via File Manager:**

1. Di cPanel → **File Manager**
2. Navigasi ke: `/home/cpanel_username/public_html/`
3. **Upload semua isi folder `dist/`**:
   - Klik **"Upload"**
   - Select all files dari folder `dist/`
   - Upload

**File structure setelah upload:**
```
/home/cpanel_username/public_html/
├── index.html
├── assets/
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── ...
└── [other files]
```

### Step 4: Upload .htaccess untuk Frontend

1. Upload file `.htaccess` dari repository ke: `/home/cpanel_username/public_html/`
2. Pastikan file `.htaccess` sudah di upload

**Verify**: File `.htaccess` harus ada di:
```
/home/cpanel_username/public_html/.htaccess
```

### Step 5: Set File Permissions

1. Di File Manager, select all files di `public_html/`
2. Klik **"Permissions"** atau **"Change Permissions"**
3. Set:
   - **Files**: `644` (rw-r--r--)
   - **Directories**: `755` (rwxr-xr-x)

---

## ✅ BAGIAN 5: Testing & Verification

### Test 1: Access Frontend

1. Buka browser
2. Go to: `https://yourdomain.com`
3. Anda akan melihat halaman login Mirov

### Test 2: Login

1. Gunakan credentials:
   ```
   Username: userhans
   Password: hans123
   ```
2. Klik **"Login"**
3. Jika berhasil, redirect ke Dashboard

### Test 3: Test Semua Fitur

- ✅ **Notes**: Create, edit, delete notes
- ✅ **Schedules**: Create, edit, delete schedules
- ✅ **Databases**: Create custom database
- ✅ **History**: Check activity history
- ✅ **Profile**: Edit profile

### Test 4: Check Browser Console

1. Press **F12** (Developer Tools)
2. Check **Console** tab
3. Pastikan **tidak ada errors**:
   - ❌ CORS errors
   - ❌ 404 errors
   - ❌ Network errors

### Test 5: Check Backend Logs

1. cPanel → **Setup Node.js App**
2. Klik **"Open logs"**
3. Check for errors

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "Cannot connect to database"

**Solusi**:
1. Check `DATABASE_URL` di file `.env`
2. Verify MySQL credentials di cPanel
3. Test koneksi di phpMyAdmin
4. Pastikan user memiliki ALL PRIVILEGES

**Fix**:
```bash
# Edit .env via File Manager
DATABASE_URL="mysql://correct_username:correct_password@localhost:3306/correct_dbname"

# Restart Node.js app
```

### Issue 2: "502 Bad Gateway" atau "Application not running"

**Solusi**:
1. Check Node.js app status di cPanel
2. Check application logs untuk errors
3. Restart application

**Fix**:
```bash
# Di cPanel Setup Node.js App
# Klik "Stop" → tunggu → Klik "Start"
```

### Issue 3: "CORS Error" di browser

**Solusi**:
1. Check `CLIENT_URL` di `server/.env`
2. Update `allowedOrigins` jika perlu
3. Restart Node.js app

**Fix di `server/src/index.ts`** (jika perlu):
```typescript
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://yourdomain.com',  // ← Tambahkan domain production
];
```

### Issue 4: "404 Not Found" saat refresh page

**Solusi**:
1. Pastikan `.htaccess` sudah di upload ke `public_html/`
2. Check Apache mod_rewrite enabled

**Verify .htaccess**:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Issue 5: "Module not found" atau "Cannot find module"

**Solusi**:
```bash
# Via SSH (jika available)
cd /home/cpanel_username/mirov-backend
npm install
npx prisma generate

# Via cPanel
# Setup Node.js App → Run NPM Install → Restart
```

---

## 📝 Maintenance & Updates

### Update Backend:

1. **Di Laptop**:
   ```bash
   git pull
   cd server
   npm install
   npm run build
   ```

2. **ZIP ulang** folder server

3. **Upload & Extract** di cPanel (replace existing)

4. **Restart** Node.js app di cPanel

### Update Frontend:

1. **Di Laptop**:
   ```bash
   git pull
   npm install
   npm run build
   ```

2. **Upload** isi folder `dist/` ke `public_html/` (replace)

### Database Backup:

**Regular Backup**:
1. cPanel → phpMyAdmin
2. Select database → **Export**
3. Format: SQL
4. Compression: gzip
5. Download

**Scheduled Backup**:
- Setup di cPanel → Backup → Schedule backups (Daily/Weekly)

---

## 🔒 Security Checklist Production

- ✅ Ganti semua default passwords
- ✅ Gunakan JWT_SECRET yang kuat (minimal 64 characters)
- ✅ Enable SSL/HTTPS di cPanel
- ✅ Set proper file permissions (644 untuk files, 755 untuk folders)
- ✅ Protect .env files (sudah di `.htaccess`)
- ✅ Regular database backups (minimal weekly)
- ✅ Monitor application logs untuk suspicious activities
- ✅ Update dependencies secara berkala: `npm audit fix`
- ✅ Disable directory listing (sudah di `.htaccess`)
- ✅ Gunakan strong MySQL password

---

## 📊 Quick Reference

### Default Users:
| Username | Password | Role |
|----------|----------|------|
| usertaufan | taufan123 | SUPERUSER |
| userhans | hans123 | SUPERUSER |
| userjelly | jelly123 | SUPERUSER |
| adminagung | agung123 | ADMIN |
| adminamin | amin123 | ADMIN |
| adminsyaiful | syaiful123 | ADMIN |
| admindea | dea123 | ADMIN |
| umumalfi | alfi123 | UMUM |

### Important Paths:
```
Backend: /home/cpanel_username/mirov-backend/
Frontend: /home/cpanel_username/public_html/
Logs: /home/cpanel_username/logs/
Database: cPanel → phpMyAdmin
```

### Important URLs:
```
Frontend: https://yourdomain.com
Backend API: https://yourdomain.com:5000
Health Check: https://yourdomain.com:5000/health
cPanel: https://yourdomain.com:2083
```

---

## 🆘 Need Help?

Jika masih ada masalah:

1. ✅ Check **Application Logs** di cPanel
2. ✅ Check **Browser Console** (F12)
3. ✅ Check **MySQL Error Log** di cPanel
4. ✅ Contact hosting support untuk server issues
5. ✅ Review dokumentasi: `DEPLOYMENT-CPANEL.md`

---

**Created by**: rizkywildan (rzikydn)
**Repository**: https://github.com/rzikydn/Mirov
**Last Updated**: December 1, 2025
**Version**: 1.0.0

---

**🎉 Selamat! Aplikasi Mirov sudah berhasil di-deploy ke cPanel!**
