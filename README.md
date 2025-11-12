# Mirov - Internal Management System

Sistem manajemen internal yang aman dan modern untuk mengelola jadwal, catatan, dan database tim dengan role-based access control (RBAC).

## Features

### Core Features
- **Authentication & Authorization**: Login sistem dengan JWT dan role-based access (SUPERUSER, ADMIN, UMUM)
  - Protected routes dengan automatic redirect
  - Browser back/forward button protection
  - Session validation on navigation
- **Schedule Management**: Kelola jadwal meeting, event, dan kegiatan tim
- **Team Notes**: Sistem catatan kolaboratif dengan warna custom dan keyboard shortcuts (Ctrl+Enter)
  - Support 3 warna post-it: Red, Yellow, Green (cycling order)
  - Favorite notes feature (⭐ ADMIN & SUPERUSER only)
- **Database Manager**: Kelola database internal dengan interface Notion-style yang powerful
  - Support multiple column types (Text, Number, Date, Checkbox)
  - Multi-level sorting dengan default descending untuk date columns
  - Flexible column resize (minimum 40px width)
  - Freeze first column untuk navigasi mudah
  - Freeze header (sticky header) saat scroll vertical
  - Export to JSON & Excel (XLSX) dengan formatting
  - Real-time sync dengan backend
  - Auto-create 4 default rows untuk database baru
  - Dynamic table width calculation (no empty space)
- **History & Audit Trail**: Tracking semua aktivitas user dengan detail lengkap (khusus ADMIN & SUPERUSER)
  - Detailed activity logging (Create, Edit, Delete)
  - Smart history tracking - hanya mencatat perubahan final (tidak per keystroke)
  - Visual row position tracking dengan identifier kolom pertama
  - History format: "User updated 'Column' in row X (FirstColumn: 'Value') from 'old' to 'new'"
  - Add Property action tracking
  - Bulk delete untuk history management (SUPERUSER only)
- **Dark Mode**: Tema gelap untuk kenyamanan mata
- **Responsive Design**: Optimized untuk desktop, tablet, dan mobile (iOS/Android)

### Security Features
- **Rate Limiting**: Pembatasan request per IP address
- **Helmet Security**: HTTP security headers lengkap
- **Password Hashing**: bcrypt dengan 10 salt rounds
- **JWT Authentication**: Token-based auth dengan expiration
- **Role-Based Access Control (RBAC)**: Granular permissions per role
- **SQL Injection Prevention**: Prisma ORM dengan prepared statements
- **XSS Protection**: React auto-escaping dan CSP headers
- **Browser Navigation Protection**: Prevents unauthorized access via browser back/forward buttons
  - Automatic session validation on popstate events
  - Replace history instead of push to prevent back button bypass
  - Token verification on every navigation event

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

## Architecture

### System Architecture
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │◄───────►│  Express API    │◄───────►│  PostgreSQL DB  │
│  (Vite + TS)    │  REST   │  (Node.js + TS) │  Prisma │                 │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
  Context API              JWT Authentication
  State Management         Rate Limiting
  Dark Mode                Helmet Security
