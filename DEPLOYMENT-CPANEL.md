# 🚀 Deployment Guide - cPanel

Panduan lengkap untuk deploy aplikasi Mirov ke cPanel hosting.

---

## 📋 Persiapan Sebelum Deploy

### 1. Requirement cPanel:
- ✅ Node.js support (biasanya di "Setup Node.js App")
- ✅ MySQL database
- ✅ SSL Certificate (recommended)
- ✅ SSH access (optional, tapi sangat membantu)

### 2. File yang Perlu Disiapkan:
- ✅ Frontend build (hasil `npm run build`)
- ✅ Backend source code
- ✅ Database SQL file (`server/database-schema.sql`)
- ✅ Environment files (`.env`)

---

## 🗄️ STEP 1: Setup Database MySQL

### Via phpMyAdmin:

1. **Login ke cPanel** → **phpMyAdmin**

2. **Buat Database Baru**:
   ```sql
   CREATE DATABASE mirov_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   Atau via cPanel "MySQL Databases" interface

3. **Buat MySQL User**:
   - Username: `mirov_user` (atau nama lain)
   - Password: **Strong password**
   - Grant ALL privileges ke database `mirov_db`

4. **Import Schema**:
   - Pilih database `mirov_db`
   - Klik tab "Import"
   - Upload file: `server/database-schema.sql`
   - Klik "Go"
   - Verify: 8 users, 5 tables

5. **Catat Database Credentials**:
   ```
   Database Host: localhost
   Database Name: mirov_db (atau cpanel_username_mirov_db)
   Database User: mirov_user (atau cpanel_username_mirov_user)
   Database Password: your_password
   ```

---

## 🖥️ STEP 2: Setup Backend (Node.js)

### Via cPanel Node.js App:

1. **Login ke cPanel** → **Setup Node.js App**

2. **Create Application**:
   - Node.js version: **18.x** atau **20.x** (recommended)
   - Application mode: **Production**
   - Application root: `/home/username/mirov-backend` (atau path lain)
   - Application URL: `yourdomain.com` atau subdomain
   - Application startup file: `dist/index.js` (setelah build)

3. **Upload Backend Files**:

   Via File Manager atau FTP:
   ```
   /home/username/mirov-backend/
   ├── dist/              (hasil build)
   ├── node_modules/      (akan diinstall)
   ├── prisma/
   │   └── schema.prisma
   ├── .env               (PENTING!)
   ├── package.json
   └── package-lock.json
   ```

4. **Buat File `.env`** di `/home/username/mirov-backend/.env`:
   ```env
   NODE_ENV=production
   PORT=5000
   CLIENT_URL=https://yourdomain.com

   # Database Configuration
   DATABASE_URL="mysql://mirov_user:your_password@localhost:3306/mirov_db"

   # JWT Configuration (gunakan secret yang kuat!)
   JWT_SECRET=your_64_character_random_hex_string
   JWT_EXPIRES_IN=7d
   ```

5. **Build Backend** (via SSH atau Terminal di cPanel):
   ```bash
   cd /home/username/mirov-backend
   npm install
   npm run build
   npx prisma generate
   ```

6. **Start Application**:
   - Kembali ke "Setup Node.js App" di cPanel
   - Klik "Start" atau "Restart"
   - Check status: harus "Running"

7. **Test Backend**:
   ```bash
   curl https://yourdomain.com:5000/health
   # atau
   curl http://localhost:5000/health
   ```
   Expected response:
   ```json
   {
     "status": "OK",
     "message": "Server is running",
     "timestamp": "..."
   }
   ```

---

## 🎨 STEP 3: Setup Frontend (React)

### Build Frontend Locally:

1. **Update `.env` untuk production**:
   ```env
   VITE_API_URL=https://yourdomain.com:5000
   # atau jika menggunakan proxy:
   # VITE_API_URL=https://yourdomain.com/api
   ```

2. **Build Frontend**:
   ```bash
   cd /path/to/Mirov
   npm run build
   ```
   Ini akan generate folder `dist/` dengan semua file production

3. **Upload ke cPanel**:

   Via File Manager:
   - Upload semua isi folder `dist/` ke: `/home/username/public_html/`
   - Atau ke subdirectory: `/home/username/public_html/app/`

   File structure setelah upload:
   ```
   /home/username/public_html/
   ├── index.html
   ├── assets/
   │   ├── index-xxx.js
   │   ├── index-xxx.css
   │   └── ...
   ├── .htaccess    (upload ini juga!)
   └── ...
   ```

4. **Upload `.htaccess`**:
   - Upload file `.htaccess` ke `/home/username/public_html/`
   - File ini handle React Router routing

5. **Set File Permissions** (via File Manager):
   - Files: `644`
   - Directories: `755`

---

## 🔧 STEP 4: Konfigurasi Apache Proxy (Optional)

Jika ingin backend accessible via `/api` path (tanpa port):

### Edit `.htaccess` di public_html:

```apache
# Tambahkan sebelum React Router rules:

