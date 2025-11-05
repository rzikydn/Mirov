# Mirov - Internal Management System

Sistem manajemen internal yang aman dan modern untuk mengelola jadwal, catatan, dan database tim dengan role-based access control (RBAC).

## Features

### Core Features
- **Authentication & Authorization**: Login sistem dengan JWT dan role-based access (SUPERUSER, ADMIN, UMUM)
- **Schedule Management**: Kelola jadwal meeting, event, dan kegiatan tim
- **Team Notes**: Sistem catatan kolaboratif dengan warna custom
- **Database Manager**: Kelola database internal dengan interface yang mudah
- **History & Audit Trail**: Tracking semua aktivitas user dengan detail lengkap (khusus ADMIN & SUPERUSER)
- **Dark Mode**: Tema gelap untuk kenyamanan mata

### Note Features ⭐ NEW
- **Favorite Notes**: Tandai catatan penting dengan sistem favorit (bintang kuning)
- **Optimistic UI**: Animasi langsung tanpa loading saat toggle favorit
- **Visual Feedback**: Animasi smooth dengan scale effect dan color transition
- **Smart History**: History tracking otomatis untuk favorite/unfavorite actions

### Security Features
- **Rate Limiting**: Pembatasan request per IP address
- **Helmet Security**: HTTP security headers lengkap
- **Password Hashing**: bcrypt dengan 10 salt rounds
- **JWT Authentication**: Token-based auth dengan expiration
- **Role-Based Access Control (RBAC)**: Granular permissions per role
- **SQL Injection Prevention**: Prisma ORM dengan prepared statements
- **XSS Protection**: React auto-escaping dan CSP headers

## Tech Stack

### Frontend
- **React 18** dengan TypeScript
- **Vite** untuk build tool yang cepat
- **Tailwind CSS** untuk styling
- **Framer Motion** untuk animasi
- **React Router** untuk routing

### Backend
- **Express.js** dengan TypeScript
- **Prisma ORM** dengan PostgreSQL
- **JWT** untuk authentication
- **bcrypt** untuk password hashing
- **express-rate-limit** untuk security
- **helmet** untuk HTTP security headers

## Project Structure

```
Mirov/
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # React components
│   ├── assets/            # Static assets
│   ├── lib/               # Utility libraries
│   └── App.tsx            # Main app component
├── server/                # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utility functions
│   └── prisma/           # Database schema & migrations
├── docs/                  # Documentation
└── README.md             # This file
```

## Installation

### Prerequisites
- Node.js 20.x atau lebih baru
- PostgreSQL 14.x atau lebih baru
- npm atau yarn

### 1. Clone Repository
```bash
git clone <repository-url>
cd Mirov
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
```

### 3. Environment Setup

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

**Backend (server/.env):**
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

DATABASE_URL="postgresql://username:password@localhost:5432/mirov_db?schema=public"

JWT_SECRET=<generate-with-crypto>
JWT_EXPIRES_IN=7d
```

Generate JWT secret dengan:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Database Setup

```bash
cd server

# Push schema ke database
npm run prisma:push