```

### Data Flow
1. **User Action** → Component triggers action
2. **Context/State** → Update local state via Context API
3. **API Request** → Send request to backend with JWT token
4. **Authentication** → Middleware verifies token and role
5. **Database Operation** → Prisma ORM queries PostgreSQL
6. **Response** → Data sent back to frontend
7. **History Logging** → Activity recorded in history table
8. **UI Update** → Component re-renders with new data

## Project Structure

```
Mirov/
├── src/                           # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── auth/                  # Login, registration components
│   │   ├── dashboards/            # Main dashboard components
│   │   │   ├── modals/            # Modal components (History, Export, etc)
│   │   │   ├── DatabaseTable.tsx  # Database manager (767 lines)
│   │   │   ├── TeamNotes.tsx      # Team notes with favorites
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   ├── EmojiPicker.tsx    # Emoji picker for database icons
│   │   │   ├── TypeChangeDropdown.tsx  # Column type selector
│   │   │   └── SortDropdown.tsx   # Multi-level sort dropdown
│   │   └── layout/                # Layout components
│   ├── context/
│   │   ├── AuthContext.tsx        # Authentication state
│   │   └── HistoryContext.tsx     # History/audit trail state
│   ├── constants/
│   │   ├── emojis.ts              # 140+ emojis organized by category
│   │   ├── propertyTypeIcons.tsx  # Icons for column types
│   │   └── dashboard.ts           # Dashboard constants
│   ├── utils/
│   │   ├── sortingUtils.ts        # Multi-level sorting logic
│   │   ├── exportUtils.ts         # JSON & Excel export functions
│   │   └── databaseUtils.ts       # Database operations helpers
│   ├── styles/
│   │   └── dateInputStyles.ts     # Date input dark mode styles
│   ├── types/
│   │   └── database.ts            # TypeScript interfaces
│   ├── assets/                    # Static assets (images, icons)
│   ├── index.css                  # Global styles (Tailwind + custom)
│   ├── App.tsx                    # Main app component with routing
│   └── main.tsx                   # React entry point
├── server/                        # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts        # Login, register, profile
│   │   │   ├── scheduleController.ts    # Schedule CRUD
│   │   │   ├── noteController.ts        # Notes CRUD with favorites
│   │   │   ├── databaseController.ts    # Database CRUD
│   │   │   └── historyController.ts     # History & audit trail
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts        # JWT verification
│   │   │   ├── roleMiddleware.ts        # RBAC enforcement
│   │   │   └── rateLimitMiddleware.ts   # Rate limiting
│   │   ├── routes/
│   │   │   ├── auth.ts            # Auth routes
│   │   │   ├── schedules.ts       # Schedule routes
│   │   │   ├── notes.ts           # Notes routes
│   │   │   ├── databases.ts       # Database routes
│   │   │   └── history.ts         # History routes
│   │   ├── utils/
│   │   │   ├── jwt.ts             # JWT token utilities
│   │   │   └── password.ts        # Password hashing
│   │   └── index.ts               # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.ts                # Seed data (8 default users)
│   ├── .env                       # Environment variables
│   └── package.json
├── docs/                          # Documentation
│   ├── KREDENSIAL-USER.md         # User credentials
│   ├── SECURITY-AUDIT.md          # Security audit report
│   ├── FAVORITE-NOTES.md          # Favorite notes documentation
│   ├── TROUBLESHOOTING.md         # Common issues & solutions
│   └── API.http                   # API testing examples
├── .env                           # Frontend environment variables
├── package.json
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file (you are here)
```

### Component Hierarchy (Frontend)
```
App.tsx
├── AuthContext.Provider
│   └── HistoryContext.Provider
│       ├── /login → Login Component
│       └── /dashboard → Dashboard
│           ├── Sidebar
│           │   ├── Navigation Links
│           │   └── Database List
│           ├── Header
│           │   ├── Dark Mode Toggle
│           │   ├── History Button
│           │   └── User Profile
│           ├── Main Content
│           │   ├── Schedule → ScheduleManager
│           │   ├── Notes → TeamNotes
│           │   │   ├── Note Cards
│           │   │   ├── Color Picker
│           │   │   └── Favorite Stars
│           │   └── Database → DatabaseTable
│           │       ├── Table Header (sticky)
│           │       ├── Column Headers
│           │       │   ├── TypeChangeDropdown
│           │       │   └── Column Name Input
│           │       ├── Table Body
│           │       │   └── Cell Inputs (Text/Number/Date/Checkbox)
│           │       ├── Sort Button → SortDropdown
│           │       ├── Export Button → ExportModal
│           │       └── EmojiPicker (for icon selection)
│           └── Modals (conditional rendering)
│               ├── HistoryModal
│               ├── ExportModal
│               ├── AddPropertyModal
│               └── DeleteModal
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
| **Databases** | | | |
| View Databases | ✅ | ✅ | ✅ |
| Create Database | ✅ | ✅ | ❌ |
| Edit Database Content | ✅ | ✅ | ❌ |
| Edit Database Structure | ✅ | ❌ | ❌ |
| Delete Database | ✅ | ❌ | ❌ |
| Add/Delete Columns | ✅ | ❌ | ❌ |
| Change Column Types | ✅ | ❌ | ❌ |
| Rename Columns | ✅ | ❌ | ❌ |
| Add/Delete Rows | ✅ | ✅ | ❌ |
| Edit Cell Values | ✅ | ✅ | ❌ |
| Export Database | ✅ | ✅ | ✅ |
| **History & Audit** | | | |
| View History | ✅ | ✅ | ❌ |
| Delete History | ✅ | ❌ | ❌ |
| Bulk Delete History | ✅ | ❌ | ❌ |
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

### Databases
- `GET /api/databases` - Get all databases
- `POST /api/databases` - Create database (ADMIN/SUPERUSER)
- `PUT /api/databases/:id` - Update database
- `DELETE /api/databases/:id` - Delete database (SUPERUSER only)