# Proxy API requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]
```

Maka frontend bisa akses API via:
```
https://yourdomain.com/api/auth/login
```
Instead of:
```
https://yourdomain.com:5000/api/auth/login
```

---

## 🔐 STEP 5: Setup SSL Certificate

### Via cPanel:

1. **Login ke cPanel** → **SSL/TLS**

2. **Install SSL**:
   - Free SSL: Let's Encrypt (via "SSL/TLS Status")
   - Atau upload SSL certificate manual

3. **Force HTTPS**:
   Uncomment di `.htaccess`:
   ```apache
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

4. **Update `.env`**:
   ```env
   # Frontend
   VITE_API_URL=https://yourdomain.com:5000

   # Backend
   CLIENT_URL=https://yourdomain.com
   ```

---

## ✅ STEP 6: Testing & Verification

### 1. Test Backend API:
```bash
# Health check
curl https://yourdomain.com:5000/health

# Login test
curl -X POST https://yourdomain.com:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"userhans","password":"hans123"}'
```

### 2. Test Frontend:
- Buka: `https://yourdomain.com`
- Login dengan: `userhans` / `hans123`
- Test semua fitur:
  - ✅ Login/Logout
  - ✅ Dashboard
  - ✅ Notes
  - ✅ Schedules
  - ✅ Databases

### 3. Check Browser Console:
- Pastikan tidak ada CORS errors
- Pastikan API calls berhasil

### 4. Check Backend Logs:
Via cPanel → Setup Node.js App → View Log

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
**Solusi**:
1. Check DATABASE_URL di `.env`
2. Test koneksi MySQL via phpMyAdmin
3. Pastikan user memiliki privileges
4. Check hostname (biasanya `localhost`)

### Error: "CORS policy"
**Solusi**:
1. Update `allowedOrigins` di `server/src/index.ts`
2. Tambahkan domain production
3. Rebuild dan restart backend

### Error: "404 Not Found" on page refresh
**Solusi**:
1. Pastikan `.htaccess` sudah di upload
2. Check Apache mod_rewrite enabled
3. Verify RewriteBase path

### Error: "502 Bad Gateway"
**Solusi**:
1. Check Node.js app running
2. Check port configuration
3. Restart Node.js app via cPanel

### Error: "Module not found"
**Solusi**:
```bash
cd /home/username/mirov-backend
npm install
npx prisma generate
npm run build
# Restart app
```

---

## 📝 Maintenance

### Update Backend:
```bash
# Via SSH
cd /home/username/mirov-backend
git pull  # jika menggunakan git
npm install
npm run build
npx prisma generate
# Restart via cPanel
```

### Update Frontend:
```bash
# Local
npm run build
# Upload dist/ ke public_html
```

### Database Backup:
Via cPanel → phpMyAdmin → Export
- Format: SQL
- Compression: gzip
- Frequency: Daily/Weekly

---

## 🔒 Security Checklist

- ✅ Change default user passwords
- ✅ Use strong JWT_SECRET
- ✅ Enable SSL/HTTPS
- ✅ Set proper file permissions
- ✅ Protect .env files
- ✅ Regular database backups
- ✅ Update Node.js dependencies
- ✅ Monitor logs for errors
- ✅ Implement rate limiting (sudah ada di code)
- ✅ Use strong MySQL password

---

## 📊 File Structure Production

```
cPanel Root (/home/username/)
│
├── public_html/                   # Frontend (React)
│   ├── index.html
│   ├── assets/
│   ├── .htaccess
│   └── ...
│
├── mirov-backend/                 # Backend (Node.js)
│   ├── dist/                      # Built files
│   │   └── index.js
│   ├── node_modules/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env                       # ⚠️ PRIVATE
│   ├── package.json
│   └── .htaccess
│
└── logs/                          # Application logs
    └── mirov-backend.log
```

---

## 🆘 Support

Jika ada masalah:
1. Check cPanel Error Log
2. Check Node.js Application Log
3. Check Browser Console
4. Check MySQL Error Log
5. Contact hosting support untuk issue server

---

**Last Updated**: December 1, 2025
**Author**: rizkywildan
**App Version**: 1.0.0
