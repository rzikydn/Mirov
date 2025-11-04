# Backend Source Code

This directory contains the Express.js + TypeScript backend API with Prisma ORM.

## Structure

```
src/
├── controllers/      # Request handlers and business logic
│   ├── authController.ts        # Authentication logic
│   ├── databaseController.ts    # Database operations
│   ├── historyController.ts     # Audit trail
│   ├── noteController.ts        # Notes CRUD
│   └── scheduleController.ts    # Schedule CRUD
├── middleware/       # Express middleware
│   ├── authMiddleware.ts        # JWT verification
│   └── roleCheck.ts             # Role-based access control
├── routes/          # API route definitions
│   ├── authRoutes.ts           # /api/auth
│   ├── databaseRoutes.ts       # /api/databases
│   ├── historyRoutes.ts        # /api/history
│   ├── noteRoutes.ts           # /api/notes
│   ├── scheduleRoutes.ts       # /api/schedules
│   └── setupRoutes.ts          # /api/setup (SUPERUSER only)
├── utils/           # Utility functions
│   ├── hash.ts               # Password hashing (bcrypt)
│   └── token.ts              # JWT generation/verification
└── index.ts         # Application entry point
```

## Security Features

- **JWT Authentication**: Token-based auth with 7-day expiration
- **Rate Limiting**:
  - Auth endpoints: 5 requests per 15 minutes
  - General endpoints: 100 requests per 15 minutes
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options)
- **CORS**: Configured for specific client origin
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access**: SUPERUSER, ADMIN, UMUM roles

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/schedules` - Get all schedules (authenticated)
- `POST /api/schedules` - Create schedule (authenticated)
- `PUT /api/schedules/:id` - Update schedule (authenticated)
- `DELETE /api/schedules/:id` - Delete schedule (authenticated)
- `GET /api/notes` - Get all notes (authenticated)
- `POST /api/notes` - Create note (authenticated)
- `PUT /api/notes/:id` - Update note (authenticated)
- `DELETE /api/notes/:id` - Delete note (authenticated)
- `GET /api/history` - Get audit trail (authenticated)
- `DELETE /api/history/:id` - Delete history entry (ADMIN/SUPERUSER only)
- `POST /api/setup/update-roles` - Update user roles (SUPERUSER only)

## Environment Variables

Required in `server/.env`:
```
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=<64-char-hex-string>
JWT_EXPIRES_IN=7d
```

## Development

```bash
npm run dev              # Start dev server with auto-reload
npm run build           # Build TypeScript to JavaScript
npm start               # Run production build
npm run prisma:generate # Generate Prisma client
npm run prisma:push     # Push schema to database
npm run prisma:seed     # Seed database with test users
```