**Database Structure:**
```json
{
  "id": 1,
  "name": "🏦 PROGRAM UKMR",
  "description": "Database untuk tracking program UKMR",
  "icon": "🏦",
  "columns": [
    {
      "key": "tanggal-123456",
      "label": "TANGGAL",
      "type": "date"
    },
    {
      "key": "pic-123457",
      "label": "PIC",
      "type": "text"
    }
  ],
  "rows": [
    {
      "id": "row-123458",
      "properties": {
        "tanggal-123456": {
          "value": "2025-01-15",
          "type": "date"
        },
        "pic-123457": {
          "value": "Amin",
          "type": "text"
        }
      }
    }
  ]
}
```

### History
- `GET /api/history` - Get audit trail
- `POST /api/history` - Add history entry
- `DELETE /api/history/:id` - Delete history entry (SUPERUSER only)
- `POST /api/history/bulk-delete` - Bulk delete history (SUPERUSER only)

**History Entry Structure:**
```json
{
  "id": 1,
  "userName": "Amin",
  "userRole": "ADMIN",
  "action": "added" | "edit" | "delete" | "create",
  "target": "database" | "note" | "schedule",
  "targetName": "🏦 PROGRAM UKMR",
  "description": "Amin added new column 'Priority' (type: text) to database '🏦 PROGRAM UKMR'",
  "createdAt": "2025-01-11T..."
}
```

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

## Keyboard Shortcuts

### Team Notes
- `Ctrl + Enter` atau `Cmd + Enter` - Save note (saat mengetik di textarea)

### Database Manager
- `Enter` - Save saat menambah property/column baru (di modal Add Property)

### General
- Semua user dapat menggunakan keyboard shortcuts untuk mempercepat workflow

## Database Manager - Detailed Features

### Column Types
1. **Text** - Text bebas, cocok untuk nama, deskripsi, dll
2. **Number** - Angka, cocok untuk jumlah, harga, score, dll
3. **Date** - Tanggal dengan date picker, cocok untuk deadline, event date, dll
4. **Checkbox** - True/False, cocok untuk status completion, approval, dll

### Sorting Features
- **Multi-level sorting**: Sort berdasarkan multiple columns sekaligus
- **Ascending/Descending**: Pilih urutan naik atau turun per column
- **Priority-based**: Column pertama dalam sort list memiliki prioritas tertinggi
- **Visual indicators**: Badge menunjukkan urutan sort (1, 2, 3, ...)
- **Smart defaults**: Date columns automatically sort in descending order (newest first)

### Table UI Features
- **Freeze First Column**: First column stays visible when scrolling horizontally with sticky positioning
- **Freeze Header**: Column headers stay visible when scrolling vertically (sticky header)
- **Flexible Column Resize**: Resize columns independently (minimum 40px width)
  - Drag column border to resize
  - Only affects the specific column being resized (Excel-like behavior)
  - Preserves other column widths
- **Dynamic Table Width**: Auto-adjusts to content with JavaScript calculation, eliminates empty space
- **Z-Index Hierarchy**: Smart z-index management ensures dropdowns appear above table content
- **Responsive Buttons**: Mobile-optimized button sizes and layout (compact on small screens)
- **Auto 4 Default Rows**: New databases automatically create 4 rows to prevent dropdown cutoff

### Export Features
1. **JSON Export**
   - Export seluruh database structure dan data
   - Format JSON standard untuk integrasi dengan sistem lain
   - Includes: columns definition, rows data, metadata

2. **Excel (XLSX) Export**
   - Export dengan formatting professional
   - Header dengan bold dan colored background
   - Auto-width columns untuk readability
   - Support untuk semua column types
   - File naming: `[DatabaseName]_[Timestamp].xlsx`

### History Tracking
Setiap perubahan pada database dicatat dengan detail:
- **Added** (Purple badge): Menambah column baru, row baru
- **Changed** (Blue badge): Edit nama database, column, cell value
- **Deleted** (Red badge): Hapus column, row

**Smart History Features:**
- **Focus/Blur Pattern**: Hanya mencatat perubahan final (tidak per keystroke)
  - Column rename: Recorded on blur, bukan setiap huruf diketik
  - Cell edit: Recorded on blur setelah selesai edit
- **Visual Row Position**: Menggunakan sorted row position (bukan array index)
  - Menampilkan nomor baris yang benar sesuai tampilan user
  - Include first column value sebagai identifier: "row 3 (Name: 'John')"
