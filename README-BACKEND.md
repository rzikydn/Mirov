# Mirov Backend - PostgreSQL + RBAC Integration

Backend API dengan Node.js, Express, TypeScript, Prisma ORM, dan PostgreSQL dengan sistem Role-Based Access Control (RBAC).

## Role System

Sistem ini memiliki 3 role user:

| Role | Permission | Access Level |
|------|-----------|--------------|
| **SUPERUSER** | Full access | Dapat melakukan semua operasi (view, add, edit, delete) |
| **ADMIN** | Manage schedules | Dapat view, add, edit, delete jadwal |
| **UMUM** | View only | Hanya dapat view jadwal, tidak bisa add/edit/delete |

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express 5.1.0
- **Language**: TypeScript 5.9.3
- **Database**: PostgreSQL
- **ORM**: Prisma 6.18.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 3.0.2

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Setup PostgreSQL Database

Pastikan PostgreSQL sudah terinstall dan running di komputer Anda.

Buat database baru:
```sql
CREATE DATABASE mirov_db;
```

### 3. Configure Environment Variables

Edit file `server/.env` dan sesuaikan dengan kredensial PostgreSQL Anda:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/mirov_db?schema=public"

# JWT Configuration
JWT_SECRET=mirov-super-secret-jwt-key-2025
JWT_EXPIRES_IN=7d
```

**Ganti `your_password` dengan password PostgreSQL Anda!**

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run Database Migration

```bash
npm run prisma:migrate
```

Prisma akan membuat tabel-tabel berikut:
- `users` - User accounts dengan role
- `schedules` - Schedule/jadwal management
- `notes` - Team notes

### 6. Seed Database (Initial Data)

```bash
npm run prisma:seed
```

Ini akan membuat 3 user default:

| Email | Password | Role | Akses |
|-------|----------|------|-------|
| superuser@mirov.com | superuser123 | SUPERUSER | Full access |
| admin@mirov.com | admin123 | ADMIN | Manage schedules |
| user@mirov.com | user12345 | UMUM | View only |

### 7. Start Development Server

```bash
npm run dev
```

Server akan running di `http://localhost:5000`

## API Endpoints

### Authentication

#### POST /api/auth/login
Login user dan mendapatkan JWT token.

**Request Body:**
```json
{
  "email": "admin@mirov.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 2,
      "name": "Admin User",
      "email": "admin@mirov.com",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/register
Register user baru (default role: UMUM).

**Request Body:**
```json
{
  "email": "newuser@mirov.com",
  "password": "password123",
  "name": "New User"
}
```

#### GET /api/auth/profile
Get user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

### Schedules Management

**Note:** Semua endpoint schedule memerlukan authentication (Bearer token).

#### GET /api/schedules
Get semua schedules.
- **Access**: All authenticated users (SUPERUSER, ADMIN, UMUM)

**Headers:**
```
Authorization: Bearer <token>
```

#### GET /api/schedules/:id
Get schedule by ID.
- **Access**: All authenticated users (SUPERUSER, ADMIN, UMUM)

#### POST /api/schedules
Create schedule baru.
- **Access**: ADMIN and SUPERUSER only

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Weekly sync",
  "startDate": "2025-01-15T10:00:00",
  "endDate": "2025-01-15T11:00:00",
  "location": "Meeting Room A",
  "status": "planned"
}
```

**Response (403) jika user UMUM:**
```json
{
  "success": false,
  "message": "Forbidden - You do not have permission to access this resource",
  "requiredRole": ["ADMIN", "SUPERUSER"],
  "yourRole": "UMUM"
}
```

#### PUT /api/schedules/:id
Update schedule.
- **Access**: ADMIN and SUPERUSER only

**Request Body:**
```json
{
  "title": "Updated Meeting",
  "status": "completed"
}
```

#### DELETE /api/schedules/:id
Delete schedule.
- **Access**: ADMIN and SUPERUSER only

## Database Schema

### User Model
```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  name      String
  role      Role      @default(UMUM)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

enum Role {
  SUPERUSER
  ADMIN
  UMUM
}
```

### Schedule Model
```prisma
model Schedule {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime
  location    String?
  status      String   @default("planned")
  createdBy   Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server dengan hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migration |
| `npm run prisma:seed` | Seed database dengan initial data |
| `npm run db:reset` | Reset database (hapus semua data) |
| `npm run db:setup` | Migration + Seed (setup lengkap) |

## Testing RBAC

### 1. Login sebagai SUPERUSER
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superuser@mirov.com","password":"superuser123"}'
```

### 2. Login sebagai ADMIN
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mirov.com","password":"admin123"}'
```

### 3. Login sebagai UMUM
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mirov.com","password":"user12345"}'
```

### 4. Test Create Schedule (hanya ADMIN/SUPERUSER)
```bash
# Dengan token ADMIN - SUCCESS
curl -X POST http://localhost:5000/api/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "title": "New Meeting",
    "startDate": "2025-01-20T10:00:00",
    "endDate": "2025-01-20T11:00:00"
  }'

# Dengan token UMUM - FORBIDDEN (403)
curl -X POST http://localhost:5000/api/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <umum_token>" \
  -d '{
    "title": "New Meeting",
    "startDate": "2025-01-20T10:00:00",
    "endDate": "2025-01-20T11:00:00"
  }'
```

## Troubleshooting

### Error: "Missing required environment variable: DATABASE_URL"
Pastikan file `.env` sudah dibuat dan `DATABASE_URL` sudah diisi dengan benar.

### Error: "Cannot connect to database"
- Pastikan PostgreSQL service running
- Check kredensial database (username, password, port)
- Pastikan database `mirov_db` sudah dibuat

### Error: "prisma command not found"
```bash
npm install
npm run prisma:generate
```

### Reset Database
Jika ingin reset database dan mulai dari awal:
```bash
npm run db:reset
npm run db:setup
```

## Frontend Integration

Update file `c:\Users\LENOVO YOGA Pro 7i\Mirov\.env`:

```env
VITE_API_URL=http://localhost:5000
```

Frontend sudah dikonfigurasi untuk:
- Menerima role dari backend response
- Store role di AuthContext
- Helper functions: `hasRole()`, `canManageSchedules()`

## Security Notes

- Password di-hash menggunakan bcryptjs dengan salt rounds 10
- JWT token expires dalam 7 hari (configurable)
- CORS dikonfigurasi untuk frontend di `http://localhost:5173`
- Semua endpoint schedule protected dengan authentication middleware
- Role checking dilakukan di backend untuk security

## Production Deployment

1. Change `JWT_SECRET` ke random string yang kuat
2. Set `NODE_ENV=production`
3. Gunakan environment variables yang secure (jangan commit `.env`)
4. Pastikan database credentials aman
5. Enable HTTPS
6. Configure CORS untuk production domain

## Support

Jika ada pertanyaan atau issue, silakan hubungi tim development.