# Seed database dengan user default
npm run prisma:seed
```

### 5. Run Development

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Aplikasi akan berjalan di:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Default Users

Setelah seed database, Anda bisa login dengan kredensial berikut:

### SUPERUSER (3 users)
| Name    | Username     | Password    |
|---------|--------------|-------------|
| Taufan  | usertaufan   | taufan123   |
| Hans    | userhans     | hans123     |
| Jelly   | userjelly    | jelly123    |

### ADMIN (4 users)
| Name    | Username       | Password     |
|---------|----------------|--------------|
| Agung   | adminagung     | agung123     |
| Amin    | adminamin      | amin123      |
| Syaiful | adminsyaiful   | syaiful123   |
| Dea     | admindea       | dea123       |

### UMUM (1 user)
| Name | Username   | Password |
|------|------------|----------|
| Alfi | umumalfi   | alfi123  |

Lihat [docs/KREDENSIAL-USER.md](docs/KREDENSIAL-USER.md) untuk detail lengkap.

## User Roles & Permissions

| Feature | SUPERUSER | ADMIN | UMUM |
|---------|:---------:|:-----:|:----:|
| **Schedules** | | | |
| View Schedules | ✅ | ✅ | ✅ |
| Create Schedule | ✅ | ✅ | ❌ |
| Edit Schedule | ✅ | ✅ | ❌ |
| Delete Schedule | ✅ | ✅ | ❌ |
| **Notes** | | | |
| View Notes | ✅ | ✅ | ✅ |
| Create Note | ✅ | ✅ | ✅ |
| Edit Note | ✅ | ✅ | ✅ (own only) |
| Delete Note | ✅ | ✅ | ✅ (own only) |
| **Favorite Notes ⭐** | ✅ | ✅ | ❌ |
| **History & Audit** | | | |
| View History | ✅ | ✅ | ❌ |
| Delete History | ✅ | ❌ | ❌ |
| **User Management** | | | |
| Manage Users | ✅ | ❌ | ❌ |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Schedules
- `GET /api/schedules` - Get all schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule

### Notes
- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note (including favorite status)
- `DELETE /api/notes/:id` - Delete note

**Note Fields:**
```json
{
  "id": 1,
  "title": "Note Title",
  "content": "Note content",
  "color": "#FFD89B",
  "favorite": true,
  "userId": 1,
  "createdAt": "2025-01-04T...",
  "updatedAt": "2025-01-04T..."
}
```

### History
- `GET /api/history` - Get audit trail
- `DELETE /api/history/:id` - Delete history entry (ADMIN/SUPERUSER only)

Lihat [docs/API.http](docs/API.http) untuk contoh request lengkap.

## Security

### Implemented Security Measures ✅

**Rate Limiting:**
- Auth endpoints: 20 requests per 15 minutes per IP
- General endpoints: 100 requests per 15 minutes per IP
- Disabled in development for testing

**Security Headers (Helmet):**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options

**Authentication & Authorization:**
- JWT with 7-day expiration
- Password hashing dengan bcrypt (10 salt rounds)
- Protected routes dengan middleware
- Role-based access control (RBAC)

**Database Security:**
- Prisma ORM untuk SQL injection prevention
- Parameterized queries
- Password field never exposed in responses

### Security Audit Results 🔒

**Overall Score:** 7/10

**Status:**
- ✅ No backend dependency vulnerabilities
- ✅ Strong password hashing
- ✅ SQL injection protected
- ⚠️ 7 frontend dependency vulnerabilities (needs update)
- ⚠️ Missing CSRF protection
- ⚠️ No input sanitization (XSS risk)

**For detailed security audit report, see:** [docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md)

### Known Security Issues & Mitigations

1. **Frontend Dependencies (7 vulnerabilities)**
   - Status: Known issue
   - Severity: 1 High, 4 Moderate, 2 Low
   - Action: Run `npm audit fix` regularly

2. **CSRF Protection**
   - Status: Not implemented yet
   - Mitigation: CORS restricted to specific origin
   - Roadmap: Planned for v1.1.0

3. **XSS Protection**
   - Status: React auto-escaping only
   - Mitigation: TypeScript type safety
   - Roadmap: DOMPurify implementation planned

### Security Best Practices for Developers

When contributing to this project:

1. **Never commit secrets** - Use .env files
2. **Sanitize all user input** - Validate and escape
3. **Test authentication** - Verify role permissions
4. **Update dependencies** - Run `npm audit` regularly
5. **Review security audit** - Read [SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md)

### Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** create a public GitHub issue
2. Contact security team directly: security@mirov.internal
3. Provide detailed information about the vulnerability
4. Allow time for fix before public disclosure

## Development

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Scripts
```bash
npm run dev              # Start dev server with auto-reload
npm run build            # Build TypeScript to JavaScript
npm start                # Run production build
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to database
npm run prisma:seed      # Seed database
```

## Deployment

### Frontend (Vercel)
1. Push ke GitHub
2. Connect repository ke Vercel
3. Set environment variable: `VITE_API_URL`
4. Deploy

### Backend (Railway)
1. Push ke GitHub
2. Connect repository ke Railway
3. Set environment variables (DATABASE_URL, JWT_SECRET, dll)
4. Railway akan auto-detect `nixpacks.toml` dan build

Lihat [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) untuk panduan deployment lengkap.

## Documentation

Dokumentasi lengkap tersedia di folder [docs/](docs/):
- [KREDENSIAL-USER.md](docs/KREDENSIAL-USER.md) - User credentials & permissions
- [FAVORITE-NOTES.md](docs/FAVORITE-NOTES.md) - Favorite notes feature documentation ⭐
- [SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md) - Security audit report & recommendations 🔒
- [PRODUCTION-DATABASE-SETUP.md](docs/PRODUCTION-DATABASE-SETUP.md) - Panduan setup database production 🚀
- [RAILWAY-SQL-UPDATE.sql](docs/RAILWAY-SQL-UPDATE.sql) - SQL untuk update user di Railway 🔧
- [API.http](docs/API.http) - API testing dengan REST Client
- [TEST-API.md](docs/TEST-API.md) - API testing guide
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - Common issues & solutions
- [update-roles.sql](docs/update-roles.sql) - SQL script untuk update roles

## Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

Jika ada pertanyaan atau issue, silakan hubungi tim IT kantor atau buat issue di repository ini.

---

Made with by Team Mirov