- **Detailed Descriptions**: Clear, descriptive history messages
  - Column operations: "added new column 'Priority' (type: text)"
  - Cell updates: "updated 'Status' in row 3 (Name: 'John') from 'Pending' to 'Completed'"
  - Add Property tracking: Mencatat penambahan column dengan error handling

**Contoh History Entry:**
- "Amin added new column 'Priority' (type: text) to database '🏦 PROGRAM UKMR'"
- "Amin updated 'Status' in row 3 (Name: 'John') from 'Pending' to 'Completed' in database '🏦 PROGRAM UKMR'"
- "Amin deleted column 'Old Field' from database '🏦 PROGRAM UKMR'"

### Permission System (Database)
- **SUPERUSER**: Full control - manage structure, content, delete
- **ADMIN**: Edit content only - add/delete rows, edit cell values
- **UMUM**: View only - can view dan export database

### Mobile Optimization
- Responsive table dengan horizontal scroll
- Sticky first column untuk navigasi mudah
- Touch-friendly buttons dan inputs
- Optimized date picker untuk mobile devices
- Compact date column dengan proper icon spacing

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

## Known Issues & Workarounds

### Frontend
1. **Date Input pada Mobile**
   - Issue: Icon kalender overlap dengan text tanggal
   - Status: ✅ Fixed - Icon diposisikan dengan proper spacing
   - Workaround: Sudah tidak diperlukan

2. **Type Dropdown Terpotong**
   - Issue: Dropdown type saat membuat database table terpotong
   - Status: ✅ Fixed - Menggunakan z-index 10000 dan dynamic overflow
   - Workaround: Sudah tidak diperlukan

3. **Empty Space di Pojok Kanan Table**
   - Issue: White space area di right corner database table
   - Status: ✅ Fixed - Dynamic table width calculation dengan JavaScript state
   - Solution: `Math.max(totalWidth, containerWidth)` ensures no empty space
   - Workaround: Sudah tidak diperlukan

4. **Column Resize Affecting Other Columns**
   - Issue: Resize satu kolom membuat kolom lain ikut bergerak
   - Status: ✅ Fixed - Changed minWidth to maxWidth, reduced min to 40px
   - Solution: Excel-like behavior - hanya kolom yang di-drag yang berubah
   - Workaround: Sudah tidak diperlukan

5. **History Recording Per Keystroke**
   - Issue: Column rename mencatat setiap huruf yang diketik
   - Status: ✅ Fixed - Implemented focus/blur pattern
   - Solution: Save initial value on focus, record only final value on blur
   - Workaround: Sudah tidak diperlukan

6. **Incorrect Row Numbers in History**
   - Issue: History menunjukkan nomor baris yang salah (tidak sesuai tampilan)
   - Status: ✅ Fixed - Using getSortedRows() for visual position
   - Solution: Track visual row position instead of array index
   - Workaround: Sudah tidak diperlukan

7. **Add Property Not Tracked**
   - Issue: Add Property action tidak tercatat di history
   - Status: ✅ Fixed - Added await and try-catch error handling
   - Solution: Ensure database update completes before history recording
   - Workaround: Sudah tidak diperlukan

8. **Browser Back Button Bypass Auth**
   - Issue: User bisa back ke dashboard tanpa logout dengan browser button
   - Status: ✅ Fixed - Added popstate event listeners
   - Solution: Validate token on every popstate event, use replace: true
   - Workaround: Sudah tidak diperlukan

### Backend
1. **No Known Critical Issues**
   - Backend berjalan stabil dengan proper error handling

### General
1. **Performance dengan Data Besar**
   - Concern: Database table dengan 100+ rows mungkin perlu pagination
   - Status: Monitoring - Belum menjadi issue aktual
   - Recommendation: Implement virtual scrolling jika data melebihi 200 rows

## Future Improvements & Roadmap

### Version 1.1.0 (Planned)
- [ ] CSRF Protection implementation
- [ ] Input sanitization dengan DOMPurify
- [ ] Database table pagination untuk large datasets
- [ ] Column filtering & search
- [ ] Database templates untuk quick start
- [ ] Bulk operations untuk rows (copy, move, delete multiple)

### Version 1.2.0 (Future)
- [ ] Real-time collaboration (WebSocket)
- [ ] Comment system untuk database cells
- [ ] File attachment support
- [ ] Advanced formula calculations
- [ ] API rate limiting per user (bukan per IP)
- [ ] Two-factor authentication (2FA)

### Version 2.0.0 (Long-term)
- [ ] Mobile native app (React Native)
- [ ] Offline mode dengan sync
- [ ] Advanced reporting & analytics
- [ ] Integration dengan third-party tools (Slack, Teams, etc)
- [ ] Custom workflows & automation
- [ ] AI-powered insights

