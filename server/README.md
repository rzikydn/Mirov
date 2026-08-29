# Mirov Backend - MySQL + Drizzle ORM + RBAC

Backend API dengan Node.js, Express, TypeScript, Drizzle ORM, dan MySQL dengan sistem Role-Based Access Control (RBAC).

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
- **Database**: MySQL 8.0+
- **ORM**: Drizzle ORM 0.44.7
- **Database Kit**: Drizzle Kit 0.31.7
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 3.0.2
- **Security**: Helmet, CORS, Rate Limiting

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Setup MySQL Database

Pastikan MySQL sudah terinstall dan running di komputer Anda.

Buat database baru:
```sql
CREATE DATABASE mirov_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Atau import schema langkap dari file SQL:
```bash
# Via phpMyAdmin atau command line
mysql -u root -p mirov_db < database-schema.sql
```

### 3. Configure Environment Variables

Buat file `server/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database Configuration (MySQL)
DATABASE_URL="mysql://root:@localhost:3306/mirov_db"

# JWT Configuration
JWT_SECRET=your_64_character_random_hex_string
JWT_EXPIRES_IN=7d
```

Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Push Schema to Database

```bash
npm run db:push
```

This will create all tables based on the Drizzle schema.

### 5. Seed Database

```bash
npm run db:seed
```

This will create 8 default users:
- 3 SUPERUSER: usertaufan, userhans, userjelly
- 4 ADMIN: adminagung, adminamin, adminsyaiful, admindea
- 1 UMUM: umumalfi

Default password format: `{username without prefix}123`

### 6. Build Project

```bash
npm run build
```

### 7. Run Development Server

```bash
npm run dev
```

Server will run on `http://localhost:5000`

## Available Scripts

### Development
- `npm run dev` - Run development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server

### Database (Drizzle)
- `npm run db:push` - Push schema to database
- `npm run db:generate` - Generate migration files
- `npm run db:migrate` - Run migrations
- `npm run db:seed` - Seed database with default data
- `npm run db:studio` - Open Drizzle Studio (GUI)
- `npm run db:setup` - Push schema and seed (all-in-one)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get user profile (protected)

### Schedules
- `GET /api/schedules` - Get all schedules (protected)
- `GET /api/schedules/:id` - Get schedule by ID (protected)
- `POST /api/schedules` - Create schedule (ADMIN+)
- `PUT /api/schedules/:id` - Update schedule (ADMIN+)
- `DELETE /api/schedules/:id` - Delete schedule (ADMIN+)

### Notes
- `GET /api/notes` - Get all notes (protected)
- `GET /api/notes/:id` - Get note by ID (protected)
- `POST /api/notes` - Create note (protected)
- `PUT /api/notes/:id` - Update note (protected)
- `DELETE /api/notes/:id` - Delete note (protected)

### Databases
- `GET /api/databases` - Get all databases (protected)
- `GET /api/databases/:id` - Get database by ID (protected)
- `POST /api/databases` - Create database (protected)
- `PUT /api/databases/:id` - Update database (protected)
- `DELETE /api/databases/:id` - Delete database (protected)

### History
- `GET /api/history` - Get activity history (protected)

## Default Users

| Username | Password | Role | Email |
|----------|----------|------|-------|
| usertaufan | taufan123 | SUPERUSER | usertaufan |
| userhans | hans123 | SUPERUSER | userhans |
| userjelly | jelly123 | SUPERUSER | userjelly |
| adminagung | agung123 | ADMIN | adminagung |
| adminamin | amin123 | ADMIN | adminamin |
| adminsyaiful | syaiful123 | ADMIN | adminsyaiful |
| admindea | dea123 | ADMIN | admindea |
| umumalfi | alfi123 | UMUM | umumalfi |

## Database Schema

### Tables
1. **users** - User accounts with roles
2. **schedules** - Schedule/event management
3. **notes** - Personal notes with favorite feature
4. **databases** - Custom database tables with JSON columns
5. **history** - Activity log for all operations

### Enums
- **Role**: SUPERUSER, ADMIN, UMUM
- **HistoryAction**: CREATE, EDIT, DELETE
- **HistoryTarget**: NOTE, DATABASE, SCHEDULE

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting on endpoints
- Helmet security headers
- CORS protection
- SQL injection protection (via Drizzle ORM)

## Drizzle ORM Benefits

- **Type-Safe**: Full TypeScript support
- **Lightweight**: ~30KB vs Prisma's ~500KB
- **SQL-like**: Familiar query syntax
- **Fast**: No client generation needed
- **Flexible**: Better for complex queries

## Migration from Prisma

This project was migrated from Prisma ORM to Drizzle ORM. See [DRIZZLE-MIGRATION.md](../DRIZZLE-MIGRATION.md) for details.

## Project Structure

```
server/
├── src/
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Authentication & authorization
│   ├── routes/           # API routes
│   ├── db/              # Database (Drizzle)
│   │   ├── index.ts     # DB connection
│   │   ├── schema.ts    # Table schemas
│   │   └── seed.ts      # Seed script
│   ├── utils/           # Utility functions
│   └── index.ts         # App entry point
├── dist/                # Compiled JavaScript
├── drizzle.config.ts    # Drizzle Kit config
├── tsconfig.json        # TypeScript config
├── package.json         # Dependencies
└── .env                 # Environment variables
```

## Development Workflow

1. Make changes to schema in `src/db/schema.ts`
2. Run `npm run db:push` to update database
3. Test changes with `npm run dev`
4. Build for production with `npm run build`

## Production Deployment

See [DEPLOYMENT-STEP-BY-STEP.md](../DEPLOYMENT-STEP-BY-STEP.md) for complete deployment guide to cPanel.

Quick steps:
1. Set `NODE_ENV=production` in `.env`
2. Update `DATABASE_URL` with production credentials
3. Run `npm run db:push`
4. Run `npm run db:seed` (optional)
5. Run `npm run build`
6. Run `npm start`

## Troubleshooting

### Cannot connect to database
- Check MySQL is running
- Verify `DATABASE_URL` in `.env`
- Test connection: `mysql -u root -p`

### TypeScript errors
- Run `npm run build` to check for errors
- Make sure all dependencies installed: `npm install`

### Port already in use
- Change `PORT` in `.env`
- Or kill process using port 5000

## Support

For issues and questions, see:
- [DRIZZLE-MIGRATION.md](../DRIZZLE-MIGRATION.md)
- [DATABASE-SETUP.md](./DATABASE-SETUP.md)
- [DEPLOYMENT-STEP-BY-STEP.md](../DEPLOYMENT-STEP-BY-STEP.md)

---

**Last Updated**: December 1, 2025
**Version**: 2.0.0 (Drizzle ORM)