## Maintenance & Updates

### Regular Tasks
1. **Weekly**
   - Check application logs untuk errors
   - Monitor database performance
   - Review security alerts

2. **Monthly**
   - Run `npm audit` dan fix vulnerabilities
   - Update dependencies (`npm update`)
   - Review and cleanup old history entries
   - Database backup verification

3. **Quarterly**
   - Security audit full system
   - Performance optimization review
   - User feedback review & implementation
   - Documentation updates

### Backup Strategy
- **Database**: Auto-backup daily via Railway/hosting provider
- **Code**: Version controlled via Git
- **Environment Variables**: Documented secara terpisah (tidak di Git)
- **Recovery Time Objective (RTO)**: < 4 hours
- **Recovery Point Objective (RPO)**: < 24 hours

## Changelog

### [Current] - 2025-01-12
#### Added
- **Browser Navigation Protection**: Popstate event listeners untuk prevent auth bypass
  - Token validation on browser back/forward navigation
  - Replace history instead of push to prevent back button bypass
- **Smart History Tracking**: Focus/blur pattern untuk prevent per-keystroke recording
  - Visual row position tracking dengan sorted rows
  - Row identifier menggunakan first column value
  - Add Property action tracking dengan error handling
- **Table UI Enhancements**:
  - Freeze first column (sticky positioning dengan z-index hierarchy)
  - Freeze header (sticky header saat vertical scroll)
  - Flexible column resize (minimum 40px, Excel-like behavior)
  - Dynamic table width calculation (eliminates empty space)
  - Auto 4 default rows untuk new databases
  - Z-index management untuk dropdown visibility

#### Fixed
- **Empty space at right corner** of database table (multiple iterations)
  - Solution: Dynamic width calculation dengan `Math.max(totalWidth, containerWidth)`
- **Column resize affecting other columns**
  - Solution: Changed minWidth to maxWidth, reduced minimum to 40px
- **History recording per keystroke** untuk column rename
  - Solution: Implemented focus/blur pattern
- **Incorrect row numbers in history** (showing array index instead of visual position)
  - Solution: Using getSortedRows() for accurate row position
- **Add Property not tracked** in history
  - Solution: Await database update, added try-catch error handling
- **Browser back button bypassing auth**
  - Solution: Popstate event listeners dengan token validation
- **Type dropdown covered by table**
  - Solution: Z-index 10000 and dynamic overflow management
- **Date columns default sort** to descending automatically

#### Changed
- Team Notes post-it colors: Reduced dari 6 colors to 3 (Red, Yellow, Green)
- Button layout: Responsive sizes untuk mobile (sm: breakpoints)
- Column resize minimum: Reduced dari 80px to 40px untuk flexibility

### [1.1.0] - 2025-01-11
#### Added
- Database Manager dengan Notion-style interface
- Multi-level sorting untuk database tables
- Export to JSON & Excel (XLSX) dengan formatting
- Detailed history tracking (Added, Changed, Deleted actions)
- Keyboard shortcuts (Enter untuk save di modals, Ctrl+Enter untuk notes)
- Bulk delete history (SUPERUSER only)
- Mobile optimization untuk date picker
- Sticky first column untuk better navigation

#### Fixed
- Date input icon positioning pada mobile devices
- Type dropdown terpotong issue
- Permission system untuk database operations
- History detail descriptions untuk setiap action

#### Changed
- DatabaseTable.tsx refactored dari 1519 lines menjadi 767 lines (49.5% reduction)
- History action types: menambahkan "added" untuk distinction
- Sidebar width dikurangi 25% untuk more content space

### [1.0.0] - 2025-01-04
#### Initial Release
- Authentication system dengan JWT
- Role-Based Access Control (RBAC)
- Schedule Management
- Team Notes dengan favorite feature
- History & Audit Trail
- Dark Mode
- Security features (Rate Limiting, Helmet, Password Hashing)

## Support

Jika ada pertanyaan atau issue, silakan hubungi tim IT kantor atau buat issue di repository ini.

### Contact Information
- **Technical Support**: it-support@mirov.internal
- **Security Issues**: security@mirov.internal
- **Feature Requests**: product@mirov.internal

### Useful Links
- [Documentation](docs/)
- [API Reference](docs/API.http)
- [Security Audit](docs/SECURITY-AUDIT.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

---

**Made with ❤️ by Team Mirov**

Last Updated: January 12, 2025
Version: 1.2.0 (In Development)
